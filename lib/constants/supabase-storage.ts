export class SupabasePaths {
  static readonly BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
  static readonly STORAGE = `${SupabasePaths.BASE}/storage/v1/object/public`;
  static readonly IMAGES = `${SupabasePaths.STORAGE}/images`;
}

export class SupabaseStorageBuckets {
  static readonly IMAGES = {
    name: "images",
    folders: {
      ROOT: "",
      CATEGORIES: "categories",
      USERS: "users",
      PRODUCTS: "products",
    },
  };
}

/**
 * Constructs a full Supabase storage URL for an image
 * @param imagePath - The relative path stored in the database (e.g., "products/perfume-1.jpg")
 * @param fallback - Fallback image URL if imagePath is null/undefined
 * @returns Full Supabase storage URL or fallback
 */
type Folders = keyof typeof SupabaseStorageBuckets.IMAGES.folders;
export function getImageUrl(
  imagePath: string | null | undefined,
  fallback?: string,
  folder: Folders = "ROOT",

): string {
  if (!imagePath) {
    return fallback || "/placeholder.svg?height=400&width=300";
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // If it starts with a slash, remove it to avoid double slashes
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  const _folder = SupabaseStorageBuckets.IMAGES.folders[folder];

  return `${SupabasePaths.IMAGES}/${_folder}/${cleanPath}`;
}

/**
 * Constructs a product image URL
 * @param imagePath - The image path from the database
 * @param fallback - Optional fallback image
 * @returns Full product image URL
 */
export function getProductImageUrl(
  imagePath: string | null | undefined,
  fallback?: string
): string {
  return getImageUrl(
    imagePath,
    fallback || "/placeholder.svg?height=400&width=300&text=Product",
    'PRODUCTS'
  );
}

/**
 * Constructs a user avatar URL
 * @param imagePath - The avatar path from the database
 * @param fallback - Optional fallback avatar
 * @returns Full avatar URL
 */
export function getUserAvatarUrl(
  imagePath: string | null | undefined,
  fallback?: string
): string {
  return getImageUrl(
    imagePath,
    fallback || "/placeholder.svg?height=60&width=60&text=User",
    'USERS'
  );
}

/**
 * Constructs a category image URL
 * @param imagePath - The category image path from the database
 * @param fallback - Optional fallback image
 * @returns Full category image URL
 */
export function getCategoryImageUrl(
  imagePath: string | null | undefined,
  fallback?: string
): string {
  return getImageUrl(
    imagePath,
    fallback || "/placeholder.svg?height=200&width=200&text=Category",
    'CATEGORIES'
  );
}

/**
 * Gets the first available image from an array of image paths
 * @param images - Array of image paths
 * @param fallback - Fallback image URL
 * @returns First available image URL or fallback
 */
export function getFirstImageUrl(
  images: string[] | null | undefined,
  fallback?: string
): string {
  if (!images || images.length === 0) {
    return fallback || "/placeholder.svg?height=400&width=300";
  }

  return getImageUrl(images[0], fallback, 'PRODUCTS');
}
