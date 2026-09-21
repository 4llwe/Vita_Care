"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

type LoginResp = {
  accessToken?: string;
  requires2fa?: boolean;
  tempToken?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vitacare.id");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-vita-green focus:outline-none focus:ring-1 focus:ring-vita-green";

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api<LoginResp>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (r.requires2fa && r.tempToken) {
        setTempToken(r.tempToken);
      } else if (r.accessToken) {
        setToken(r.accessToken);
        router.push("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function doVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api<LoginResp>("/auth/verify-2fa", {
        method: "POST",
        body: { tempToken, code: otp },
      });
      if (r.accessToken) {
        setToken(r.accessToken);
        router.push("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#047857,#020617_68%)] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 text-center">
          <Image src="/brand/vitacare-lombok-hd.png" alt="Logo Vita Care Hospital At Home" width={92} height={72} className="mx-auto mb-3 h-20 w-24 object-contain" />
          <h1 className="text-lg font-extrabold text-vita-greenDark">
            Vita Care Hospital At Home
          </h1>
          <p className="text-xs text-slate-400">Perawatan Profesional, Nyaman di Rumah.</p>
        </div>

        {!tempToken ? (
          <form onSubmit={doLogin} className="space-y-3">
            <input
              className={input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              placeholder="Kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-lg bg-vita-green py-2.5 font-bold text-white hover:bg-vita-greenDark disabled:opacity-60"
            >
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>
        ) : (
          <form onSubmit={doVerify} className="space-y-3">
            <p className="text-sm text-slate-600">
              Masukkan kode 2FA dari aplikasi authenticator Anda.
            </p>
            <input
              className={`${input} text-center tracking-[0.5em]`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-lg bg-vita-green py-2.5 font-bold text-white hover:bg-vita-greenDark disabled:opacity-60"
            >
              {loading ? "Memverifikasi…" : "Verifikasi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
