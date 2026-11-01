import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeProduct, type InventoryStatus } from './models.js';
import type { EcommerceProvider } from './provider.js';
import { MockEcommerceProvider } from './mock-provider.js';

// URLs were observed in Stage 2. All names, identifiers and prices below are synthetic.
const productUrl =
  'https://www.choicefurnituresuperstore.co.uk/p/chelsea-mirrored-6-drawer-dressing-table';
const variantUrl =
  'https://www.choicefurnituresuperstore.co.uk/p/milan-white-marble-dining-table-sizes-available?variant=16985745';
const imageUrl =
  'https://images.choicefurnituresuperstore.co.uk/images2/Bedrooms/Dressing-Tables/Chelsea-Mirrored-6-Drawer-Dressing-Table.jpg';
const evidence = {
  sourceUrl: productUrl,
  observedAt: '2026-10-31T14:30:00.000Z',
  productUrls: [productUrl, variantUrl],
  imageUrls: [imageUrl],
};
const candidate = () => ({
  id: 'synthetic-product-1',
  sku: 'synthetic-visible-sku',
  structuredSku: 'synthetic-structured-sku',
  mpn: 'synthetic-mpn',
  name: 'Synthetic table',
  price: {
    amount: '12.34',
    currency: 'GBP',
    qualification: 'Synthetic base price, no voucher applied',
  },
  specifications: [{ name: 'Material', value: 'Synthetic material' }],
  availability: {
    status: 'https://schema.org/InStock',
    sourceText: 'In Stock, subject to supplier confirmation',
  },
  images: [imageUrl],
  url: productUrl,
  variants: [
    {
      id: 'synthetic-variant-1',
      name: 'Synthetic small size',
      url: variantUrl,
      price: { amount: '15.00', currency: 'GBP' },
      availability: { status: 'Out of Stock' },
    },
  ],
});
const provider = (
  items = [{ data: candidate(), evidence }],
): EcommerceProvider => new MockEcommerceProvider(items);
afterEach(() => vi.unstubAllGlobals());

describe('normalized product boundary', () => {
  it('preserves distinct identifiers, decimal money, source wording and per-variant facts', () => {
    const product = normalizeProduct(candidate(), evidence);
    expect(product).toMatchObject({
      id: 'synthetic-product-1',
      sku: 'synthetic-visible-sku',
      structuredSku: 'synthetic-structured-sku',
      mpn: 'synthetic-mpn',
      price: { amount: '12.34', currency: 'GBP' },
      availability: {
        status: 'in_stock',
        sourceText: 'In Stock, subject to supplier confirmation',
      },
      source: {
        url: productUrl,
        observedAt: evidence.observedAt,
        kind: 'public_website',
      },
    });
    expect(product.variants[0]).toMatchObject({
      price: { amount: '15.00' },
      availability: { status: 'out_of_stock' },
    });
    expect(product.variants[0]!.specifications).toEqual([]);
    expect(product.variants[0]!.sku).toBeUndefined();
  });
  it('keeps missing facts unknown without fabricating identifiers, prices, stock or links', () => {
    const product = normalizeProduct(
      { name: 'Synthetic incomplete item', variants: [{ url: variantUrl }] },
      evidence,
    );
    expect(product).toMatchObject({
      availability: { status: 'unknown' },
      images: [],
      specifications: [],
      variants: [{ url: variantUrl, availability: { status: 'unknown' } }],
    });
    for (const key of ['id', 'sku', 'structuredSku', 'mpn', 'price', 'url'])
      expect(product).not.toHaveProperty(key);
  });
  it.each([
    null,
    {},
    { name: '' },
    { name: 123 },
    { name: 'Synthetic', price: { amount: -1, currency: 'GBP' } },
    { name: 'Synthetic', price: { amount: 'NaN', currency: 'GBP' } },
    { name: 'Synthetic', price: { amount: '12.345', currency: 'GBP' } },
    { name: 'Synthetic', price: { amount: '12.34', currency: 'USD' } },
    { name: 'Synthetic', availability: { status: true } },
    { name: 'Synthetic', images: 'not-an-array' },
    { name: 'Synthetic', variants: [{}] },
  ])(
    'rejects malformed or essential missing data without echoing raw values (%j)',
    (value) => {
      expect(() => normalizeProduct(value, evidence)).toThrow(
        /^Invalid ecommerce data$/,
      );
    },
  );
  it('strips raw responses and unrecognized external fields at every modeled level', () => {
    const input = {
      ...candidate(),
      rawResponse: 'private-value',
      accessToken: 'private-value',
      price: { ...candidate().price, internal: 'private-value' },
      variants: [{ ...candidate().variants[0], internal: 'private-value' }],
    };
    expect(JSON.stringify(normalizeProduct(input, evidence))).not.toContain(
      'private-value',
    );
  });
  it('requires valid application-owned observation metadata', () => {
    expect(() =>
      normalizeProduct(candidate(), { ...evidence, observedAt: 'invalid' }),
    ).toThrow(/^Invalid ecommerce data$/);
    expect(() =>
      normalizeProduct(candidate(), { ...evidence, productUrls: [] }),
    ).toThrow(/^Invalid ecommerce data$/);
  });
});

