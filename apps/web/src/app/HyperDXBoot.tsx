"use client";

import { useEffect } from "react";
import { initHyperDX } from "@/lib/hyperdx";

export function HyperDXBoot() {
  useEffect(() => {
    initHyperDX();
  }, []);
  return null;
}
