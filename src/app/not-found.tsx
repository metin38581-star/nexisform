import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 text-center">
      <h1 className="mb-2 text-4xl font-bold text-slate-50">404</h1>
      <p className="mb-6 text-slate-400">Aradığın soru bulunamadı.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
