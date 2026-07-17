"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  getLandingRouteForUser
} from "@/services/auth";
import { getme } from "@/services/profile";
import { UserProfile } from "@/types/profile";

export default function HomePage() {
  const router = useRouter();
  const [user,setUser] = useState<UserProfile>()

  useEffect(() => {
    async function handleGetMe() {
      const res = await getme();
      if (!res.error) {
        const data = res.data
        setUser(data);
      }
      return;
    }
    handleGetMe();
    const token = getToken();
    if (token && user) {
      // User is logged in, redirect to dashboard
      const targetRoute = getLandingRouteForUser(user);
      router.replace(targetRoute);
    } else {
      // Not logged in, redirect to login
      router.replace("/auth/login");
    }
  }, [router]);

  // Show nothing while redirecting
  return null;
}
