/**
 * Unsplash API helper
 * Docs: https://unsplash.com/documentation
 *
 * Provides royalty-free images with proper attribution for generated landing pages.
 * When VITE_UNSPLASH_ACCESS_KEY is not set, the integration is silently skipped
 * and the AI falls back to its default image strategy (pollinations.ai).
 */

// ============ Types ============

export interface UnsplashPhoto {
    id: string;
    url: string;         // Regular-size image URL
    thumbUrl: string;    // Thumbnail URL
    altDescription: string;
    photographer: string;
    photographerUrl: string;
    unsplashUrl: string; // Link back to Unsplash (required by API guidelines)
    width: number;
    height: number;
}

export interface UnsplashSearchResult {
    photos: UnsplashPhoto[];
    total: number;
}

// ============ Configuration ============

const UNSPLASH_API_BASE = 'https://api.unsplash.com';

/**
 * Get the Unsplash access key from environment
 */
function getAccessKey(): string {
    return import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
}

/**
 * Check if Unsplash integration is configured
 */
export function isUnsplashConfigured(): boolean {
    return !!getAccessKey();
}

// ============ API Functions ============

/**
 * Search Unsplash for photos matching a query
 * @param query - Search terms (e.g., "restaurant interior", "modern office")
 * @param options - Optional configuration
 * @returns Search results with photo URLs and attribution
 */
export async function searchPhotos(
    query: string,
    options: {
        perPage?: number;
        orientation?: 'landscape' | 'portrait' | 'squarish';
    } = {}
): Promise<UnsplashSearchResult> {
    const accessKey = getAccessKey();
    if (!accessKey) {
        return { photos: [], total: 0 };
    }

    const { perPage = 5, orientation = 'landscape' } = options;

    const params = new URLSearchParams({
        query,
        per_page: String(perPage),
        orientation,
    });

    const response = await fetch(`${UNSPLASH_API_BASE}/search/photos?${params}`, {
        headers: {
            'Authorization': `Client-ID ${accessKey}`,
            'Accept-Version': 'v1',
        },
    });

    if (!response.ok) {
        console.warn(`Unsplash API error: ${response.status} ${response.statusText}`);
        return { photos: [], total: 0 };
    }

    const data = await response.json();

    const photos: UnsplashPhoto[] = (data.results || []).map((photo: any) => ({
        id: photo.id,
        url: photo.urls?.regular || photo.urls?.small || '',
        thumbUrl: photo.urls?.thumb || '',
        altDescription: photo.alt_description || query,
        photographer: photo.user?.name || 'Unknown',
        photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
        unsplashUrl: photo.links?.html || 'https://unsplash.com',
        width: photo.width || 0,
        height: photo.height || 0,
    }));

    return { photos, total: data.total || 0 };
}

// ============ Keyword Extraction ============

/**
 * Extract image search keywords from a business prompt.
 * Generates a set of queries optimized for finding relevant stock photos.
 *
 * @param prompt - The user's landing page prompt (e.g., "Modern Italian restaurant in Zurich")
 * @returns Array of search queries for different page sections
 */
