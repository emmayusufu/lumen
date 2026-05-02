"use client";

import HyperDX from "@hyperdx/browser";

let started = false;

export function initHyperDX(): void {
  if (started || typeof window === "undefined") return;
  const apiKey = process.env.NEXT_PUBLIC_HYPERDX_API_KEY;
  if (!apiKey) return;
  const customUrl = process.env.NEXT_PUBLIC_HYPERDX_URL;
  HyperDX.init({
    apiKey,
    service: process.env.NEXT_PUBLIC_HYPERDX_SERVICE ?? "lumen-web",
    tracePropagationTargets: [/\/api\/backend\//],
    consoleCapture: true,
    advancedNetworkCapture: true,
    ...(customUrl ? { url: customUrl } : {}),
  });
  started = true;
}

export function identifyHyperDX(user: {
  id: string;
  email: string;
  name: string;
}): void {
  if (!started) return;
  HyperDX.setGlobalAttributes({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  });
}
