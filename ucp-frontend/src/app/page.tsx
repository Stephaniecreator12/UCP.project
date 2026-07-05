"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  getCurrentUser,
  getLandingRouteForUser,
} from "@/services/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();

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
