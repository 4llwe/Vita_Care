"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const r = useRouter();
  return (
    <button
      onClick={() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        r.replace("/login");
      }}
      className="text-sm font-bold text-slate-500 hover:text-slate-900"
    >
      Keluar
    </button>
  );
}
