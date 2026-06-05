import type { BundlePricing, Product } from '@/products';

/**
 * Static VIRON storefront catalog (images live in `/public/*.jpeg`).
 * Edit prices, dosages, and copy here — no backend required for listing.
 */

const bundlePricing: BundlePricing[] = [
  { quantity: 1, label: 'Buy 1' },
  { quantity: 2, label: 'Buy 2' },
  { quantity: 3, label: 'Buy 3' },
  { quantity: 5, label: 'Buy 5' },
  { quantity: 10, label: 'Buy 10' },
];

const research = (name: string, area: string) =>
  `${name} is supplied for laboratory and in vitro research only. Not for human consumption, clinical, or diagnostic use.`;

const baseSpecs = {
  purity: '≥99.0% (research reference; verify batch documentation)' as const,
  appearance: 'White to off-white lyophilised powder' as const,
  solubility: 'Reconstitute with appropriate sterile diluent per your SOP' as const,
  qualityVerification: 'Identity and purity protocols per supplier batch records' as const,
  storageConditions: 'Store sealed at 2–8 °C; protect from light and moisture' as const,
};

/** URL-safe paths — filenames match assets in `public/` */
const img = (filename: string) => `/${filename}`;

export const VIRION_LOCAL_PRODUCTS: Product[] = [
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    description: research('Tirzepatide', 'metabolic receptor signalling'),
    category: 'best-seller',
    type: 'metabolic',
    badge: 'POPULAR',
    vialType: 'white',
    image: img('TRIZEPATIDE.jpeg'),
    dosages: [
      { mg: 5, originalPrice: 72, inStock: true },
      { mg: 10, originalPrice: 102, inStock: true },
      { mg: 20, originalPrice: 168, inStock: true },
    ],
    bundlePricing,
    reviewCount: 42,
    technicalSpecs: {
      synonyms: 'GLP-1 / GIP analogue',
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'glow',
    name: 'GLOW',
    description: research('GLOW', 'skin matrix and collagen pathway modelling'),
    category: 'best-seller',
    type: 'recovery',
    badge: '🔥 BEST SELLER',
    vialType: 'light-blue',
    image: img('GLOW.jpeg'),
    dosages: [{ mg: 70, originalPrice: 182, inStock: true }],
    bundlePricing,
    reviewCount: 51,
    technicalSpecs: {
      ...baseSpecs,
      composition: 'Blend formulation — verify label net peptide content before assay design.',
    },
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    description: research('Copper peptide GHK-Cu', 'extracellular matrix research'),
    category: 'popular',
    type: 'recovery',
    vialType: 'white',
    image: img('GHK-Cu.jpeg'),
    dosages: [
      { mg: 50, originalPrice: 92, inStock: true },
      { mg: 100, originalPrice: 158, inStock: true },
    ],
    bundlePricing,
    reviewCount: 38,
    technicalSpecs: {
      synonyms: 'Copper tripeptide-1',
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    description: research('BPC-157', 'tissue repair signalling models'),
    category: 'best-seller',
    type: 'recovery',
    badge: '🔥 BEST SELLER',
    vialType: 'white',
    image: img('BPC-157.jpeg'),
    dosages: [
      { mg: 5, originalPrice: 48, inStock: true },
      { mg: 10, originalPrice: 82, inStock: true },
    ],
    bundlePricing,
    reviewCount: 63,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
      peptideLength: '15 amino acids',
    },
  },
  {
    id: 'igf-1',
    name: 'IGF-1 LR3',
    description: research('IGF-1 LR3', 'growth-factor signalling assays'),
    category: 'best-seller',
    type: 'growth',
    badge: 'TRENDING',
    vialType: 'deep-blue',
    image: img('IGF-1.jpeg'),
    dosages: [{ mg: 1, originalPrice: 98, inStock: true }],
    bundlePricing,
    reviewCount: 41,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'bpc-157-50mg',
    name: 'BPC-157 (50 mg)',
    description: research('BPC-157 high-mass reference', 'scaled assay development'),
    category: 'popular',
    type: 'recovery',
    vialType: 'white',
    image: img('BPC-157-50MG.jpeg'),
    dosages: [{ mg: 50, originalPrice: 268, inStock: true }],
    bundlePricing,
    reviewCount: 22,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
      peptideLength: '15 amino acids',
    },
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    description: research('TB-500 (Thymosin β4 fragment)', 'motility and cytoskeletal studies'),
    category: 'popular',
    type: 'recovery',
    vialType: 'white',
    image: img('TB-500.jpeg'),
    dosages: [
      { mg: 5, originalPrice: 54, inStock: true },
      { mg: 10, originalPrice: 94, inStock: true },
    ],
    bundlePricing,
    reviewCount: 47,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295',
    description: research('CJC-1295', 'GH secretagogue pathway models'),
    category: 'popular',
    type: 'growth',
    vialType: 'white',
    image: img('CJC-1295.jpeg'),
    dosages: [
      { mg: 2, originalPrice: 58, inStock: true },
      { mg: 5, originalPrice: 96, inStock: true },
    ],
    bundlePricing,
    reviewCount: 33,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    description: research('Ipamorelin', 'GHRP-class receptor profiling'),
    category: 'essentials',
    type: 'growth',
    vialType: 'white',
    image: img('IPAMORELIN.jpeg'),
    dosages: [
      { mg: 5, originalPrice: 46, inStock: true },
      { mg: 10, originalPrice: 78, inStock: true },
    ],
    bundlePricing,
    reviewCount: 29,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    description: research('Tesamorelin', 'hypothalamic–pituitary axis modelling'),
    category: 'popular',
    type: 'growth',
    vialType: 'white',
    image: img('TESAMORELEIN.jpeg'),
    dosages: [{ mg: 5, originalPrice: 84, inStock: true }],
    bundlePricing,
    reviewCount: 26,
    technicalSpecs: {
      purity: baseSpecs.purity,
      appearance: baseSpecs.appearance,
      solubility: baseSpecs.solubility,
      qualityVerification: baseSpecs.qualityVerification,
      storageConditions: baseSpecs.storageConditions,
    },
  },
];

export function getVironProductBySlug(slug: string): Product | undefined {
  const key = slug.trim().toLowerCase();
  return VIRION_LOCAL_PRODUCTS.find((p) => p.id.toLowerCase() === key);
}
