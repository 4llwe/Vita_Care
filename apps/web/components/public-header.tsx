"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EmergencyButton } from "./emergency-button";
import { MEGA_MENUS } from "../lib/mega-menu";

export function PublicHeader() {
  const [active,setActive]=useState<string|null>(null); const [mobile,setMobile]=useState(false); const header=useRef<HTMLElement>(null);
  useEffect(()=>{const close=(e:MouseEvent)=>{if(!header.current?.contains(e.target as Node))setActive(null)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
  const menu=MEGA_MENUS.find(x=>x.key===active);
  return <header ref={header} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1880px] flex-wrap items-center gap-3 px-4 py-1 lg:px-6">
      <Link href="/" className="flex min-w-0 shrink-0 flex-col items-center gap-0.5" aria-label="Vita Care Hospital At Home">
        <span className="relative h-14 w-[68px] shrink-0 overflow-hidden">
          <Image
            src="/brand/vitacare-lombok-hd.png"
            alt="Logo resmi Vita Care Hospital At Home"
            width={96}
            height={96}
            className="absolute left-1/2 top-0 h-24 w-24 max-w-none -translate-x-1/2 object-contain"
            priority
          />
        </span>
        <span className="text-center leading-none">
          <b className="block text-[13px] font-black tracking-[.11em] text-slate-950">
            VITA CARE
          </b>
          <span className="mt-0.5 hidden text-[8px] font-bold uppercase tracking-[.13em] text-emerald-700 sm:block">
            Hospital At Home
          </span>
        </span>
      </Link>
      <nav className="relative left-1/2 order-3 hidden w-[100vw] min-w-[100vw] max-w-none shrink-0 -translate-x-1/2 items-center justify-center gap-1 border-y border-amber-300/80 bg-[linear-gradient(90deg,#FFF5B8_0%,#FFD65A_48%,#FFF1A0_100%)] px-4 py-2 shadow-[0_6px_24px_rgba(202,138,4,.24),inset_0_1px_0_rgba(255,255,255,.8)] min-[1180px]:flex" aria-label="Navigasi utama">
        {MEGA_MENUS.map(m=><button key={m.key} onMouseEnter={()=>setActive(m.key)} onFocus={()=>setActive(m.key)} onClick={()=>setActive(active===m.key?null:m.key)} className={`min-h-11 rounded-lg px-2.5 text-[13px] font-bold transition ${active===m.key?"bg-emerald-50 text-emerald-800":"text-slate-600 hover:bg-slate-50 hover:text-emerald-800"}`} aria-expanded={active===m.key}>{m.label}</button>)}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2"><EmergencyButton /><Link href="/login" className="hidden min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white sm:inline-flex">MASUK</Link><button onClick={()=>setMobile(!mobile)} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-slate-200 font-black min-[1180px]:hidden" aria-expanded={mobile} aria-label="Buka menu">☰</button></div>
    </div>
    {menu&&<div onMouseLeave={()=>setActive(null)} className="absolute left-1/2 hidden w-[min(1180px,calc(100vw-32px))] -translate-x-1/2 animate-mega-in min-[1180px]:block">
      <div className="mega-gold-panel mt-1 rounded-2xl p-6">
        <div className={`grid gap-7 ${menu.columns.length>=4?"grid-cols-4":"grid-cols-3"}`}>{menu.columns.map(c=><section key={c.title}><div className="flex items-center gap-2 border-b border-amber-200/80 pb-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-800 shadow-sm">{menu.icon}</span><h2 className="font-black text-slate-950">{c.title}</h2></div>{c.description&&<p className="mt-3 text-xs leading-5 text-slate-500">{c.description}</p>}<div className="mt-3 grid gap-0.5">{c.items.map(x=><Link key={x.label} href={x.href} onClick={()=>setActive(null)} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800">{x.label}</Link>)}</div></section>)}</div>
        {(menu.notice||menu.action)&&<div className="mt-5 flex items-center justify-between gap-5 border-t border-slate-100 pt-4">{menu.notice?<p className="max-w-3xl text-xs font-semibold leading-5 text-slate-500">{menu.notice}</p>:<span/>}{menu.action&&<Link href={menu.action.href} className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white">{menu.action.label}</Link>}</div>}
      </div>
    </div>}
    {mobile&&<div className="max-h-[calc(100vh-62px)] overflow-y-auto border-t bg-white p-4 min-[1180px]:hidden"><div className="mx-auto max-w-2xl space-y-2">{MEGA_MENUS.map((m,n)=><details key={m.key} className="rounded-xl border border-slate-200"><summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 font-extrabold text-slate-800"><span className="text-xs text-emerald-700">{String(n+1).padStart(2,"0")}</span>{m.label}<span className="ml-auto">＋</span></summary><div className="border-t border-slate-100 p-3">{m.columns.map(c=><div key={c.title} className="mb-4"><h3 className="px-2 text-xs font-black uppercase tracking-wider text-emerald-700">{c.title}</h3><div className="mt-1 grid">{c.items.map(x=><Link key={x.label} href={x.href} onClick={()=>setMobile(false)} className="min-h-11 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-600 hover:bg-emerald-50">{x.label}</Link>)}</div></div>)}</div></details>)}<div className="grid grid-cols-2 gap-2 pt-2"><EmergencyButton/><Link href="/login" className="grid min-h-12 place-items-center rounded-xl bg-slate-950 font-black text-white">MASUK</Link></div></div></div>}
  </header>;
}
