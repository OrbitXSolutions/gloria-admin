import { getImageUrl } from "../constants/supabase-storage";

/**
 * Image loading states
 */
export type ImageLoadingState = "loading" | "loaded" | "error";

/**
 * Image configuration for different use cases
 */
export const ImageConfigs = {
  product: {
    sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
    quality: 85,
    placeholder: "/placeholder.svg?height=400&width=300&text=Product",
  },
  hero: {
    sizes: "(max-width: 768px) 100vw, 50vw",
    quality: 90,
    placeholder: "/placeholder.svg?height=600&width=500&text=Hero",
  },
  banner: {
    sizes: "(max-width: 768px) 100vw, 50vw",
    quality: 85,
    placeholder: "/placeholder.svg?height=400&width=600&text=Banner",
  },
  avatar: {
    sizes: "60px",
    quality: 80,
    placeholder: "/placeholder.svg?height=60&width=60&text=User",
  },
  category: {
    sizes: "(max-width: 768px) 50vw, 25vw",
    quality: 85,
    placeholder: "/placeholder.svg?height=200&width=200&text=Category",
  },
} as const;

/**
 * Gets optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
  imagePath: string | null | undefined,
  type: keyof typeof ImageConfigs,
  alt: string
) {
  const config = ImageConfigs[type];
  const src = getImageUrl(imagePath, config.placeholder);

  return {
    src,
    alt,
    sizes: config.sizes,
    quality: config.quality,
    className: "object-cover",
  };
}

/**
 * Preloads an image for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generates responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(imagePath: string | null | undefined) {
  const baseUrl = getImageUrl(imagePath);

  return {
    small: `${baseUrl}?width=400&height=400&quality=75`,
    medium: `${baseUrl}?width=800&height=800&quality=85`,
    large: `${baseUrl}?width=1200&height=1200&quality=90`,
  };
}
