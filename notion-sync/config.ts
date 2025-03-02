import dotenv from 'dotenv';
import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Client as NotionClient } from '@notionhq/client';

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
if (!process.env.NOTION_API_KEY) throw new Error('NOTION_API_KEY is required');
if (!process.env.NOTION_DATABASE_ID) throw new Error('NOTION_DATABASE_ID is required');

// Initialize Supabase client
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Notion client
export const notion = new NotionClient({
  auth: process.env.NOTION_API_KEY,
}); 