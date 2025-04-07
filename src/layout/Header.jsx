import {
  Button,
  Grid,
  GridItem,
  Image,
  Input,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import supabase from "../supabaseClient";
import { useAppContext } from "../context/appContext";
import NameForm from "./NameForm";

export default function Header() {
  const { username, setUsername, randomUsername, session } = useAppContext();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const toast = useToast();

  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      toast({ title: "Error sending OTP", description: error.message, status: "error" });
    } else {
      setOtpSent(true);
      toast({ title: "OTP sent", description: "Check your phone.", status: "success" });
    }
  };

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) {
      toast({ title: "Verification failed", description: error.message, status: "error" });
    } else {
      toast({ title: "Logged in successfully", status: "success" });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return console.error("Logout error", error);
    const newUsername = randomUsername();
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  };

  return (
    <Grid
      templateColumns="max-content 1fr min-content"
      justifyItems="center"
      alignItems="center"
      bg="white"
      position="sticky"
      top="0"
      zIndex="10"
      borderBottom="20px solid #edf2f7"
      p={2}
    >
      <GridItem justifySelf="start" m="2" display="flex" gap={2}>
        <Image src="rating.png" height="30px" ml="2" />
        <p>Mambo</p>
      </GridItem>

      {session ? (
        <>
          <GridItem justifySelf="end" alignSelf="center" mr="4">
            Welcome <strong>{username}</strong>
          </GridItem>
          <Button
            marginRight="4"
            size="sm"
            variant="link"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </>
      ) : (
        <>
          <GridItem justifySelf="end">
            <VStack spacing={2}>
              {!otpSent ? (
                <>
                  <Input
                    placeholder="Enter phone number"
                    size="sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Button size="sm" colorScheme="teal" onClick={sendOtp}>
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Enter OTP"
                    size="sm"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button size="sm" colorScheme="blue" onClick={verifyOtp}>
                    Verify OTP
                  </Button>
                </>
              )}
              <NameForm username={username} setUsername={setUsername} />
            </VStack>
          </GridItem>
        </>
      )}
    </Grid>
  );
}
