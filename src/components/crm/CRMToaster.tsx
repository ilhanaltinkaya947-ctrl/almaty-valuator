"use client";

import { Toaster } from "sonner";

export default function CRMToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: "#111827",
          border: "1px solid #1E2A3A",
          color: "#F1F3F7",
          fontSize: 13,
        },
      }}
    />
  );
}
