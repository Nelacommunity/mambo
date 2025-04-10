import { useState, useRef } from 'react';
import { Input, Button, IconButton, Flex, Box, Image, Text } from '@chakra-ui/react';
import { FiImage, FiX } from 'react-icons/fi';
import  supabase  from '../supabaseClient'; // Import your Supabase client
import React from 'react';

function MessageInput({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle Supabase Storage upload
  const uploadToSupabase = async (file) => {
    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('message-images') // Your bucket name
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    let fileUrl = null;
    if (selectedFile) {
      fileUrl = await uploadToSupabase(selectedFile);
    }

  
    onSendMessage({
      imageUrl : fileUrl,
      text: message,
    });

    setMessage('');
    setSelectedFile(null);
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  return (
    <Box>
      {selectedFile && (
        <Flex align="center" mb={2}>
          <Image 
            src={URL.createObjectURL(selectedFile)} 
            boxSize="50px" 
            objectFit="cover" 
            mr={2} 
          />
          <Text fontSize="sm">{selectedFile.name}</Text>
          <IconButton
            icon={<FiX />}
            aria-label="post image"
            size="sm"
            ml="auto"
            variant="ghost"
            colorScheme="gray"
            onClick={() => setSelectedFile(null)}
          />
        </Flex>
      )}

      <Flex gap={2}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <IconButton
          icon={<FiImage />}
          onClick={() => fileInputRef.current.click()}
          aria-label="Attach image"
        />
        <Button 
          colorScheme="blue"
          onClick={handleSend}
          isLoading={isUploading}
        >
          Send
        </Button>
      </Flex>
    </Box>
  );
}

export default MessageInput;