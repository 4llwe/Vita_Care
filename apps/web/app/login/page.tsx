"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

type LoginResp = {
  authenticated?: boolean;
  accessToken?: string;
  require2fa?: boolean;
  tmpToken?: string;
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
      if (r.require2fa && r.tmpToken) {
        setTempToken(r.tmpToken);
      } else if (r.authenticated || r.accessToken) {
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
      const r = await api<LoginResp>("/auth/2fa", {
        method: "POST",
        body: { tmpToken: tempToken, otp },
      });
      if (r.authenticated || r.accessToken) {
        router.push("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-vita-green to-vita-blueDark p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-vita-green text-2xl text-white">
            🏥
          </div>
          <h1 className="text-lg font-extrabold text-vita-greenDark">
            Vita Care Lombok
          </h1>
          <p className="text-xs text-slate-400">Masuk ke sistem home care</p>
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
