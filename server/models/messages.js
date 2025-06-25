import { supabaseFetch, isSupabaseConfigured } from '../config/supabase.js';

export async function saveMessage(message) {
  if (!isSupabaseConfigured) {
    console.log('Supabase not configured - message not persisted:', message);
    return null;
  }
  
  try {
    return await supabaseFetch('/rest/v1/messages', {
      method: 'POST',
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Failed to save message:', error);
    return null;
  }
}

export async function getChatHistory() {
  if (!isSupabaseConfigured) {
    console.log('Supabase not configured - returning empty chat history');
    return [];
  }
  
  try {
    return await supabaseFetch('/rest/v1/messages?select=*&order=created_at', {
      method: 'GET'
    });
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return [];
  }
}