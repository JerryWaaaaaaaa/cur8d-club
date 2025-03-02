import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './config';

// Function to Fetch Open Graph Image
export async function fetchOpenGraphImage(url: string): Promise<string | null> {
    try {
        const { data } = await axios.get<string>(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        return $('meta[property="og:image"]').attr('content') || null;
    } catch (error: any) {
        console.error(`Failed to fetch OG image from ${url}:`, error.message);
        return null;
    }
}

// Update Database with OG Images
export async function updateExistingImages(): Promise<void> {
    const { data: items, error } = await supabase
        .from('people')
        .select('id, url')
        .is('image', null);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    for (const item of items) {
        const imageUrl = await fetchOpenGraphImage(item.url);
        if (imageUrl) {
            await supabase
                .from('people')
                .update({ image: imageUrl })
                .eq('id', item.id);
            console.log(`✅ Updated ${item.url} with image: ${imageUrl}`);
        }
    }
} 