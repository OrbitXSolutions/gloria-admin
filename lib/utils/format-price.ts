

// Helper function to format price with currency
export function formatPrice(
    price: number | null,
    currency?: {
        symbol_en?: string | null;
        symbol_ar?: string | null;
        code?: string | null;
    },
    locale = "en"
): string {
    if (!price) return "0";

    // Get the appropriate symbol based on locale
    let symbol = "$"; // default fallback

    if (currency) {
        if (locale === "ar" && currency.symbol_ar) {
            symbol = currency.symbol_ar;
        } else if (currency.symbol_en) {
            symbol = currency.symbol_en;
        } else if (currency.code) {
            symbol = currency.code; // fallback to currency code
        }
    }

    const formattedPrice = price.toFixed(2);

    // For Arabic, place symbol after the number
    if (locale === "ar") {
        return `${formattedPrice} ${symbol}`;
    }

    return `${symbol}${formattedPrice}`;
}
