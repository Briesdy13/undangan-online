import { Link } from "react-router-dom";
import { packages, templates } from "../lib/seedData";
import { isSupabaseReady } from "../lib/supabase";

function Home() {
  return (
    <main className="page-wrap">
      <nav className="topnav">
        <div className="brand">Undangan Online SaaS</div>
        <div className="navlinks">
          <Link to="/i/khitan-fathir?kpd=Bapak%20Budi">Demo</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </nav>

      <section className="glass" style={{ padding: 36, textAlign: "center" }}>
        <p style={{ color: "#f0b66e", fontWeight: 800 }}>React + Supabase + Vercel Free</p>
        <h1 style={{ fontSize: "clamp(42px,8vw,82px)", lineHeight: .9, margin: "12px 0" }}>
          Platform undangan digital 0 rupiah untuk mulai.
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", maxWidth: 720, margin: "0 auto 24px", lineHeight: 1.8 }}>
          Customer bisa login, edit undangan, pilih template, upload galeri, tambah tamu,
          RSVP, ucapan, music, amplop digital, maps, QR check-in, dan publish link sendiri.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Link className="btn" to="/i/khitan-fathir?kpd=Bapak%20Budi">Lihat Demo Khitanan</Link>
          <Link className="btn secondary" to="/dashboard">Dashboard Customer</Link>
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", marginTop: 20 }}>
        {["Theme/template", "Galeri foto", "RSVP & ucapan", "Amplop digital", "QR check-in", "Custom domain"].map((item) => (
          <div className="card" key={item}><b>{item}</b><p style={{ color:"rgba(255,255,255,.65)" }}>Siap dikembangkan tanpa biaya awal.</p></div>
        ))}
      </section>

      <section className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", marginTop: 20 }}>
        <div className="card">
          <h2>Status Supabase</h2>
          <p>{isSupabaseReady ? "Terhubung" : "Belum diisi env, sekarang pakai cache demo sampai Supabase aktif."}</p>
        </div>
        <div className="card">
          <h2>Template</h2>
          <p>{templates.map(t => t.name).join(", ")}</p>
        </div>
        <div className="card">
          <h2>Paket</h2>
          <p>{packages.map(p => `${p.name} Rp${p.price.toLocaleString("id-ID")}`).join(" • ")}</p>
        </div>
      </section>
    </main>
  );
}
export default Home;
