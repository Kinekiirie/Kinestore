import { Link } from "react-router";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="grid place-items-center py-24 text-center">
        <div>
          <p className="text-7xl">🕹️</p>
          <h1 className="mt-4 text-3xl font-black">404 — Halaman tidak ditemukan</h1>
          <p className="mt-2 text-slate-400">Kayaknya kamu salah teleport...</p>
          <Link to="/" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 font-semibold text-white">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </Layout>
  );
}
