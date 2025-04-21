"use client";

import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    <>
      <Toaster position="top-right" richColors />
      {children}
    </>
  );
} 