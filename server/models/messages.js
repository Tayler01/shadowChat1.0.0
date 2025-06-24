import supabase from '../supabaseClient.js';

export async function saveMessage(message) {
  const { id, type, content, username, userId, timestamp } = message;
  return await supabase.from('messages').insert({
    id,
    type,
    content,
    username,
    user_id: userId,
    created_at: timestamp
  });
}

export async function getChatHistory(limit = 100) {
  return await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);
}
