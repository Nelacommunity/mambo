import { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "../supabaseClient";

const AppContext = createContext({});

const AppContextProvider = ({ children }) => {
  let myChannel = null;
  const [username, setUsername] = useState("");
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [routeHash, setRouteHash] = useState("");
  const [isOnBottom, setIsOnBottom] = useState(false);
  const [newIncomingMessageTrigger, setNewIncomingMessageTrigger] = useState(null);
  const [unviewedMessageCount, setUnviewedMessageCount] = useState(0);
  const [countryCode, setCountryCode] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  
  // Audio ref for new message sound
  const newMessageSoundRef = useRef(null);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      scrollToBottom();
    }
  }, [messages]);

  const playNewMessageSound = () => {
    try {
      if (newMessageSoundRef.current) {
        newMessageSoundRef.current.currentTime = 0; // Rewind to start
        newMessageSoundRef.current.play().catch(error => {
          console.warn("Audio play failed:", error);
        });
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const getLocation = async () => {
    try {
      const res = await fetch("https://api.db-ip.com/v2/free/self");
      const { countryCode, error } = await res.json();
      if (error) throw new Error(error);

      setCountryCode(countryCode);
      localStorage.setItem("countryCode", countryCode);
    } catch (error) {
      console.error("error getting location from api.db-ip.com:", error.message);
    }
  };

  const randomUsername = () => `@user${Date.now().toString().slice(-4)}`;

  const initializeUser = (session) => {
    setSession(session);
    let username;
    if (session) {
      username = session.user.user_metadata.user_name;
    } else {
      username = localStorage.getItem("username") || randomUsername();
    }
    setUsername(username);
    localStorage.setItem("username", username);
  };

  const onMessageUpdate = (messageId, newText) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === messageId
          ? { ...message, text: newText, is_updated: true }
          : message
      )
    );
  };

  const onMessageDelete = (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === messageId
          ? { ...message, is_deleted: true }
          : message
      )
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeUser(session);
    });

    getMessagesAndSubscribe();

    const storedCountryCode = localStorage.getItem("countryCode");
    if (storedCountryCode && storedCountryCode !== "undefined")
      setCountryCode(storedCountryCode);
    else getLocation();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeUser(session);
    });

    return () => {
      if (myChannel) {
        supabase.removeChannel(myChannel);
      }
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!newIncomingMessageTrigger) return;
    
    // Play sound for new messages that aren't from the current user
    if (newIncomingMessageTrigger.username !== username) {
      playNewMessageSound();
    }
    
    if (newIncomingMessageTrigger.username === username) {
      scrollToBottom();
    } else {
      setUnviewedMessageCount((prevCount) => prevCount + 1);
    }
  }, [newIncomingMessageTrigger]);

  const handleNewMessage = (payload) => {
    // Skip if this is a delete operation
    if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
      return;
    }
  
    // Skip if this is an update to an already deleted message
    const existingMessage = messages.find(m => m.id === payload.new.id);
    if (existingMessage?.is_deleted) {
      return;
    }
  
    // For new messages or non-delete updates
    setMessages((prevMessages) => {
      // If this is an update, replace the existing message
      if (payload.eventType === 'UPDATE') {
        return prevMessages.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        );
      }
      // For new messages, prepend to the list
      return [payload.new, ...prevMessages];
    });
  
    // Trigger new message effects only for non-updates
    if (payload.eventType !== 'UPDATE') {
      setNewIncomingMessageTrigger(payload.new);
      if (payload.new.username !== username) {
        setUnviewedMessageCount((prevCount) => prevCount + 1);
      }
    }
  };

  const getInitialMessages = async () => {
    if (messages.length) return;

    const { data, error } = await supabase
      .from("messages")
      .select()
      .range(0, 49)
      .order("id", { ascending: false });

    setLoadingInitial(false);
    if (error) {
      setError(error.message);
      return;
    }

    setIsInitialLoad(true);
    setMessages(data);
  };

  const getMessagesAndSubscribe = async () => {
    setError("");
    await getInitialMessages();

    if (!myChannel) {
      myChannel = supabase
        .channel("custom-all-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          (payload) => handleNewMessage(payload)
        )
        .subscribe();
    }
  };

  const scrollRef = useRef();
  const onScroll = async ({ target }) => {
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 1) {
      setUnviewedMessageCount(0);
      setIsOnBottom(true);
    } else {
      setIsOnBottom(false);
    }

    if (target.scrollTop === 0) {
      const { data, error } = await supabase
        .from("messages")
        .select()
        .range(messages.length, messages.length + 49)
        .order("id", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      target.scrollTop = 1;
      setMessages((prevMessages) => [...prevMessages, ...data]);
    }
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => {
    // Update the site title with the number of unread messages
    if (unviewedMessageCount > 0) {
      document.title = `(${unviewedMessageCount}) New Messages - Mambo`;
    } else {
      document.title = "Mambo";
    }
  }, [unviewedMessageCount]);

  return (
    <AppContext.Provider
      value={{
        messages,
        loadingInitial,
        error,
        getMessagesAndSubscribe,
        username,
        setUsername,
        randomUsername,
        routeHash,
        scrollRef,
        onScroll,
        scrollToBottom,
        isOnBottom,
        country: countryCode,
        unviewedMessageCount,
        session,
        onMessageUpdate,
        onMessageDelete
      }}
    >
      {/* Hidden audio element for new message notifications */}
      <audio 
        ref={newMessageSoundRef} 
        src="/audio/new-message.mp3" 
        preload="auto" 
      />
      
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

export { AppContext as default, AppContextProvider, useAppContext };