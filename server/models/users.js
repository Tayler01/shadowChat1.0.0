import { supabaseFetch, isSupabaseConfigured } from '../config/supabase.js';

export async function upsertUser(user) {
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    return await supabaseFetch('/rest/v1/users', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(user)
    });
  } catch (error) {
    console.error('Failed to upsert user:', error);
    return null;
  }
}

export async function updateProfileImage(id, imageData) {
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    return await supabaseFetch(`/rest/v1/users?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ profile_image: imageData })
    });
  } catch (error) {
    console.error('Failed to update profile image:', error);
    return null;
  }
}