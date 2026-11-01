import { z } from 'zod';

const text = z.string().trim().min(1).max(1000);
const identifier = text.max(256);
const productUrlSchema = z
  .string()
  .max(2048)
  .refine((value) => {
    if (value !== value.trim() || !URL.canParse(value)) return false;
    const url = new URL(value);
    if (url.href !== value) return false;
    return (
      url.origin === 'https://www.choicefurnituresuperstore.co.uk' &&
      !url.username &&
      !url.password &&
      !url.hash &&
      url.pathname.startsWith('/p/') &&
      url.pathname.length > 3
    );
  })
  .brand<'ObservedProductUrl'>();
const imageUrlSchema = z
  .string()
  .max(2048)
  .refine((value) => {
    if (value !== value.trim() || !URL.canParse(value)) return false;
    const url = new URL(value);
    if (url.href !== value) return false;
    return (
      url.origin === 'https://images.choicefurnituresuperstore.co.uk' &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  });

export const inventoryStatusSchema = z.enum([
  'in_stock',
  'out_of_stock',
  'preorder',
  'backorder',
  'unknown',
]);
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;
const statusMapping = new Map<string, InventoryStatus>([
  ['instock', 'in_stock'],
  ['in stock', 'in_stock'],
  ['in_stock', 'in_stock'],
  ['outofstock', 'out_of_stock'],
  ['out of stock', 'out_of_stock'],
  ['out_of_stock', 'out_of_stock'],
  ['preorder', 'preorder'],
  ['backorder', 'backorder'],
]);
const availabilitySchema = z
  .object({ status: text, sourceText: text.optional() })
  .transform((value): { status: InventoryStatus; sourceText?: string } => ({
    status:
      statusMapping.get(
        value.status.replace(/^https?:\/\/schema\.org\//, '').toLowerCase(),
      ) ?? 'unknown',
    sourceText: value.sourceText ?? value.status,
  }))
  .default({ status: 'unknown' });
const priceSchema = z.object({
  amount: z.string().regex(/^(0|[1-9]\d{0,8})\.\d{2}$/),
  currency: z.literal('GBP'),
  qualification: text.optional(),
});
const fields = {
  id: identifier.optional(),
  sku: identifier.optional(),
  structuredSku: identifier.optional(),
  mpn: identifier.optional(),
  price: priceSchema.optional(),
  specifications: z
    .array(z.object({ name: text.max(100), value: text }))
    .max(100)
    .default([]),
  availability: availabilitySchema,
  images: z.array(imageUrlSchema).max(20).default([]),
  url: productUrlSchema.optional(),
};
const variantSchema = z
  .object({ ...fields, name: text.optional() })
  .refine((value) =>
    Boolean(
      value.id ||
        value.sku ||
        value.structuredSku ||
        value.mpn ||
        value.name ||
        value.url,
    ),
  );
const productSchema = z.object({
  ...fields,
  name: text,
  variants: z.array(variantSchema).max(100).default([]),
});
const evidenceSchema = z.object({
  sourceUrl: productUrlSchema,
  observedAt: z.iso.datetime(),
  productUrls: z.array(productUrlSchema).min(1).max(1000),
  imageUrls: z.array(imageUrlSchema).max(1000).default([]),
});

export type ProductEvidence = z.input<typeof evidenceSchema>;
export type ProductVariant = z.infer<typeof variantSchema>;
export type Product = z.infer<typeof productSchema> & {
  source: {
    url: z.infer<typeof productUrlSchema>;
    observedAt: string;
    kind: 'public_website' | 'mock';
  };
};
export type InventoryObservation = Product['availability'] & {
  source: Product['source'];
};

// Observation metadata is supplied by a trusted application adapter, never by AI or request input.
export function normalizeProduct(
  input: unknown,
  evidence: ProductEvidence,
): Product {
  const product = productSchema.safeParse(input);
  const observation = evidenceSchema.safeParse(evidence);
  if (!product.success || !observation.success)
    throw new Error('Invalid ecommerce data');
  const productUrls = new Set(observation.data.productUrls);
  const imageUrls = new Set(observation.data.imageUrls);
  if (!productUrls.has(observation.data.sourceUrl))
    throw new Error('Invalid ecommerce data');
  for (const item of [product.data, ...product.data.variants]) {
    if (item.url && !productUrls.has(item.url))
      throw new Error('Invalid ecommerce data');
    if (item.images.some((url) => !imageUrls.has(url)))
      throw new Error('Invalid ecommerce data');
  }
  return {
    ...product.data,
    source: {
      url: observation.data.sourceUrl,
      observedAt: observation.data.observedAt,
      kind: 'public_website',
    },
  };
}
