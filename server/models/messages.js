import { supabaseFetch } from '../config/supabase.js';

export async function saveMessage(message) {
  return supabaseFetch('/rest/v1/messages', {
    method: 'POST',
    body: JSON.stringify(message)
  });
}

export async function getChatHistory() {
  return supabaseFetch('/rest/v1/messages?select=*&order=created_at', {
    method: 'GET'
  });
}
