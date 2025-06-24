import { supabaseFetch } from '../config/supabase.js';

export async function upsertUser(user) {
  return supabaseFetch('/rest/v1/users', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(user)
  });
}

export async function updateProfileImage(id, imageData) {
  return supabaseFetch(`/rest/v1/users?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ profile_image: imageData })
  });
}
