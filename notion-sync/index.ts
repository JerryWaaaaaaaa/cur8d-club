import { notion, supabase } from './config';
import { fetchOpenGraphImage } from './updateImages';

interface NotionItem {
  name: string;
  type: string;
  tags: string[];
  url: string;
  image?: string;
}

interface SupabaseItem extends NotionItem {
  id: number;
}

async function fetchNotionData(): Promise<NotionItem[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    return response.results.map((page: any) => ({
      name: page.properties.name?.title[0]?.plain_text || '',
      type: page.properties.type?.select?.name || '',
      tags: page.properties.tags?.multi_select?.map((tag: any) => tag.name) || [],
      url: page.properties.url?.url || '',
    }));
  } catch (error) {
    console.error('Error fetching Notion data:', error);
    throw error;
  }
}

async function fetchExistingSupabaseData() {
  const { data, error } = await supabase
    .from('people')
    .select('*');
  
  if (error) throw error;
  return data || [];
}

async function getChangedRecords(notionItems: NotionItem[], existingItems: SupabaseItem[]) {
  const toUpdate: SupabaseItem[] = [];
  const toInsert: NotionItem[] = [];
  const toDelete: number[] = [];

  // Create a map of existing items by URL for easy lookup
  const existingItemMap = new Map(existingItems.map(item => [item.url, item]));
  const newItemMap = new Map(notionItems.map(item => [item.url, item]));

  // Find items to update or insert
  for (const notionItem of notionItems) {
    const existingItem = existingItemMap.get(notionItem.url);
    
    if (existingItem) {
      // Check if any fields have changed
      if (
        existingItem.name !== notionItem.name ||
        existingItem.type !== notionItem.type ||
        existingItem.url !== notionItem.url ||
        JSON.stringify(existingItem.tags) !== JSON.stringify(notionItem.tags)
      ) {
        toUpdate.push({ ...notionItem, id: existingItem.id });
      }
    } else {
      toInsert.push(notionItem);
    }
  }

  // Find items to delete (items in Supabase that no longer exist in Notion)
  for (const existingItem of existingItems) {
    if (!newItemMap.has(existingItem.url)) {
      toDelete.push(existingItem.id);
    }
  }

  return { toUpdate, toInsert, toDelete };
}

async function updateSupabase(notionItems: NotionItem[]) {
  try {
    console.log('Fetching existing data from Supabase...');
    const existingItems = await fetchExistingSupabaseData();
    
    const { toUpdate, toInsert, toDelete } = await getChangedRecords(notionItems, existingItems);
    
    console.log(`Found ${toInsert.length} items to insert, ${toUpdate.length} to update, and ${toDelete.length} to delete`);

    // Handle deletions
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .in('id', toDelete);
      
      if (deleteError) throw deleteError;
    }

    // Handle inserts with OG images
    if (toInsert.length > 0) {
      const itemsWithImages = await Promise.all(
        toInsert.map(async (item) => ({
          ...item,
          image: await fetchOpenGraphImage(item.url)
        }))
      );

      const { error: insertError } = await supabase
        .from('people')
        .insert(itemsWithImages);
      
      if (insertError) throw insertError;
    }

    // Handle updates with OG images
    if (toUpdate.length > 0) {
      const itemsWithImages = await Promise.all(
        toUpdate.map(async (item) => ({
          ...item,
          image: await fetchOpenGraphImage(item.url)
        }))
      );

      for (const item of itemsWithImages) {
        const { error: updateError } = await supabase
          .from('people')
          .update(item)
          .eq('id', item.id);
        
        if (updateError) throw updateError;
      }
    }

    console.log(`Successfully synced all changes to Supabase`);
  } catch (error) {
    console.error('Error updating Supabase:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting Notion to Supabase sync...');
    const notionData = await fetchNotionData();
    await updateSupabase(notionData);
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main(); 