import type { InventoryObservation, Product } from './models.js';

// Read-only normalized observations. Implementations must not expose raw responses or build URLs.
export interface EcommerceProvider {
  searchProducts(query: string): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  checkStock(
    productId: string,
    variantId?: string,
  ): Promise<InventoryObservation | null>;
}
