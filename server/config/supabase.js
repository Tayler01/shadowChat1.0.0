import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const isSupabaseConfigured = SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL !== 'your_supabase_url_here' && 
  SUPABASE_KEY !== 'your_supabase_key_here';

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials are not configured - running in memory-only mode');
}

export async function supabaseFetch(path, options = {}) {
  if (!isSupabaseConfigured) {
    // Return empty array for GET requests, null for others when Supabase is not configured
    if (options.method === 'GET' || !options.method) {
      return [];
    }
    return null;
  }
  
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase request failed: ${text}`);
  }
  
  // Handle 204 No Content responses
  if (res.status === 204) {
    return null;
  }
  
  // Check if response has content before parsing JSON
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') {
    return null;
  }
  
  return res.json();
}

export { isSupabaseConfigured };