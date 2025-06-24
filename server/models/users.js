import supabase from '../supabaseClient.js';

export async function upsertUser({ id, username }) {
  return await supabase.from('users').upsert({ id, username });
}

export async function updateProfileImage(id, url) {
  return await supabase.from('users').update({ profile_image_url: url }).eq('id', id);
}
