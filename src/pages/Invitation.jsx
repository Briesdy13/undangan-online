
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getInvitationBySlug, fetchInvitationBySlug, updateInvitation, subscribeLiveUpdates } from "../lib/storage";
import "./Invitation.css";

function imageUrl(src) {
  const raw = typeof src === "string" ? src : (src?.imageUrl || src?.url || "");
  if (!raw || String(raw).includes("/src/assets/")) return "/fathir.jpeg";
  return raw;
}
function safeEventDate(inv) {
  const raw = inv?.eventDate || "2026-06-28";
  const date = new Date(`${raw}T10:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? new Date("2026-06-28T10:00:00+07:00") : date;
}
function initials(name = "T") {
  return String(name || "T").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}
function formatDate(value) {
  try { return new Date(value).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }); } catch { return ""; }
}
function ThemeOrnament() {
  return (
    <>
      <div className="ornament ornament-a"></div>
      <div className="ornament ornament-b"></div>
      <div className="ornament ornament-c"></div>
    </>
  );
}
function CountBox({ label, value }) {
  return <div className="count-box"><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>;
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
  const [qrisOpen, setQrisOpen] = useState(false);
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
    window.addEventListener("focus", sync);
    const unsubscribe = subscribeLiveUpdates(sync);
    const interval = setInterval(sync, 3000);
    return () => { alive = false; window.removeEventListener("focus", sync); unsubscribe?.(); clearInterval(interval); };
  }, [slug]);

  const targetDate = useMemo(() => safeEventDate(inv), [inv?.eventDate, inv?.eventDateText]);
  const [timeLeft, setTimeLeft] = useState({ days:0, hours:0, minutes:0, seconds:0 });
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(targetDate.getTime() - Date.now(), 0);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
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
    return (
      <main className="invitation-page blue-islamic">
        <section className="section premium-card empty-state">
          <h1>Undangan belum ada di database</h1>
          <p>Buka dashboard lalu buat/publish data ke Supabase.</p>
        </section>
      </main>
    );
  }

  const template = inv.template || "blue-islamic";
  const gallery = inv.gallery?.length ? inv.gallery : [inv.mainPhoto || "/fathir.jpeg"];
  const timeline = (inv.timeline || []).slice().sort((a,b)=>(Number(a.sortOrder ?? a.sort_order ?? 0)-Number(b.sortOrder ?? b.sort_order ?? 0)));
  const shareUrl = `${window.location.origin}/i/${inv.slug}?kpd=${encodeURIComponent(tamu)}`;
  const closingText = inv.closingText || "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.";
  const familyName = (inv.familyName || "KELUARGA BESAR BAPAK MUCHTAR").toUpperCase();

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
    setTimeout(playMusic, 260);
  };
  const submitRsvp = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const message = String(form.get("message") || "");
    const name = String(form.get("name") || tamu);
    const nextRsvp = [{ name, attendance: form.get("attendance"), total: form.get("total"), message, createdAt: new Date().toISOString() }, ...(inv.rsvps || [])];
    const nextWish = message ? [{ name, message, createdAt: new Date().toISOString() }, ...(inv.wishes || [])] : inv.wishes;
    setInv(updateInvitation(inv.id, { rsvps: nextRsvp, wishes: nextWish }));
    e.currentTarget.reset();
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
  const copyBank = async () => {
    if (!inv.bankAccount) return;
    await navigator.clipboard?.writeText(inv.bankAccount);
    alert("Nomor rekening disalin.");
  };

  if (inv.suspended) {
    return <main className={`invitation-page ${template}`}><section className="section premium-card"><h2>Undangan Tidak Aktif</h2><p>Silakan hubungi admin.</p></section></main>;
  }

  return (
    <main className={`invitation-page ${template}`}>
      {inv.musicUrl && <audio ref={audioRef} src={inv.musicUrl} loop preload="auto" playsInline />}
      <div className="theme-aurora"><span></span><span></span><span></span></div>
      <ThemeOrnament />

      {!opened && (
        <section className="cover-layer">
          <div className="cover-card premium-card entrance-card">
            <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم</span>
            <p className="small-script">{inv.eventType || "Khitanan"}</p>
            <h2 className="child-name">{inv.childName}</h2>
            <h3 className="nickname">({inv.nickname})</h3>
            <div className="cover-photo-wrap premium-photo"><img src={imageUrl(inv.mainPhoto)} alt={inv.childName} /></div>
            <p className="kepada">Kepada Yth.</p>
            <h4 className="guest-name">{tamu}</h4>
            <button className="primary-btn open-btn" onClick={openInvitation}>✨ Buka Undangan</button>
          </div>
        </section>
      )}

      <section className="hero premium-hero reveal">
        <div className="hero-card">
          <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم</span>
          <p className="small-script">{inv.eventType || "Khitanan"}</p>
          <h1 className="child-name">{inv.childName}</h1>
          <h3 className="nickname">({inv.nickname})</h3>
          {(inv.fatherName || inv.motherName) && (
            <div className="parents-block">
              <span>Putra dari</span>
              <strong>{inv.fatherName}</strong>
              {inv.fatherName && inv.motherName && <em>&</em>}
              <strong>{inv.motherName}</strong>
            </div>
          )}
          <div className="hero-photo premium-photo"><img src={imageUrl(inv.mainPhoto)} alt={inv.childName} /></div>
        </div>
      </section>

      <section className="intro section premium-card reveal">
        <div className="section-icon">🌙</div>
        <p>Dengan memohon Rahmat dan Ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara khitanan putra kami.</p>
        <h2>{inv.childName}</h2>
        <h3>({inv.nickname})</h3>
      </section>

      <section className="countdown section premium-card reveal">
        <p className="small-script">Hitung Mundur</p>
        <h2>Menuju Acara</h2>
        <div className="count-grid">
          <CountBox label="Hari" value={timeLeft.days}/>
          <CountBox label="Jam" value={timeLeft.hours}/>
          <CountBox label="Menit" value={timeLeft.minutes}/>
          <CountBox label="Detik" value={timeLeft.seconds}/>
        </div>
      </section>

      <section className="date-card section premium-card reveal">
        <div className="section-icon">📍</div>
        <p className="small-script">Detail Acara</p>
        <h2>{inv.eventDateText || inv.eventDate || "28 Juni 2026"}</h2>
        <div className="event-detail">
          <p><b>{inv.eventDay}</b></p>
          <p>{inv.eventTime}</p>
          <p>{inv.addressTitle}</p>
          <p>{inv.addressDetail}</p>
        </div>
        <a className="primary-btn map-btn" target="_blank" rel="noreferrer" href={inv.mapsUrl}>🗺️ Buka Google Maps</a>
      </section>

      <section className="timeline section premium-card reveal">
        <div className="section-icon">✨</div>
        <h2>Timeline Acara</h2>
        <div className="timeline-list">
          {timeline.length ? timeline.map((item, index) => (
            <div className="timeline-item" key={item.id || index}>
              <span>{item.time || item.timeText}</span>
              <div><b>{item.title}</b><p>{item.description}</p></div>
            </div>
          )) : <p className="empty-timeline">Belum ada susunan acara</p>}
        </div>
      </section>

      <section className="gallery section premium-card reveal">
        <div className="section-icon">🖼️</div>
        <h2>Galeri</h2>
        <div className="gallery-slider">
          <button type="button" onClick={() => setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length)}>‹</button>
          <img src={imageUrl(gallery[galleryIndex])} alt="Galeri utama" loading="lazy" />
          <button type="button" onClick={() => setGalleryIndex((galleryIndex + 1) % gallery.length)}>›</button>
        </div>
        <div className="gallery-thumbs">
          {gallery.slice(0, 8).map((img,i)=><button className={i===galleryIndex ? "active" : ""} key={i} onClick={()=>setGalleryIndex(i)}><img src={imageUrl(img)} alt={`Galeri ${i+1}`} loading="lazy"/></button>)}
        </div>
      </section>

      <section className="rsvp section premium-card reveal">
        <div className="section-icon">✅</div>
        <h2>RSVP Kehadiran</h2>
        <form onSubmit={submitRsvp}>
          <input name="name" placeholder="Nama" defaultValue={tamu}/>
          <select name="attendance" defaultValue="Hadir"><option>Hadir</option><option>Tidak Hadir</option></select>
          <select name="total" defaultValue="1 Orang"><option>0 Orang</option><option>1 Orang</option><option>2 Orang</option><option>3 Orang</option><option>4 Orang</option></select>
          <textarea name="message" placeholder="Ucapan singkat..." rows="3"></textarea>
          <button className="primary-btn">Kirim RSVP</button>
        </form>
      </section>

      <section className="gift section premium-card reveal">
        <div className="section-icon">💝</div>
        <h2>Amplop Digital</h2>
        <div className="bank-card">
          <span>{inv.bankName}</span>
          <strong>{inv.bankAccount}</strong>
          <small>a.n. {inv.bankOwner}</small>
          <button type="button" onClick={copyBank}>COPY NOMOR REKENING</button>
        </div>
        {inv.qrisUrl && <button className="qris-btn" onClick={() => setQrisOpen(true)}>Lihat QRIS</button>}
      </section>

      <section className="wishes section premium-card reveal">
        <div className="section-icon">💌</div>
        <h2>Ucapan & Doa</h2>
        <form onSubmit={submitWish}>
          <input value={wishName} onChange={(e)=>setWishName(e.target.value)} placeholder="Nama"/>
          <textarea value={wish} onChange={(e)=>setWish(e.target.value)} placeholder="Tulis ucapan..." rows="3"></textarea>
          <button className="primary-btn">Kirim Ucapan</button>
        </form>
        <div className="wish-list">
          {(inv.wishes || []).map((item,index)=><div className="wish-item" key={index}><span className="avatar">{initials(item.name)}</span><div><b>{item.name}</b><small>{formatDate(item.createdAt)}</small><p>{item.message}</p></div></div>)}
        </div>
      </section>

      <section className="thanks section premium-card thank-card reveal">
        <p className="small-script">Terima Kasih</p>
        <h2>{closingText}</h2>
        <strong className="family-name-final">{familyName}</strong>
        <button className="primary-btn share-premium" onClick={shareInvitation}>💬 Bagikan via WhatsApp</button>
      </section>

      <div className="floating-tools">
        <button aria-label="Auto Scroll" onClick={()=>setAutoScroll(!autoScroll)}>{autoScroll ? "⏸" : "▶"}</button>
        <button aria-label="Musik" onClick={toggleMusic}>{musicOn ? "⏸️" : "🎵"}</button>
        <a aria-label="WhatsApp" target="_blank" rel="noreferrer" href={`https://wa.me/${inv.whatsapp}?text=${encodeURIComponent("Halo, saya ingin konfirmasi undangan " + inv.childName)}`}>💬</a>
        <button aria-label="Ke atas" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>↑</button>
      </div>

      {qrisOpen && <div className="qris-modal" onClick={() => setQrisOpen(false)}><img src={imageUrl(inv.qrisUrl)} alt="QRIS" /></div>}
      <footer className="creator-footer premium-footer">Powered by Briesdy Branstanata</footer>
    </main>
  );
}
