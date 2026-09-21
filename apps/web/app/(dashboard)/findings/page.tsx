"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { FindingTable } from "../../../components/finding-table";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";

type Finding = {
  id: string;
  code: string;
  description: string;
  category: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  pic?: { name: string } | null;
  deadline?: string | null;
};

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Finding[]>("/findings", { token: getToken() })
      .then(setFindings)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-emerald-900">
          Manajemen Temuan
        </h1>
        <p className="text-sm text-slate-500">
          Setiap temuan bernomor otomatis dengan kategori & level risiko.
        </p>
      </header>

      {error ? (
        <ErrorBox message={error} />
      ) : !findings ? (
        <Loading />
      ) : findings.length === 0 ? (
        <Empty label="Belum ada temuan tercatat." />
      ) : (
        <FindingTable findings={findings} />
      )}
    </section>
  );
}
