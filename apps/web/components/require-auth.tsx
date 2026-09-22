"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../lib/auth";

/** Pembungkus client yang mengarahkan ke /login bila token tidak ada. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Memeriksa sesi…
      </div>
    );
  }
  return <>{children}</>;
}
