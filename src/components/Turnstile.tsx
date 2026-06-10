"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Cloudflare-Turnstile-Widget (Bot-Schutz). Ohne konfigurierten Site-Key
// wird nichts gerendert und die Registrierung läuft ohne Captcha.
export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;

    const render = () => {
      if (!window.turnstile || !ref.current || rendered.current) return;
      rendered.current = true;
      window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
        theme: "auto",
        language: "de",
      });
    };

    if (window.turnstile) {
      render();
      return;
    }
    window.onTurnstileLoad = render;
    if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="flex justify-center" />;
}
