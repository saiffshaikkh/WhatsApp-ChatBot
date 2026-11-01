import { z } from 'zod';
import {
  normalizeProduct,
  type Product,
  type ProductEvidence,
  type InventoryObservation,
} from './models.js';
import type { EcommerceProvider } from './provider.js';

const requestSchema = z.string().trim().min(1).max(256);
function requestText(value: string) {
  const parsed = requestSchema.safeParse(value);
  if (!parsed.success) throw new Error('Invalid ecommerce request');
  return parsed.data;
}
export class MockEcommerceProvider implements EcommerceProvider {
  private readonly products: Product[];

  constructor(
    records: readonly { data: unknown; evidence: ProductEvidence }[] = [],
  ) {
    this.products = records.map(({ data, evidence }) => {
      const product = normalizeProduct(data, evidence);
      return { ...product, source: { ...product.source, kind: 'mock' } };
    });
    const uniqueIds = (items: readonly Pick<Product, 'id'>[]) => {
      const ids = items.flatMap((item) => (item.id ? [item.id] : []));
      if (new Set(ids).size !== ids.length)
        throw new Error('Duplicate ecommerce identifier');
    };
    uniqueIds(this.products);
    for (const product of this.products) uniqueIds(product.variants);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const term = requestText(query).toLowerCase();
    return structuredClone(
      this.products.filter((product) =>
        [
          product.name,
          product.id,
          product.sku,
          product.structuredSku,
          product.mpn,
        ].some((field) => field?.toLowerCase().includes(term)),
      ),
    );
  }

  async getProduct(productId: string): Promise<Product | null> {
    const id = requestText(productId);
    return structuredClone(
      this.products.find((product) => product.id === id) ?? null,
    );
  }

  async checkStock(
    productId: string,
    variantId?: string,
  ): Promise<InventoryObservation | null> {
    const variant =
      variantId === undefined ? undefined : requestText(variantId);
    const product = await this.getProduct(productId);
    if (!product) return null;
    const item =
      variant === undefined
        ? product
        : product.variants.find((item) => item.id === variant);
    return item ? { ...item.availability, source: product.source } : null;
  }
}