export function extractImageKeywords(prompt: string): string[] {
    const lower = prompt.toLowerCase();
    const keywords: string[] = [];

    // Always add the raw prompt as the first (most relevant) query
    keywords.push(prompt);

    // Industry-specific hero/section image queries
    const industryMap: Record<string, string[]> = {
        restaurant:  ['restaurant interior elegant', 'gourmet food plating'],
        cafe:        ['coffee shop interior cozy', 'latte art coffee'],
        bakery:      ['artisan bakery fresh bread', 'pastry display case'],
        pizza:       ['pizza oven fire', 'italian pizzeria interior'],
        bar:         ['cocktail bar nightlife', 'craft cocktails drinks'],
        hotel:       ['luxury hotel lobby', 'hotel room modern'],
        spa:         ['spa relaxation wellness', 'massage therapy zen'],
        salon:       ['hair salon modern interior', 'beauty styling professional'],
        barber:      ['barber shop classic', 'mens grooming haircut'],
        dental:      ['dental office modern clean', 'dentist smile healthy'],
        dentist:     ['dental office modern clean', 'dentist smile healthy'],
        medical:     ['medical clinic professional', 'healthcare modern facility'],
        doctor:      ['medical clinic professional', 'healthcare doctor patient'],
        fitness:     ['fitness gym modern', 'workout training people'],
        gym:         ['fitness gym modern', 'workout training people'],
        yoga:        ['yoga studio peaceful', 'meditation mindfulness'],
        lawyer:      ['law office professional', 'legal justice corporate'],
        law:         ['law office professional', 'legal justice corporate'],
        accounting:  ['business finance office', 'corporate accounting professional'],
        consulting:  ['business meeting corporate', 'consulting strategy office'],
        realestate:  ['modern house exterior', 'luxury home interior'],
        'real estate': ['modern house exterior', 'luxury home interior'],
        property:    ['modern house exterior', 'luxury home interior'],
        construction: ['construction building site', 'home renovation modern'],
        plumber:     ['plumbing service professional', 'home repair maintenance'],
        hvac:        ['hvac technician service', 'home comfort heating cooling'],
        school:      ['modern classroom education', 'students learning campus'],
        education:   ['modern classroom education', 'online learning laptop'],
        photography: ['professional photography camera', 'photo studio creative'],
        wedding:     ['wedding celebration elegant', 'wedding venue romantic'],
        tech:        ['technology startup office', 'modern workspace computer'],
        saas:        ['saas dashboard technology', 'modern tech workspace'],
        startup:     ['startup team modern office', 'technology innovation'],
        ecommerce:   ['online shopping products', 'ecommerce fashion retail'],
        fashion:     ['fashion clothing style', 'boutique store modern'],
        pet:         ['pets dogs cats happy', 'veterinary clinic animal'],
        vet:         ['veterinary clinic animal', 'pet care professional'],
        florist:     ['flower shop floral arrangement', 'fresh flowers bouquet'],
        car:         ['car dealership showroom', 'automobile mechanic service'],
        auto:        ['car dealership showroom', 'auto repair garage'],
    };

    for (const [industry, queries] of Object.entries(industryMap)) {
        if (lower.includes(industry)) {
            keywords.push(...queries);
            break; // Use the first match
        }
    }

    // If no industry matched, add generic professional queries
    if (keywords.length === 1) {
        keywords.push('professional business modern', 'team collaboration workspace');
    }

    return keywords;
}

// ============ Integration Helper ============

/**
 * Fetches a set of Unsplash images for a landing page prompt.
 * Returns a formatted string block that can be injected into AI prompts,
 * or an empty string if Unsplash is not configured / no results.
 *
 * @param prompt - The user's landing page prompt
 * @returns Prompt-injectable string with image URLs and attribution
 */
export async function fetchImagesForPrompt(prompt: string): Promise<{
    promptBlock: string;
    photos: UnsplashPhoto[];
}> {
    if (!isUnsplashConfigured()) {
        return { promptBlock: '', photos: [] };
    }

    const queries = extractImageKeywords(prompt);
    const allPhotos: UnsplashPhoto[] = [];
    const seen = new Set<string>();

    // Fetch images for each query (hero + section images)
    for (const query of queries.slice(0, 3)) {
        try {
            const result = await searchPhotos(query, { perPage: 3 });
            for (const photo of result.photos) {
                if (!seen.has(photo.id)) {
                    seen.add(photo.id);
                    allPhotos.push(photo);
                }
            }
        } catch (e) {
            console.warn('Unsplash search failed for query:', query, e);
        }
    }

    if (allPhotos.length === 0) {
        return { promptBlock: '', photos: [] };
    }

    // Build a prompt block the AI can use
    const imageList = allPhotos.map((p, i) => {
        const role = i === 0 ? 'Hero/Banner' : `Section ${i}`;
        return `  ${i + 1}. [${role}] ${p.url}\n     Alt: "${p.altDescription}"\n     Credit: Photo by ${p.photographer} on Unsplash (${p.unsplashUrl})`;
    }).join('\n');

    const promptBlock = `
**STOCK IMAGES (use these real Unsplash URLs instead of placeholder services):**
${imageList}

**IMAGE ATTRIBUTION REQUIREMENT:**
Include a small attribution footer at the bottom of the page with photographer credits.
Format: "Photos by [Name] on Unsplash" with links to photographer profiles.
    `.trim();

    return { promptBlock, photos: allPhotos };
}
