"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

const kinds = ["information", "secure", "request", "contact", "complaint", "partnership"];

export default function MenuManagement() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const load = () =>
    api<any[]>("/menus/admin", { token: getToken() })
      .then((rows) => {
        setGroups(rows);
        setSelected((current) => current || rows[0]?.id || "");
      })
      .catch((error) => setNotice(error.message));
  useEffect(() => {
    void load();
  }, []);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/menus/groups", {
      method: "POST",
      token: getToken(),
      body: {
        key: form.get("key"),
        label: form.get("label"),
        sortOrder: Number(form.get("sortOrder") || 0),
      },
    });
    event.currentTarget.reset();
    setNotice("Kelompok menu ditambahkan");
    await load();
  }
  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/menus/groups/${selected}/items`, {
      method: "POST",
      token: getToken(),
      body: {
        label: form.get("label"),
        slug: form.get("slug"),
        operationKind: form.get("operationKind"),
        requestType: form.get("requestType") || undefined,
        headline: form.get("headline") || undefined,
        sla: form.get("sla") || undefined,
        steps: String(form.get("steps") || "")
          .split(String.fromCharCode(10))
          .filter(Boolean),
        sortOrder: Number(form.get("sortOrder") || 0),
      },
    });
    event.currentTarget.reset();
    setNotice("Submenu ditambahkan dan langsung tersedia");
    await load();
  }
  async function update(path: string, body: Record<string, unknown>) {
    await api(path, { method: "PATCH", token: getToken(), body });
    setNotice("Perubahan disimpan");
    await load();
  }
  async function remove(path: string) {
    if (!confirm("Nonaktifkan menu ini?")) return;
    await api(path, { method: "DELETE", token: getToken() });
    setNotice("Menu dinonaktifkan");
    await load();
  }
  const group = groups.find((item) => item.id === selected);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-teal-300">
          Super Admin CMS
        </p>
        <h1 className="mt-2 text-3xl font-black">Manajemen Menu Terintegrasi</h1>
        <p className="mt-2 text-slate-300">
          Tambah, edit, urutkan, dan nonaktifkan menu publik tanpa mengubah source code.
        </p>
      </section>
      {notice && (
        <p role="status" className="rounded-xl bg-teal-50 p-4 text-teal-900">
          {notice}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="medical-card">
          <h2 className="font-black">Kelompok menu</h2>
          <div className="mt-3 space-y-2">
            {groups.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={`w-full rounded-xl border p-3 text-left ${selected === item.id ? "border-teal-600 bg-teal-50" : ""}`}
              >
                <b>{item.label}</b>
                <span className="block text-xs text-slate-500">
                  {item.key} · {item.items.length} item ·{" "}
                  {item.isActive ? "aktif" : "nonaktif"}
                </span>
              </button>
            ))}
          </div>
          <form onSubmit={createGroup} className="mt-5 space-y-2 border-t pt-4">
            <h3 className="font-bold">Tambah kelompok</h3>
            <input
              name="label"
              required
              placeholder="Nama kelompok"
              className="min-h-11 w-full rounded-xl border px-3"
            />
            <input
              name="key"
              required
              pattern="[a-z0-9-]+"
              placeholder="key-url"
              className="min-h-11 w-full rounded-xl border px-3"
            />
            <input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue="99"
              className="min-h-11 w-full rounded-xl border px-3"
            />
            <button className="min-h-11 w-full rounded-xl bg-slate-900 font-black text-white">
              Tambah kelompok
            </button>
          </form>
        </aside>
        <main className="space-y-5">
          {group && (
            <>
              <section className="medical-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{group.label}</h2>
                    <p className="text-sm text-slate-500">/{group.key}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const label = prompt("Nama kelompok", group.label);
                        if (label) void update(`/menus/groups/${group.id}`, { label });
                      }}
                      className="rounded-xl border px-4 py-2 font-bold"
                    >
                      Edit nama
                    </button>
                    <button
                      onClick={() => void remove(`/menus/groups/${group.id}`)}
                      className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700"
                    >
                      Nonaktifkan
                    </button>
                  </div>
                </div>
              </section>
              <section className="space-y-3">
                {group.items.map((item: any) => (
                  <article key={item.id} className="medical-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-teal-700">
                          {item.operationKind} · urutan {item.sortOrder}
                        </p>
                        <h3 className="mt-1 text-lg font-black">{item.label}</h3>
                        <p className="text-sm text-slate-500">
                          /informasi/{group.key}/{item.slug}
                        </p>
                        <p className="mt-2 text-sm">
                          {item.headline ??
                            item.description ??
                            "Belum ada deskripsi khusus"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const label = prompt("Nama submenu", item.label);
                            const headline = prompt("Headline", item.headline ?? "");
                            if (label)
                              void update(`/menus/items/${item.id}`, { label, headline });
                          }}
                          className="rounded-xl border px-3 py-2 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void remove(`/menus/items/${item.id}`)}
                          className="rounded-xl border border-red-200 px-3 py-2 font-bold text-red-700"
                        >
                          Nonaktifkan
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
              <form
                onSubmit={createItem}
                className="medical-card grid gap-3 md:grid-cols-2"
              >
                <h2 className="text-lg font-black md:col-span-2">Tambah submenu</h2>
                <input
                  name="label"
                  required
                  placeholder="Nama submenu"
                  className="min-h-11 rounded-xl border px-3"
                />
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="slug-url"
                  className="min-h-11 rounded-xl border px-3"
                />
                <select name="operationKind" className="min-h-11 rounded-xl border px-3">
                  {kinds.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
                <select name="requestType" className="min-h-11 rounded-xl border px-3">
                  <option value="">Tanpa formulir</option>
                  <option>SERVICE</option>
                  <option>BOOKING</option>
                  <option>PARTNERSHIP</option>
                  <option>CONTACT</option>
                  <option>COMPLAINT</option>
                  <option>DOWNLOAD_SUPPORT</option>
                </select>
                <input
                  name="headline"
                  placeholder="Headline operasional"
                  className="min-h-11 rounded-xl border px-3 md:col-span-2"
                />
                <textarea
                  name="steps"
                  placeholder="Satu langkah per baris"
                  className="min-h-28 rounded-xl border p-3 md:col-span-2"
                />
                <input
                  name="sla"
                  placeholder="SLA respons"
                  className="min-h-11 rounded-xl border px-3"
                />
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={group.items.length}
                  className="min-h-11 rounded-xl border px-3"
                />
                <button className="min-h-11 rounded-xl bg-teal-700 font-black text-white md:col-span-2">
                  Tambah submenu
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
