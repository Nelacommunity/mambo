import { Box, Flex, Text, useColorModeValue, keyframes, Input, Button } from "@chakra-ui/react";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { MdVerified, MdDoneAll, MdReply } from "react-icons/md";
import useTimezone from "../hooks/useTimezone";
import dayjs from "../utils/dayjs-setup";
import { useState, useEffect } from "react";
import supabase from "../supabaseClient";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function Message({ message, isYou, country, username }) {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [originalMessage, setOriginalMessage] = useState(null);

  const countyCode = message.country && message.country !== "undefined" 
    ? message.country.toLowerCase() 
    : "";

  useEffect(() => {
    if (message.reply_to && typeof message.reply_to === 'number') {
      const fetchOriginalMessage = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('id, text, username')
            .eq('id', message.reply_to)
            .single();
          
          if (error) throw error;
          setOriginalMessage(data);
        } catch (error) {
          console.error('Error fetching original message:', error);
        }
      };
      
      fetchOriginalMessage();
    } else if (message.reply_to && typeof message.reply_to === 'object') {
      setOriginalMessage(message.reply_to);
    }
  }, [message.reply_to]);

  const bgColor = isYou 
    ? useColorModeValue("blue.500", "blue.600")
    : useColorModeValue("gray.100", "gray.700");
  
  const textColor = isYou 
    ? "white"
    : useColorModeValue("gray.800", "gray.100");

  const timeColor = isYou
    ? "blue.100"
    : useColorModeValue("gray.500", "gray.400");

  const readColor = isYou ? "blue.200" : "transparent";
  const replyBgColor = useColorModeValue("gray.50", "gray.600");
  const replyBorderColor = useColorModeValue("gray.200", "gray.500");
  const replyTextColor = useColorModeValue("gray.600", "gray.300");

  const timezone = useTimezone();

  const bubbleShadow = isYou
    ? useColorModeValue("sm", "dark-lg")
    : useColorModeValue("sm", "md");

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    setIsReplying(true);
    
    try {
      const { data, error } = await supabase
        .from('messages') 
        .insert([{
          text: replyText,
          username: username, 
          reply_to: message.id, 
          country: country, 
          is_authenticated: false 
        }]);
      
      if (error) throw error;
      
      setReplyText('');
      
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const handleReplyClick = (e) => {
    e.stopPropagation();
    handleSendReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Add scroll to original message function
  const handleScrollToOriginal = () => {
    if (originalMessage?.id) {
      const element = document.getElementById(`message-${originalMessage.id}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  return (
    <Box
      id={`message-${message.id}`} // Add ID to message container
      maxW={{ base: "85%", md: "75%" }}
      ml={isYou ? "auto" : "0"}
      mr={isYou ? "2" : "auto"}
      my="1"
      animation={`${fadeIn} 0.2s ease-out`}
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-1px)"
      }}
    >
      <Flex
        direction="column"
        align={isYou ? "flex-end" : "flex-start"}
        position="relative"
      >
        {message.reply_to && (
          <>
            <Flex
              align="center"
              mb="1"
              fontSize="xs"
              color={replyTextColor}
              width="100%"
              direction={isYou ? "row-reverse" : "row"}
            >
              <MdReply size={14} style={{ margin: isYou ? "0 0 0 4px" : "0 4px 0 0" }} />
              <Text isTruncated maxW="160px">
                Replying to {originalMessage?.username || "a message"}
              </Text>
            </Flex>
            <Box
              width="100%"
              mb="2"
              px="2"
              py="1"
              borderRadius="md"
              bg={replyBgColor}
              borderLeft="3px solid"
              borderColor={replyBorderColor}
              fontSize="sm"
              color={replyTextColor}
              cursor="pointer"
              _hover={{ bg: useColorModeValue("gray.100", "gray.500") }}
              onClick={handleScrollToOriginal} // Add click handler
            >
              <Text isTruncated fontWeight="semibold">
                {originalMessage?.username || "Unknown user"}
              </Text>
              <Text isTruncated fontStyle={!originalMessage?.text ? "italic" : "normal"}>
                {originalMessage?.text || "Message deleted"}
              </Text>
            </Box>
          </>
        )}

        <Box
          px="3"
          py="2"
          borderRadius="xl"
          borderTopRightRadius={isYou ? "none" : "xl"}
          borderTopLeftRadius={isYou ? "xl" : "none"}
          bg={bgColor}
          color={textColor}
          boxShadow={bubbleShadow}
          wordBreak="break-word"
          fontSize="md"
          lineHeight="taller"
          position="relative"
          _after={{
            content: '""',
            position: 'absolute',
            width: 0,
            height: 0,
            border: '8px solid transparent',
            [isYou ? 'right' : 'left']: 0,
            [isYou ? 'borderRight' : 'borderLeft']: 0,
            [isYou ? 'borderTop' : 'borderTop']: `8px solid ${bgColor}`,
            top: '100%',
            [isYou ? 'marginRight' : 'marginLeft']: '-8px',
          }}
        >
          {message.text}
        </Box>

        <Box mt="2" width="100%">
          <Flex gap="2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              size="sm"
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleReplyClick}
              isLoading={isReplying}
              isDisabled={!replyText.trim()}
            >
              Reply
            </Button>
          </Flex>
        </Box>

        <Flex
          align="center"
          mt="1"
          gap="1"
          px="2"
          direction={isYou ? "row" : "row-reverse"}
        >
          <Text
            fontSize="xs"
            color={timeColor}
            fontVariant="tabular-nums"
            whiteSpace="nowrap"
          >
            {dayjs.utc(message.timestamp).tz(timezone).format("h:mm A")}
          </Text>

          {isYou && (
            <Box color={readColor}>
              <MdDoneAll size={16} />
            </Box>
          )}

          {!isYou && (
            <Flex align="center" gap="1" maxW="100%">
              {message.is_authenticated && (
                <MdVerified color="#1d9bf0" size={14} />
              )}
              {countyCode && (
                <Box flexShrink={0}>
                  <img
                    src={`/flags/${countyCode}.png`}
                    alt={message.country}
                    style={{
                      width: "14px",
                      height: "10px",
                      borderRadius: "1px",
                      objectFit: "cover"
                    }}
                  />
                </Box>
              )}
              <Text 
                fontSize="xs" 
                color={timeColor}
                isTruncated
                maxW="120px"
              >
                {message.username}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}