describe('source URL handling', () => {
  it('returns source-observed URLs exactly, including an observed variant query', () => {
    const product = normalizeProduct(candidate(), evidence);
    expect(product.url).toBe(productUrl);
    expect(product.variants[0]!.url).toBe(variantUrl);
    expect(product.images).toEqual([imageUrl]);
  });
  it('rejects unobserved product and image links even on an approved host', () => {
    expect(() =>
      normalizeProduct(
        { ...candidate(), url: productUrl + '-guessed' },
        evidence,
      ),
    ).toThrow(/^Invalid ecommerce data$/);
    expect(() =>
      normalizeProduct(
        {
          ...candidate(),
          variants: [{ url: variantUrl.replace('16985745', '99999') }],
        },
        evidence,
      ),
    ).toThrow(/^Invalid ecommerce data$/);
    expect(() =>
      normalizeProduct(
        { ...candidate(), images: [imageUrl + '?guessed=1'] },
        evidence,
      ),
    ).toThrow(/^Invalid ecommerce data$/);
  });
  it.each([
    'javascript:alert(1)',
    'http://www.choicefurnituresuperstore.co.uk/p/test',
    'https://www.choicefurnituresuperstore.co.uk.evil.example/p/test',
    'https://www.choicefurnituresuperstore.co.uk@evil.example/p/test',
    'https://secret@www.choicefurnituresuperstore.co.uk/p/test',
    '/p/relative',
    productUrl + '#fragment',
    ' ' + productUrl,
    'https://www.choicefurnituresuperstore.co.uk:8443/p/test',
  ])(
    'rejects unsafe or unsupported URL %s even if supplied as observed',
    (url) => {
      expect(() =>
        normalizeProduct(
          { ...candidate(), url },
          { ...evidence, productUrls: [...evidence.productUrls, url] },
        ),
      ).toThrow(/^Invalid ecommerce data$/);
    },
  );
});

