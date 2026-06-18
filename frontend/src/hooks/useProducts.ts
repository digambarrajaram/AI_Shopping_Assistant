import { useEffect, useState } from "react";

export interface ShopProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  rating?: number | null;
  reviewCount?: number | null;
}

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23FAFAF8' width='200' height='200'/%3E%3Cpath d='M80 70h40v40H80z' fill='%23EBEBE8'/%3E%3Ccircle cx='100' cy='90' r='12' fill='%23D8F3DC'/%3E%3Cpath d='M60 140h80' stroke='%23EBEBE8' stroke-width='2'/%3E%3C/svg%3E";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Fetch the full product catalog on mount.
 * Used by the main shop view AND by chat ProductList for image matching.
 */
export function useProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ShopProduct[]) => {
        if (!cancelled) {
          setProducts(
            data.map((p) => ({
              ...p,
              imageUrl: p.imageUrl || FALLBACK_IMAGE,
            })),
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}

/** Match a product name against the catalog to get its image URL. */
export function findImageUrl(
  products: ShopProduct[],
  name: string,
): string {
  const query = name.toLowerCase().trim();
  const match = products.find(
    (p) => p.name.toLowerCase().trim() === query,
  );
  return match?.imageUrl || FALLBACK_IMAGE;
}

export { FALLBACK_IMAGE };
