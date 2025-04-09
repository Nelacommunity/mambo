import { Box, Input, Button, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { MdGif, MdTrendingUp } from "react-icons/md";

const GifPicker = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("trending"); // 'trending' or 'search'

  // Fetch trending GIFs on initial load
  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=AIzaSyDoy0x-APh77xHJIxL2apqGT5ETt3wDtmM&limit=12`
      );
      const { results } = await response.json();
      setGifs(results.map(gif => ({
        id: gif.id,
        url: gif.media_formats.gif.url,
        preview: gif.media_formats.tinygif.url
      })));
      setMode("trending");
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchGifs = async () => {
    if (!searchTerm.trim()) {
      fetchTrendingGifs();
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=AIzaSyDoy0x-APh77xHJIxL2apqGT5ETt3wDtmM&limit=12`
      );
      const { results } = await response.json();
      setGifs(results.map(gif => ({
        id: gif.id,
        url: gif.media_formats.gif.url,
        preview: gif.media_formats.tinygif.url
      })));
      setMode("search");
    } catch (error) {
      console.error("Error searching GIFs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={2} bg="white" borderRadius="md" boxShadow="md" width="300px">
      <Flex mb={2} gap={2}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search GIFs..."
          size="sm"
          flex="1"
          onKeyPress={(e) => e.key === 'Enter' && searchGifs()}
        />
        <Button
          size="sm"
          onClick={searchGifs}
          isLoading={isLoading}
          leftIcon={<MdGif />}
        >
          Search
        </Button>
        <Button
          size="sm"
          onClick={fetchTrendingGifs}
          variant="ghost"
          title="Show trending GIFs"
        >
          <MdTrendingUp size={18} />
        </Button>
      </Flex>
      
      {mode === "search" && (
        <Text fontSize="sm" mb={2} color="gray.600">
          Results for: {searchTerm}
        </Text>
      )}
      
      {gifs.length > 0 ? (
        <Grid templateColumns="repeat(3, 1fr)" gap={2} maxH="300px" overflowY="auto">
          {gifs.map((gif) => (
            <Image
              key={gif.id}
              src={gif.preview}
              alt="GIF"
              cursor="pointer"
              onClick={() => onSelect(gif.url)}
              _hover={{ transform: "scale(1.05)" }}
              transition="transform 0.2s"
              borderRadius="md"
            />
          ))}
        </Grid>
      ) : (
        <Text textAlign="center" py={4} color="gray.500">
          {isLoading ? "Loading..." : "No GIFs found"}
        </Text>
      )}
    </Box>
  );
};

export default GifPicker;