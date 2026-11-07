"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Ask your library has been removed for launch.
// Redirect to dashboard to prevent dead links.
export default function AskPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return null;
}
