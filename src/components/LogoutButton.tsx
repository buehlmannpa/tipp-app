"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="card w-full py-3.5 text-[16px] font-semibold text-red active:opacity-70"
    >
      Abmelden
    </button>
  );
}
