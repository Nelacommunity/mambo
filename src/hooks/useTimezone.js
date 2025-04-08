// hooks/useTimezone.js
import { useEffect, useState } from "react";

export default function useTimezone() {
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTimezone(detected);
  }, []);

  return timezone;
}