describe('stock observations and provider contract', () => {
  it.each([
    ['https://schema.org/InStock', 'in_stock'],
    ['In Stock', 'in_stock'],
    ['https://schema.org/OutOfStock', 'out_of_stock'],
    ['PreOrder', 'preorder'],
    ['BackOrder', 'backorder'],
    ['Possibly in stock tomorrow', 'unknown'],
  ])(
    'maps %s conservatively to %s and preserves source text',
    (status, expected) => {
      const product = normalizeProduct(
        { name: 'Synthetic', availability: { status } },
        evidence,
      );
      const inventory: InventoryStatus = product.availability.status;
      expect(inventory).toBe(expected);
      expect(product.availability.sourceText).toBe(status);
    },
  );
  it('implements the read-only interface with deterministic search and null for absent IDs', async () => {
    const api = provider();
    expect(await api.searchProducts('TABLE')).toHaveLength(1);
    expect(await api.searchProducts('missing')).toEqual([]);
    expect((await api.getProduct('synthetic-product-1'))!.name).toBe(
      'Synthetic table',
    );
    expect(await api.getProduct('missing')).toBeNull();
    expect(await api.checkStock('missing')).toBeNull();
    expect(api).not.toHaveProperty('getOrder');
    expect(api).not.toHaveProperty('getCustomerOrders');
    expect(api).not.toHaveProperty('getOrderStatus');
    expect(api).not.toHaveProperty('checkout');
    expect(api).not.toHaveProperty('addToCart');
  });
  it('returns product/variant stock observations without claiming live quantities or inheriting parent stock', async () => {
    const api = provider();
    expect(await api.checkStock('synthetic-product-1')).toMatchObject({
      status: 'in_stock',
      source: { kind: 'mock', observedAt: evidence.observedAt },
    });
    expect(
      await api.checkStock('synthetic-product-1', 'synthetic-variant-1'),
    ).toMatchObject({ status: 'out_of_stock' });
    expect(await api.checkStock('synthetic-product-1', 'missing')).toBeNull();
    expect(await api.checkStock('synthetic-product-1')).not.toHaveProperty(
      'quantity',
    );
  });
  it('validates mock data, refuses duplicate identifiers and safely handles invalid calls', async () => {
    expect(
      () =>
        new MockEcommerceProvider([
          {
            data: { name: 'Synthetic', url: 'https://evil.example/p/item' },
            evidence,
          },
        ]),
    ).toThrow(/^Invalid ecommerce data$/);
    expect(
      () =>
        new MockEcommerceProvider([
          { data: candidate(), evidence },
          { data: candidate(), evidence },
        ]),
    ).toThrow(/^Duplicate ecommerce identifier$/);
    const api = provider();
    await expect(api.searchProducts(' ')).rejects.toThrow(
      /^Invalid ecommerce request$/,
    );
    await expect(api.getProduct('')).rejects.toThrow(
      /^Invalid ecommerce request$/,
    );
    await expect(api.checkStock('synthetic-product-1', '')).rejects.toThrow(
      /^Invalid ecommerce request$/,
    );
  });
  it('never fetches and never shares mutable internal state or input fixtures', async () => {
    const fetch = vi.fn(() => {
      throw new Error('No external access permitted');
    });
    vi.stubGlobal('fetch', fetch);
    const input = candidate();
    const api = provider([{ data: input, evidence }]);
    input.name = 'Mutated input';
    const first = await api.getProduct('synthetic-product-1');
    first!.name = 'Mutated result';
    first!.variants[0]!.availability.status = 'in_stock';
    expect((await api.searchProducts('table'))[0]!.name).toBe(
      'Synthetic table',
    );
    expect(
      (await api.checkStock('synthetic-product-1', 'synthetic-variant-1'))!
        .status,
    ).toBe('out_of_stock');
    expect(fetch).not.toHaveBeenCalled();
    expect(
      await new MockEcommerceProvider().searchProducts('anything'),
    ).toEqual([]);
  });
});

it('rejects control characters and backslash URL normalization instead of rewriting source data', () => {
  for (const url of [
    productUrl.replace('/p/', '/\np/'),
    productUrl.replace('/p/', '/p/\u0000'),
    productUrl.replace('https://', 'https:\\\\'),
  ]) {
    expect(() =>
      normalizeProduct(
        { ...candidate(), url },
        { ...evidence, productUrls: [...evidence.productUrls, url] },
      ),
    ).toThrow(/^Invalid ecommerce data$/);
  }
});
it('rejects duplicate variant identifiers without merging their facts', () => {
  expect(
    () =>
      new MockEcommerceProvider([
        {
          data: {
            ...candidate(),
            variants: [candidate().variants[0], candidate().variants[0]],
          },
          evidence,
        },
      ]),
  ).toThrow(/^Duplicate ecommerce identifier$/);
});
