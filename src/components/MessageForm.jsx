import { useState, useRef } from "react";
import {
  Input,
  Stack,
  IconButton,
  useToast,
  Box,
  Container,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import { BiSend, BiImageAlt } from "react-icons/bi";
import { useAppContext } from "../context/appContext";
import supabase from "../supabaseClient";
import GifPicker from "./GifPicker";
import MessageInput from './ImageUpload'

export default function MessageForm() {
  const { username, country, session } = useAppContext();
  const [message, setMessage] = useState("");
  const toast = useToast();
  const [isSending, setIsSending] = useState(false);
  const audioRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    if (!message) return;

    try {
      const { error } = await supabase.from("messages").insert([
        {
          text: message,
          username,
          country,
          is_authenticated: session ? true : false,
        },
      ]);

      if (error) throw error;
      
      setMessage("");
      
      // Play success sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.warn("Audio play failed:", error);
        });
      }
    } catch (error) {
      toast({
        title: "Error sending",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendGif = async (gifUrl) => {
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert([
        {
          gif_url: gifUrl,
          username,
          country,
          is_authenticated: session ? true : false,
        },
      ]);

      if (error) throw error;

      // Play success sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Error sending GIF",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (imageUrl , text) => {
    setIsSending(true);
    console.log('Sending message:', { imageUrl , text})
    try {
      const { error } = await supabase.from("messages").insert([
        {
          imageUrl : imageUrl.imageUrl,
          text,
          username,
          country,
          is_authenticated: session ? true : false,
        },
      ]);

      if (error) throw error;

      // Play success sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Error sending GIF",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box py="10px" pt="15px" bg="gray.100">
      <audio ref={audioRef} src="/audio/default.mp3" preload="auto" />
      
      <Container maxW="600px">
        <form onSubmit={handleSubmit} autoComplete="off">
          <Stack direction="row" align="center">
            <Popover placement="top-start">
              <PopoverTrigger>
                <IconButton
                  aria-label="Send GIF"
                  icon={<BiImageAlt />}
                  variant="ghost"
                  colorScheme="gray"
                />
              </PopoverTrigger>
              <PopoverContent width="auto">
                <GifPicker onSelect={handleSendGif} />
              </PopoverContent>
            </Popover>
            <MessageInput onSendMessage={handleImageUpload}/>
            
            <Input
              name="message"
              placeholder="Enter a message"
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              bg="white"
              border="none"
              autoFocus
              maxLength="500"
              flex="1"
            />
            
            <IconButton
              colorScheme="teal"
              aria-label="Send"
              fontSize="20px"
              icon={<BiSend />}
              type="submit"
              disabled={!message}
              isLoading={isSending}
            />
          </Stack>
        </form>
        <Box fontSize="15px" mt="1" color="blue">
          Welcome to Public Chat room 🙂
        </Box>
      </Container>
    </Box>
  );
}