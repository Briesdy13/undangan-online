
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getInvitationBySlug, fetchInvitationBySlug, updateInvitation, subscribeLiveUpdates } from "../lib/storage";
import "./Invitation.css";

const themeMeta = {
  "blue-islamic": { icon: "🕌", label: "Blue Islamic" },
  "gold-luxury": { icon: "👑", label: "Gold Luxury" },
  "emerald-mosque": { icon: "💚", label: "Emerald Mosque" },
  "white-elegant": { icon: "🤍", label: "White Elegant" },
  "dark-premium": { icon: "✨", label: "Dark Premium" },
  "royal-sand": { icon: "🏜️", label: "Royal Sand" },
};
function CountdownBox({ label, value, icon }) {
  return <div className="count-box"><span className="count-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div>;
}
function imageUrl(src) {
  if (!src || String(src).includes("/src/assets/")) return "/fathir.jpeg";
  return src;
}
function safeEventDate(inv) {
  const raw = inv?.eventDate || "2026-06-28";
  const date = new Date(`${raw}T10:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? new Date("2026-06-28T10:00:00+07:00") : date;
}

export default function Invitation() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [opened, setOpened] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [inv, setInv] = useState(() => getInvitationBySlug(slug));
  const [notFound, setNotFound] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const audioRef = useRef(null);
  const tamu = searchParams.get("kpd") || searchParams.get("tamu") || "Bapak/Ibu/Saudara/i";
  const [wishName, setWishName] = useState(tamu);
  const [wish, setWish] = useState("");

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const fresh = await fetchInvitationBySlug(slug);
      if (!alive) return;
      if (fresh) { setInv(fresh); setNotFound(false); }
      else setNotFound(true);
    };
    sync();
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    const unsubscribe = subscribeLiveUpdates(sync);
    const interval = setInterval(sync, 3000);
    return () => { alive = false; window.removeEventListener("focus", onFocus); unsubscribe?.(); clearInterval(interval); };
  }, [slug]);

  const targetDate = useMemo(() => safeEventDate(inv), [inv?.eventDate, inv?.eventDateText]);
  const [timeLeft, setTimeLeft] = useState({ days:0, hours:0, minutes:0, seconds:0 });
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(targetDate.getTime() - Date.now(), 0);
      setTimeLeft({ days:Math.floor(diff/86400000), hours:Math.floor((diff/3600000)%24), minutes:Math.floor((diff/60000)%60), seconds:Math.floor((diff/1000)%60) });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  useEffect(() => {
    if (!autoScroll || !opened) return;
    const scroller = setInterval(() => {
      window.scrollBy({ top: 1, behavior: "smooth" });
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 8) setAutoScroll(false);
    }, 28);
    return () => clearInterval(scroller);
  }, [autoScroll, opened]);

  if (notFound || !inv) {
    return <main className="invitation-page"><section className="cover-card premium-card"><h1>Undangan belum ada di database</h1><p>Buka dashboard lalu buat/publish data ke Supabase.</p></section></main>;
  }

  const template = inv.template || "blue-islamic";
  const meta = themeMeta[template] || themeMeta["blue-islamic"];
  const gallery = inv.gallery?.length ? inv.gallery : [inv.mainPhoto || "/fathir.jpeg"];
  const shareUrl = `${window.location.origin}/i/${inv.slug}?kpd=${encodeURIComponent(tamu)}`;

  const playMusic = async () => {
    if (!inv.musicUrl || !audioRef.current) return;
    try { audioRef.current.volume = 0.72; await audioRef.current.play(); setMusicOn(true); } catch { setMusicOn(false); }
  };
  const toggleMusic = async () => {
    if (!inv.musicUrl || !audioRef.current) { alert("Music URL belum diisi."); return; }
    if (musicOn) { audioRef.current.pause(); setMusicOn(false); } else await playMusic();
  };
  const openInvitation = async () => {
    setOpened(true);
    setTimeout(() => document.querySelector(".hero")?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    setTimeout(playMusic, 250);
  };
  const submitRsvp = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = [{ name: form.get("name"), attendance: form.get("attendance"), total: form.get("total"), createdAt: new Date().toISOString() }, ...(inv.rsvps || [])];
    setInv(updateInvitation(inv.id, { rsvps: next }));
    alert("Terima kasih, RSVP sudah terkirim.");
  };
  const submitWish = (e) => {
    e.preventDefault();
    if (!wishName.trim() || !wish.trim()) return;
    const next = [{ name: wishName, message: wish, createdAt: new Date().toISOString() }, ...(inv.wishes || [])];
    setInv(updateInvitation(inv.id, { wishes: next }));
    setWish("");
  };
  const shareInvitation = async () => {
    const text = `Assalamu'alaikum, kami mengundang ${tamu} untuk hadir di acara ${inv.eventType || "Khitanan"} ${inv.childName}. ${shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: inv.title || "Undangan", text, url: shareUrl }); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (inv.suspended) {
    return <main className={`invitation-page ${template}`}><section className="section premium-card"><h2>Undangan Tidak Aktif</h2><p>Silakan hubungi admin.</p></section><footer className="creator-footer">Powered by Briesdy Branstanata</footer></main>;
  }

  return (
    <main className={`invitation-page ${template}`}>
      {inv.musicUrl && <audio ref={audioRef} src={inv.musicUrl} loop preload="auto" playsInline />}
      <div className="theme-aurora"><span></span><span></span><span></span></div>

      {!opened && (
        <section className="cover-layer premium-cover">
          <div className="theme-medallion">{meta.icon}</div>
          <div className="ornament-frame"></div>
          <div className="cover-card premium-card entrance-card">
            <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم</span>
            <p className="small-script cover-label">{inv.eventType || "Khitanan"}</p>
            <h2 className="child-name">{inv.childName}</h2>
            <h3 className="nickname">({inv.nickname})</h3>
            <div className="cover-photo-wrap premium-photo"><img src={imageUrl(inv.mainPhoto)} alt={inv.childName} /></div>
            <p className="kepada">Kepada Yth.</p><h4>{tamu}</h4>
            <button className="primary-btn open-btn" onClick={openInvitation}>✨ Buka Undangan</button>
          </div>
        </section>
      )}

      <section className="hero premium-hero reveal">
        <div className="theme-badge"><span>{meta.icon}</span>{meta.label}</div>
        <div className="hero-glow"></div>
        <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم</span>
        <p className="small-script cover-label">{inv.eventType || "Khitanan"}</p>
        <h2 className="child-name">{inv.childName}</h2>
        <h3 className="nickname">({inv.nickname})</h3>
        <div className="hero-photo premium-photo"><img src={imageUrl(inv.mainPhoto)} alt={inv.childName} /></div>
      </section>

      <section className="intro section premium-card reveal"><div className="section-icon">🌙</div><p>Dengan memohon Rahmat dan Ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara khitanan putra kami.</p><h2>{inv.childName}</h2><h3>({inv.nickname})</h3></section>
      <section className="quote section premium-card reveal"><div className="section-icon">🤲</div><p>Semoga Allah SWT menjadikan ananda anak yang sholeh, sehat, berbakti kepada orang tua, serta menjadi kebanggaan keluarga.</p></section>
      <section className="countdown section premium-card reveal"><p className="small-script">Hitung Mundur</p><h2>Menuju Acara</h2><div className="count-grid"><CountdownBox label="Hari" value={timeLeft.days} icon="📅"/><CountdownBox label="Jam" value={timeLeft.hours} icon="⏰"/><CountdownBox label="Menit" value={timeLeft.minutes} icon="⌛"/><CountdownBox label="Detik" value={timeLeft.seconds} icon="✨"/></div></section>
      <section className="date-card section premium-card reveal"><div className="section-icon">📍</div><p className="small-script">Save The Date</p><h2>{inv.eventDateText || inv.eventDate || "28 Juni 2026"}</h2><div className="event-detail"><p><b>{inv.eventDay}</b></p><p>{inv.eventTime}</p><p>{inv.addressTitle}</p><p>{inv.addressDetail}</p></div><a className="primary-btn map-btn" target="_blank" rel="noreferrer" href={inv.mapsUrl}>🗺️ Maps Lokasi Acara</a></section>

      <section className="gallery section premium-card reveal"><div className="section-icon">🖼️</div><h2>Galeri</h2><div className="gallery-slider"><button type="button" onClick={() => setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length)}>‹</button><img src={imageUrl(gallery[galleryIndex])} alt="Galeri utama" /><button type="button" onClick={() => setGalleryIndex((galleryIndex + 1) % gallery.length)}>›</button></div><div className="gallery-thumbs">{gallery.map((img,i)=><button className={i===galleryIndex ? "active" : ""} key={i} onClick={()=>setGalleryIndex(i)}><img src={imageUrl(img)} alt={`Galeri ${i+1}`}/></button>)}</div></section>

      <section className="rsvp section premium-card reveal"><div className="section-icon">✅</div><h2>RSVP Kehadiran</h2><form onSubmit={submitRsvp}><input name="name" placeholder="Nama" defaultValue={tamu}/><select name="attendance" defaultValue="Hadir"><option>Hadir</option><option>Tidak Hadir</option></select><select name="total" defaultValue="1 Orang"><option>0 Orang</option><option>1 Orang</option><option>2 Orang</option><option>3 Orang</option><option>4 Orang</option></select><button className="primary-btn">Kirim RSVP</button></form></section>
      <section className="gift section premium-card reveal"><div className="section-icon">💝</div><h2>Amplop Digital</h2><div className="bank-card"><span>{inv.bankName}</span><strong>{inv.bankAccount}</strong><small>a.n. {inv.bankOwner}</small></div></section>
      <section className="wishes section premium-card reveal"><div className="section-icon">💌</div><h2>Ucapan & Doa</h2><form onSubmit={submitWish}><input value={wishName} onChange={(e)=>setWishName(e.target.value)} placeholder="Nama"/><textarea value={wish} onChange={(e)=>setWish(e.target.value)} placeholder="Tulis ucapan..." rows="3"></textarea><button className="primary-btn">Kirim Ucapan</button></form><div className="wish-list">{(inv.wishes || []).map((item,index)=><div className="wish-item" key={index}><b>{item.name}</b><p>{item.message}</p></div>)}</div></section>
      <section className="thanks section premium-card thank-card reveal"><p className="small-script">Terima Kasih</p><h2>Merupakan suatu kehormatan dan kebahagiaan bagi kami</h2><p>Apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p><strong>Keluarga Besar</strong><h3>{inv.childName}</h3><button className="primary-btn share-premium" onClick={shareInvitation}>💬 Bagikan via WhatsApp</button></section>

      <div className="floating-tools"><button aria-label="Auto Scroll" onClick={()=>setAutoScroll(!autoScroll)}>{autoScroll ? "⏸" : "▶"}</button><button aria-label="Musik" onClick={toggleMusic}>{musicOn ? "⏸️" : "🎵"}</button><a aria-label="WhatsApp" target="_blank" rel="noreferrer" href={`https://wa.me/${inv.whatsapp}?text=${encodeURIComponent("Halo, saya ingin konfirmasi undangan " + inv.childName)}`}>💬</a><button aria-label="Ke atas" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>↑</button></div>
      <footer className="creator-footer premium-footer">Powered by Briesdy Branstanata</footer>
    </main>
  );
}
