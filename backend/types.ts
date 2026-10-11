export interface SareeColor {
  id: string;
  name: string;
  hex: string;
  image: string;
  fullImage: string;
}

export interface Saree {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  weightGrams: number;
  weaverOrigin: string;
  loomType: string;
  silkMarkVerified: boolean;
  description: string;
  weaveStory: string;
  mainImage: string;
  galleryImages: { id: string; url: string; title: string; caption: string }[];
  fullSareeLayImage: string;
  fullSareeDetails: {
    palluLength: string;
    palluMotifs: string;
    bodyPattern: string;
    borderType: string;
    blouseIncluded: boolean;
    blouseLength: string;
    zariPurity: string;
  };
  tags: string[];
  inStock: boolean;
  stockQuantity?: number;
  colorName: string;
  colorHex: string;
  colors?: SareeColor[];
  careGuide: string[];
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  count: number;
  startingPrice: number;
  provenance: string;
  description: string;
  heroImage: string;
  features: string[];
}
