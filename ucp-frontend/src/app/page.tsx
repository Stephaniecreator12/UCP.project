"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  getLandingRouteForUser
} from "@/services/auth";
import { getme } from "@/services/profile";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    getme().then((res) => {
      if (!res.error) {
        const data = res.data;
        const targetRoute = getLandingRouteForUser(data);
        router.replace(targetRoute);
      } else {
        router.replace("/auth/login");
      }
    });
  }, [router]);

  // Show nothing while redirecting
  return null;
}
