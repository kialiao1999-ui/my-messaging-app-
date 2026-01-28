import { supabase } from "../config/supabase";

// Check if conversation exists between two users
export async function findExistingConversation(userId1, userId2) {
  const { data } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId1);

  if (!data) return null;

  const conversationIds = data.map((cp) => cp.conversation_id);

  const { data: otherUserConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId2)
    .in("conversation_id", conversationIds);

  return otherUserConvs?.[0]?.conversation_id || null;
}

// Create new conversation
export async function createConversation(userId1, userId2) {
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (convError) throw convError;

  const { error: participantsError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: userId1 },
      { conversation_id: conversation.id, user_id: userId2 },
    ]);

  if (participantsError) throw participantsError;

  return conversation.id;
}
