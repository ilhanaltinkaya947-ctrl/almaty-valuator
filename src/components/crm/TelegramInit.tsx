"use client";

import { useEffect } from "react";

/**
 * Initializes Telegram Mini App: expand to full screen + disable vertical swipes.
 * Mounted once in CRM layout — no need to call expand() in individual pages.
 */
export default function TelegramInit() {
  useEffect(() => {
    try {
      const tg = (window as unknown as { Telegram?: { WebApp: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
      } } }).Telegram?.WebApp;

      if (!tg) return;

      tg.ready();
      tg.expand();

      // disableVerticalSwipes was added in Bot API 7.7+
      if (typeof tg.disableVerticalSwipes === "function") {
        tg.disableVerticalSwipes();
      }

      // Apply overscroll-lock class to html so CSS kicks in
      document.documentElement.classList.add("tma-root");
    } catch {
      // Not running inside Telegram — ignore
    }
  }, []);

  return null;
}
