"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  login as loginApi,
  signup as signupApi,
  logout as logoutApi,
  getCurrentUser,
  getStoredUser,
} from "../services/authService";

export function useAuth({ redirectIfMissing = false } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const stored = getStoredUser();
    if (stored) setUser(stored);

    (async () => {
      try {
        const u = await getCurrentUser();
        if (!cancelled) setUser(u);
      } catch (_) {
        if (!cancelled) {
          setUser(null);
          if (redirectIfMissing) router.push("/login");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [redirectIfMissing, router]);

  const login = useCallback(async (data) => {
    const res = await loginApi(data);
    setUser(res.user);
    return res;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await signupApi(data);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, signup, logout };
}

export default useAuth;
