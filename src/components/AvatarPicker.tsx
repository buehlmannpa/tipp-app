"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { randomAvatar } from "@/lib/avatars";

// Klick auf den Avatar würfelt eine neue Figur aus der vordefinierten Liste
export default function AvatarPicker({
  name,
  initialAvatar,
}: {
  name: string;
  initialAvatar: string | null;
}) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [spin, setSpin] = useState(false);

  async function shuffle() {
    const next = randomAvatar(avatar);
    setAvatar(next); // optimistisch anzeigen
    setSpin(true);
    setTimeout(() => setSpin(false), 350);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: next }),
    });
    if (res.ok) router.refresh();
    else setAvatar(avatar);
  }

  return (
    <button
      onClick={shuffle}
      aria-label="Avatar ändern (zufällige Figur)"
      className="relative active:opacity-80"
    >
      <span className={spin ? "block animate-pop" : "block"}>
        <Avatar name={name} emoji={avatar} size={64} />
      </span>
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-tint text-[12px] text-white shadow">
        🎲
      </span>
    </button>
  );
}
