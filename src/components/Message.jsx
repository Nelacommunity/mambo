import { Box, Flex, Text, useColorModeValue, keyframes, Input, Button, useToast, IconButton, Menu, MenuButton, MenuList, MenuItem, Tooltip ,Image } from "@chakra-ui/react";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { MdVerified, MdDoneAll, MdReply, MdMoreVert, MdEdit, MdDelete } from "react-icons/md";
import useTimezone from "../hooks/useTimezone";
import dayjs from "../utils/dayjs-setup";
import { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NOTIFICATION_SOUND = "/audio/send-messages.mp3";

export default function Message({ message, isYou, country, username, onMessageUpdate, onMessageDelete }) {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [originalMessage, setOriginalMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const audioRef = useRef(null);
  const toast = useToast();

  const countyCode = message.country && message.country !== "undefined"
    ? message.country.toLowerCase()
    : "";

  useEffect(() => {
    if (message.reply_to && typeof message.reply_to === 'number') {
      const fetchOriginalMessage = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('id, text, username, is_deleted')
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

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };

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

  const deletedBgColor = useColorModeValue("gray.100", "gray.800");
  const deletedTextColor = useColorModeValue("gray.500", "gray.400");

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
      playNotificationSound();

      toast({
        title: "Reply sent",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Failed to send reply",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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

  const handleScrollToOriginal = () => {
    if (originalMessage?.id) {
      const element = document.getElementById(`message-${originalMessage.id}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        playNotificationSound();
      }
    }
  };

  const handleDeleteMessage = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', message.id);

      if (error) throw error;

      setIsDeleted(true);
      if (onMessageDelete) onMessageDelete(message.id);

      toast({
        title: "Message deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Failed to delete message",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditMessage = async () => {
    if (!editedText.trim() || editedText === message.text) {
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          text: editedText,
          is_updated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);

      if (error) throw error;

      setIsEditing(false);
      setIsUpdated(true);
      if (onMessageUpdate) onMessageUpdate(message.id, editedText);

      toast({
        title: "Message updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Failed to update message",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedText(message.text);
    }
  };

  if (isDeleted) {
    return (
      <Box
        id={`message-${message.id}`}
        maxW={{ base: "85%", md: "75%" }}
        ml={isYou ? "auto" : "0"}
        mr={isYou ? "2" : "auto"}
        my="1"
        px="3"
        py="2"
        borderRadius="xl"
        bg={deletedBgColor}
        color={deletedTextColor}
        fontStyle="italic"
        textAlign={isYou ? "right" : "left"}
      >
        <Text>Message deleted</Text>
        <Text fontSize="xs" color={deletedTextColor}>
          {dayjs.utc(message.timestamp).tz(timezone).format("h:mm A")}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      id={`message-${message.id}`}
      maxW={{ base: "85%", md: "75%" }}
      ml={isYou ? "auto" : "0"}
      mr={isYou ? "2" : "auto"}
      my="1"
      animation={`${fadeIn} 0.2s ease-out`}
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-1px)"
      }}
      position="relative"
      role="group"
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
              onClick={handleScrollToOriginal}
            >
              <Text isTruncated fontWeight="semibold">
                {originalMessage?.username || "Unknown user"}
              </Text>
              <Text isTruncated fontStyle={originalMessage?.is_deleted ? "italic" : "normal"}>
                {originalMessage?.is_deleted ? "Message deleted" : originalMessage?.text || "Message not available"}
              </Text>
            </Box>
          </>
        )}

        {isYou && !isEditing && (
          <Flex
            position="absolute"
            top="-8px"
            right={isYou ? "-8px" : "unset"}
            left={isYou ? "unset" : "-8px"}
            bg={useColorModeValue("white", "gray.800")}
            borderRadius="full"
            boxShadow="md"
            p="1"
            opacity="0"
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s ease"
            zIndex="1"
          >
            <Tooltip label="Edit message" placement="top">
              <IconButton
                aria-label="Edit message"
                icon={<MdEdit />}
                size="xs"
                variant="ghost"
                colorScheme="blue"
                onClick={() => setIsEditing(true)}
                mr="1"
              />
            </Tooltip>
            <Tooltip label="Delete message" placement="top">
              <IconButton
                aria-label="Delete message"
                icon={<MdDelete />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={handleDeleteMessage}
              />
            </Tooltip>
          </Flex>
        )}

        {isEditing ? (
          <Box
            px="3"
            py="2"
            borderRadius="xl"
            borderTopRightRadius={isYou ? "none" : "xl"}
            borderTopLeftRadius={isYou ? "xl" : "none"}
            bg={bgColor}
            color={textColor}
            boxShadow={bubbleShadow}
            width="100%"
          >
            <Input
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
              color={textColor}
              _placeholder={{ color: textColor, opacity: 0.7 }}
              mb={2}
              borderColor={textColor}
              _hover={{ borderColor: textColor }}
              _focus={{ borderColor: textColor, boxShadow: `0 0 0 1px ${textColor}` }}
            />
            <Flex justify="flex-end" gap={2}>
              <Button
                size="xs"
                onClick={() => {
                  setIsEditing(false);
                  setEditedText(message.text);
                }}
                variant="outline"
                color={textColor}
                _hover={{ bg: useColorModeValue("blue.600", "blue.500") }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                colorScheme="blue"
                onClick={handleEditMessage}
                _hover={{ transform: "scale(1.05)" }}
              >
                Save
              </Button>
            </Flex>
          </Box>
        ) : (
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
            {message.gif_url ? (
              <>
                <Image
                  src={message.gif_url}
                  alt="GIF"
                  maxW="250px"
                  borderRadius="md"
                  mb={message.text ? 2 : 0}
                />
                {message.text && (
                  <Text>{message.text}</Text>
                )}
              </>
            ) : (
              <Text>{message.text}</Text>
            )}
            {isUpdated && (
              <Text as="span" fontSize="xs" opacity={0.7} ml={2}>
                (edited)
              </Text>
            )}
          </Box>
        )}

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
            {isUpdated && (
              <Text as="span" ml={1}>
                (edited)
              </Text>
            )}
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