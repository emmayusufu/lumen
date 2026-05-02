"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { identifyHyperDX } from "@/lib/hyperdx";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
  isAdmin: boolean;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  org_id: string;
  is_admin: boolean;
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch("/api/backend/api/v1/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`auth/me: ${res.status}`);
  const data: MeResponse = await res.json();
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    orgId: data.org_id,
    isAdmin: Boolean(data.is_admin),
  };
}

export function useCurrentUser(): CurrentUser | null {
  const router = useRouter();
  const { data, error } = useSWR<CurrentUser | null>(
    "/api/v1/auth/me",
    fetchCurrentUser,
  );

  useEffect(() => {
    if (data) identifyHyperDX(data);
  }, [data]);

  useEffect(() => {
    if (data === null || error) router.push("/login");
  }, [data, error, router]);

  return data ?? null;
}
