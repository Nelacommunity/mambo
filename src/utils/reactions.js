const sendMessage = async (text, replyTo = null) => {
    const { data, error } = await supabase.from("messages").insert([
      {
        text,
        username,
        reply_to: replyTo,
      },
    ]);
  
    if (error) {
      setError(error.message);
    }
  };
  
  const addReaction = async (messageId, emoji) => {
    const { data: message } = await supabase
      .from("messages")
      .select("reactions")
      .eq("id", messageId)
      .single();
  
    const reactions = message.reactions || {};
    const updatedUsers = new Set(reactions[emoji] || []);
    updatedUsers.add(username); // You may want to toggle instead
  
    const updatedReactions = {
      ...reactions,
      [emoji]: Array.from(updatedUsers),
    };
  
    const { error } = await supabase
      .from("messages")
      .update({ reactions: updatedReactions })
      .eq("id", messageId);
  
    if (error) {
      setError(error.message);
    }
  };
  