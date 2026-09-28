"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { ROLE_LABEL, type Role } from "../../../lib/session";
import { ErrorBox, Loading } from "../../../components/async-state";

const roles = Object.keys(ROLE_LABEL) as Role[];
type UserRow = { id: string; name: string; email: string; role: Role; isActive: boolean; roleAssignments: Array<{ role: Role }>; healthWorkerProfile?: { profession: string; isActive: boolean } | null };

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => api<UserRow[]>("/admin/users", { token: getToken() }).then(setRows);
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  async function save(user: UserRow, role: Role, isActive: boolean) {
    setError(""); setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "PATCH", token: getToken(), body: { role, isActive } });
      setMessage(`Akses ${user.name} diperbarui. Sesi aktifnya telah dicabut.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memperbarui pengguna"); }
  }
  if (!rows) return error ? <ErrorBox message={error} /> : <Loading />;
  return <div className="space-y-5">
    <header><p className="eyebrow">Administrasi akses</p><h1 className="mt-2 text-3xl font-black">Manajemen Pengguna</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Perubahan role dan status akun diaudit. Perubahan akses mencabut sesi aktif agar kebijakan baru langsung berlaku.</p></header>
    {error ? <ErrorBox message={error} /> : null}
    {message ? <p role="status" className="rounded-xl bg-teal-50 p-4 text-sm font-semibold text-teal-900">{message}</p> : null}
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Pengguna</th><th className="p-4">Role utama</th><th className="p-4">Role efektif</th><th className="p-4">Status</th><th className="p-4">Tindakan</th></tr></thead><tbody className="divide-y">{rows.map((user) => <UserEditor key={user.id} user={user} onSave={save} />)}</tbody></table></div>
  </div>;
}

function UserEditor({ user, onSave }: { user: UserRow; onSave: (user: UserRow, role: Role, active: boolean) => Promise<void> }) {
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.isActive);
  const [busy, setBusy] = useState(false);
  return <tr className="align-top"><td className="p-4"><b className="text-slate-900">{user.name}</b><span className="block text-xs text-slate-500">{user.email}</span>{user.healthWorkerProfile ? <span className="mt-1 block text-xs text-teal-700">{user.healthWorkerProfile.profession}</span> : null}</td><td className="p-4"><select value={role} onChange={(event) => setRole(event.target.value as Role)} className="min-h-11 rounded-xl border px-3">{roles.map((item) => <option key={item} value={item}>{ROLE_LABEL[item]}</option>)}</select></td><td className="p-4 text-xs text-slate-600">{[user.role, ...user.roleAssignments.map((item) => item.role)].filter((item, index, all) => all.indexOf(item) === index).map((item) => ROLE_LABEL[item]).join(", ")}</td><td className="p-4"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Aktif</label></td><td className="p-4"><button disabled={busy || (role === user.role && active === user.isActive)} onClick={async () => { setBusy(true); await onSave(user, role, active).finally(() => setBusy(false)); }} className="min-h-10 rounded-xl bg-teal-700 px-4 font-bold text-white disabled:opacity-40">{busy ? "Menyimpan…" : "Simpan"}</button></td></tr>;
}
