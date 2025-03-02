
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

// 🔗 Supabase Configuration
const SUPABASE_URL = "https://nplvcxighknfuewuwiib.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHZjeGlnaGtuZnVld3V3aWliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDg3Njg5MywiZXhwIjoyMDU2NDUyODkzfQ.DEUaLRMB600N0nX4cJfJbE3YuY-SHUe5gGpTBoGbtZo"; // Use service_role for writes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🖼️ Function to Fetch Open Graph Image
async function fetchOpenGraphImage(url) {
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        return $('meta[property="og:image"]').attr('content') || null;
    } catch (error) {
        console.error(`Failed to fetch OG image from ${url}:`, error.message);
        return null;
    }
}

// 🔄 Update Database with OG Images
async function updateExistingImages() {
    const { data: items, error } = await supabase
        .from('people')
        .select('id, url')
        .is('image', null); // Get all records where image is NULL

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

// 🚀 Run the update script
updateExistingImages();
