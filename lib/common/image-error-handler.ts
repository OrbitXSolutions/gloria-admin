/**
 * Image error handling utilities
 */

export interface ImageErrorState {
  hasError: boolean;
  retryCount: number;
  lastError?: string;
}

export interface ImageFallbackConfig {
  primary?: string;
  secondary?: string;
  final: string;
  maxRetries?: number;
}

/**
 * Default fallback configurations for different image types
 */
export const DEFAULT_FALLBACKS = {
  product: {
    primary: "/placeholder.svg?height=400&width=300&text=Product+Image",
    secondary: "/placeholder.svg?height=400&width=300&text=No+Image",
    final: "/placeholder.svg?height=400&width=300&text=Image+Error",
    maxRetries: 2,
  },
  avatar: {
    primary: "/placeholder.svg?height=60&width=60&text=User",
    secondary: "/placeholder.svg?height=60&width=60&text=Avatar",
    final: "/placeholder.svg?height=60&width=60&text=No+Avatar",
    maxRetries: 1,
  },
  hero: {
    primary: "/placeholder.svg?height=600&width=500&text=Hero+Image",
    secondary: "/placeholder.svg?height=600&width=500&text=Banner",
    final: "/placeholder.svg?height=600&width=500&text=Image+Error",
    maxRetries: 2,
  },
  banner: {
    primary: "/placeholder.svg?height=400&width=600&text=Banner",
    secondary: "/placeholder.svg?height=400&width=600&text=Promotion",
    final: "/placeholder.svg?height=400&width=600&text=Banner+Error",
    maxRetries: 1,
  },
  category: {
    primary: "/placeholder.svg?height=200&width=200&text=Category",
    secondary: "/placeholder.svg?height=200&width=200&text=Section",
    final: "/placeholder.svg?height=200&width=200&text=Category+Error",
    maxRetries: 1,
  },
} as const;

/**
 * Logs image errors for debugging
 */
export function logImageError(
  src: string,
  error: string | Event,
  context?: string
) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Image Error] ${context || "Unknown context"}:`, {
      src,
      error: error instanceof Event ? "Load failed" : error,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Determines the next fallback image to try
 */
export function getNextFallback(
  currentSrc: string,
  fallbackConfig: ImageFallbackConfig,
  retryCount: number
): string | null {
  const { primary, secondary, final, maxRetries = 2 } = fallbackConfig;

  // If we've exceeded max retries, return final fallback
  if (retryCount >= maxRetries) {
    return final;
  }

  // If current src is the original, try primary fallback
  if (
    currentSrc !== primary &&
    currentSrc !== secondary &&
    currentSrc !== final
  ) {
    return primary || final;
  }

  // If current src is primary, try secondary
  if (currentSrc === primary && secondary) {
    return secondary;
  }

  // Otherwise, use final fallback
  return final;
}

/**
 * Checks if an image URL is likely to be valid
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;
  const isImageExtension = imageExtensions.test(url);

  // Check for placeholder URLs (always valid)
  const isPlaceholder = url.includes("placeholder.svg");

  // Check for data URLs
  const isDataUrl = url.startsWith("data:image/");

  // Check for valid HTTP/HTTPS URLs
  const isValidUrl = url.startsWith("http") || url.startsWith("/") || isDataUrl;

  return (isImageExtension || isPlaceholder || isDataUrl) && isValidUrl;
}

/**
 * Preloads an image and returns a promise
 */
export function preloadImageWithError(
  src: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!isValidImageUrl(src)) {
      resolve({ success: false, error: "Invalid URL format" });
      return;
    }

    const img = new Image();

    img.onload = () => {
      resolve({ success: true });
    };

    img.onerror = (error) => {
      resolve({
        success: false,
        error: error instanceof Event ? "Failed to load" : String(error),
      });
    };

    // Set a timeout for slow loading images
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "Timeout" });
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      resolve({ success: true });
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: error instanceof Event ? "Failed to load" : String(error),
      });
    };

    img.src = src;
  });
}
