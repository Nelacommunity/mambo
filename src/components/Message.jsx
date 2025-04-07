// import { Box, Grid, GridItem } from "@chakra-ui/react";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// dayjs.extend(relativeTime);
// import { MdVerified } from "react-icons/md";
// import { truncateText } from "../utils";

// export default function Message({ message, isYou }) {
//   const countyCode =
//     message.country && message.country !== "undefined"
//       ? message.country.toLowerCase()
//       : "";
//   return (
//     <Box display="grid" justifyItems={isYou ? "end" : "start"}>
//       <Grid
//         templateRows="30px 1fr 25px"
//         templateColumns="1fr"
//         w="70%"
//         px="3"
//         py="2"
//         borderRadius="5px"
//         borderTopLeftRadius={isYou ? "5px" : "0"}
//         borderTopRightRadius={isYou ? "0" : "5px"}
//         bg={isYou ? "#dbfff9" : "#edf3f9"}
//         mt="5"
//         position="relative"
//         _after={{
//           position: "absolute",
//           content: "''",
//           width: 0,
//           height: 0,
//           borderStyle: "solid",
//           borderWidth: isYou ? "0px 0px 10px 10px" : "0px 10px 10px 0",
//           borderColor: isYou
//             ? "transparent transparent transparent #dbfff9"
//             : "transparent #edf3f9 transparent transparent",
//           top: 0,
//           left: isYou ? "auto" : "-10px",
//           right: isYou ? "-10px" : "auto",
//         }}
//       >
//         <GridItem
//           fontWeight="500"
//           fontSize="md"
//           justifySelf="start"
//           color="gray.500"
//           mb="2"
//         >
//           <span>{message.username} </span>
//           {message.is_authenticated && (
//             <MdVerified
//               color="#1d9bf0"
//               style={{ display: "inline", marginRight: "5px" }}
//             />
//           )}
//           {countyCode && (
//             <Box display="inline-block" fontSize="10px">
//               from {message.country}{" "}
//               <img
//                 style={{ display: "inline-block", marginTop: "-4px" }}
//                 src={`/flags/${countyCode}.png`}
//                 alt={message.country}
//               />
//             </Box>
//           )}
//         </GridItem>
//         <GridItem
//           justifySelf="start"
//           textAlign="left"
//           wordBreak="break-word"
//           fontSize="md"
//           fontFamily="Montserrat, sans-serif"
//         >
//           {truncateText(message.text)}
//         </GridItem>
//         <GridItem
//           color="gray"
//           fontSize="10px"
//           justifySelf="end"
//           alignSelf="end"
//         >
//           {dayjs(message.timestamp).fromNow()}
//         </GridItem>
//       </Grid>
//     </Box>
//   );
// }

import { Box, Flex, Text, useColorModeValue, keyframes } from "@chakra-ui/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { MdVerified, MdDoneAll } from "react-icons/md";
import { truncateText } from "../utils";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function Message({ message, isYou, isRead }) {
  const countyCode = message.country && message.country !== "undefined" 
    ? message.country.toLowerCase() 
    : "";

  // Colors
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

  return (
    <Box
      maxW={{ base: "85%", md: "75%" }}
      ml={isYou ? "auto" : "0"}
      mr={isYou ? "2" : "auto"}
      my="1"
      animation={`${fadeIn} 0.2s ease-out`}
    >
      <Flex
        direction="column"
        align={isYou ? "flex-end" : "flex-start"}
        position="relative"
      >
        {/* Message bubble */}
        <Box
          px="3"
          py="2"
          borderRadius="xl"
          borderTopRightRadius={isYou ? "none" : "xl"}
          borderTopLeftRadius={isYou ? "xl" : "none"}
          bg={bgColor}
          color={textColor}
          boxShadow="sm"
          wordBreak="break-word"
          fontSize="md"
          lineHeight="taller"
        >
          {message.text}
        </Box>

        {/* Meta info */}
        <Flex
          align="center"
          mt="1"
          gap="1"
          px="2"
          direction={isYou ? "row" : "row-reverse"}
        >
          {/* Timestamp */}
          <Text
            fontSize="xs"
            color={timeColor}
            fontVariant="tabular-nums"
          >
            {dayjs(message.timestamp).format("h:mm A")}
          </Text>

          {/* Read receipt */}
          {isYou && (
            <Box color={readColor}>
              <MdDoneAll size={16} />
            </Box>
          )}

          {/* Sender info (only for received messages) */}
          {!isYou && (
            <Flex align="center" gap="1">
              {message.is_authenticated && (
                <MdVerified color="#1d9bf0" size={14} />
              )}
              {countyCode && (
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
              )}
              <Text fontSize="xs" color={timeColor}>
                {message.username}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}