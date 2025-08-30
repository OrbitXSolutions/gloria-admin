import type { z } from 'zod'

// Basic interface for inputs needed for SEO generation
export interface ProductSeoSource {
    name_en: string
    name_ar?: string | null
    description_en?: string | null
    description_ar?: string | null
    category_en?: string | null
    category_ar?: string | null
    brand?: string | null
    primary_image?: string | null
}

export interface GeneratedProductSeo {
    meta_title_en: string
    meta_title_ar: string
    meta_description_en: string
    meta_description_ar: string
    keywords: { en: string[]; ar: string[] }
    meta_thumbnail: { prompt: string; alt_en: string; alt_ar: string; image_url: string | null }
}

// Intent / value keyword pools
const INTENT_EN = ['buy', 'online', 'shop', 'sale', 'best price', 'dubai', 'uae', 'original', 'authentic', 'luxury', 'premium', 'deal']
const INTENT_AR = ['شراء', 'تسوق', 'اونلاين', 'عرض', 'أفضل سعر', 'دبي', 'الامارات', 'أصلي', 'فاخر', 'ممتاز', 'صفقة', 'خصم']

const STOP_EN = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'onto', 'your', 'our', 'a', 'an', 'of', 'in', 'on', 'to', 'by', 'is', 'are', 'it', 'at', 'as', 'or'])

function truncateSmart(str: string, max: number) {
    if (str.length <= max) return str
    const cut = str.slice(0, max + 1)
    const lastSpace = cut.lastIndexOf(' ')
    if (lastSpace > max - 25) return cut.slice(0, lastSpace).trim()
    return str.slice(0, max).trim()
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr.filter(Boolean))) }

function extractEnglishKeywords(src: string): string[] {
    const tokens = src.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_EN.has(w))
    return unique(tokens)
}

// Simple pseudo "transcreation" fallback: reuse EN if AR missing.
function ensureArabic(textAr?: string | null, fallbackEn?: string | null) {
    if (textAr && textAr.trim().length > 0) return textAr.trim()
    return fallbackEn || ''
}

export function generateProductSeo(src: ProductSeoSource): GeneratedProductSeo {
    const nameEn = src.name_en.trim()
    const nameAr = ensureArabic(src.name_ar, nameEn)
    const catEn = (src.category_en || '').trim()
    const catAr = ensureArabic(src.category_ar, catEn)
    const brand = (src.brand || '').trim()
    const descEn = (src.description_en || '').trim()
    const descAr = ensureArabic(src.description_ar, descEn)

    // Title pattern Product Name — Category | Brand (omit empty parts)
    const titleCoreEnParts = [nameEn, catEn].filter(Boolean)
    let titleEn = titleCoreEnParts.join(' — ')
    if (brand) titleEn += ` | ${brand}`
    titleEn = truncateSmart(titleEn, 65)

    const titleCoreArParts = [nameAr, catAr].filter(Boolean)
    let titleAr = titleCoreArParts.join(' — ')
    if (brand) titleAr += ` | ${brand}` // brand assumed Latin brand retained
    titleAr = truncateSmart(titleAr, 65)

    // Description EN (140–160) include CTA & value
    const baseDescEn = (descEn || `${nameEn}${catEn ? ' in ' + catEn : ''}`)
        .replace(/\s+/g, ' ').trim()
    const valuePhrasesEn = ['Fast shipping UAE', 'Secure payment', 'Limited stock']
    let descFullEn = `${baseDescEn}. ${valuePhrasesEn[0]}. Shop now for best price in Dubai.`
    descFullEn = truncateSmart(descFullEn, 160)
    if (descFullEn.length < 140) {
        descFullEn = truncateSmart(`${baseDescEn}. ${valuePhrasesEn[1]}. Order online today.`, 160)
    }

    // Description AR
    const baseDescAr = (descAr || nameAr).replace(/\s+/g, ' ').trim()
    const valuePhrasesAr = ['شحن سريع داخل الإمارات', 'دفع آمن', 'كمية محدودة']
    let descFullAr = `${baseDescAr}. ${valuePhrasesAr[0]}. اطلب الآن بأفضل الأسعار في دبي.`
    descFullAr = truncateSmart(descFullAr, 160)
    if (descFullAr.length < 140) {
        descFullAr = truncateSmart(`${baseDescAr}. ${valuePhrasesAr[1]}. تسوق اونلاين الآن.`, 160)
    }

    // Keywords
    const baseKeywordSource = [nameEn, catEn, brand, descEn].join(' ')
    const extracted = extractEnglishKeywords(baseKeywordSource)
    const weighted = unique([...extracted.slice(0, 6), ...INTENT_EN])
    const keywordsEn = unique(weighted).slice(0, 12)
    const keywordsAr = unique([nameAr, catAr, ...INTENT_AR]).filter(k => k.length > 1).slice(0, 12)

    // Meta thumbnail
    const altEn = truncateSmart(titleEn, 110)
    const altAr = truncateSmart(titleAr, 110)
    const prompt = `High-quality studio product photo of ${nameEn}${brand ? ' by ' + brand : ''}${catEn ? ' in category ' + catEn : ''}, neutral background, soft shadows, luxury aesthetic, 1200x630.`

    return {
        meta_title_en: titleEn,
        meta_title_ar: titleAr,
        meta_description_en: descFullEn,
        meta_description_ar: descFullAr,
        keywords: { en: keywordsEn, ar: keywordsAr },
        meta_thumbnail: {
            prompt,
            alt_en: altEn,
            alt_ar: altAr,
            image_url: src.primary_image || ''
        }
    }
}
