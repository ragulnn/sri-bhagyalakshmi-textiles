export interface SareeColor {
  id: string;
  name: string;
  hex: string;
  image: string; // photo for this colour ('' = use the saree's main photo)
  fullImage: string; // full rectangular photo for this colour ('' = use default)
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
  galleryImages: {
    id: string;
    url: string;
    title: string;
    caption: string;
  }[];
  // The rectangular full 6.2m drape flat lay
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
  /** Optional until the admin enters an opening count for an existing legacy item. */
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

export interface CartItem {
  saree: Saree;
  quantity: number;
}
