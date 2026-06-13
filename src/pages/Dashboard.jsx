
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addInvitation, deleteInvitation, getInvitations, getSongs, updateSong, addSong, deleteSong,
  updateInvitation, uploadGalleryFile, uploadSongFile, deleteStorageFile, refreshRemoteData, validateMusicUrl,
  subscribeLiveUpdates, waitForSync, getSupabaseStatus, makeId
} from "../lib/storage";
import { templates, featureAccess } from "../lib/seedData";

const newInvitation = () => ({
  id: makeId(),
  ownerName: "Customer",
  ownerEmail: "customer@email.com",
  slug: "khitan-fathir",
  packageName: "Premium",
  template: "blue-islamic",
  status: "published",
  paymentStatus: "paid",
  title: "Undangan Khitanan",
  childName: "FATHIR IBRAHIM MUCHTAR",
  nickname: "BA'IM",
  fatherName: "Bpk. Muchtar",
  motherName: "Ibu Linah Apriyanti",
  familyName: "KELUARGA BESAR BAPAK MUCHTAR",
  closingText: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  eventType: "Khitanan",
  eventDay: "Minggu",
  eventDate: "2026-06-28",
  eventDateText: "28 Juni 2026",
  eventTime: "10.00 WIB s/d selesai",
  addressTitle: "Kepa Duri",
  addressDetail: "Jln Duri Intan 5 RT 003/RW 012 No 127, Kec. Kebon Jeruk, Jakarta Barat",
  mapsUrl: "https://www.google.com/maps",
  whatsapp: "62895322266675",
  musicTitle: "",
  musicUrl: "",
  bankName: "BCA",
  bankAccount: "1234567890",
  bankOwner: "Briesdy Branstanata",
  mainPhoto: "/fathir.jpeg",
  gallery: [],
  guests: ["Bapak Budi"],
  rsvps: [],
  wishes: [],
  checkins: [],
  timeline: [],
  createdAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
});

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [songs, setSongs] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [tab, setTab] = useState("data");
  const [busy, setBusy] = useState(true);
  const [syncError, setSyncError] = useState("");
  const data = items.find((x) => x.id === activeId) || items[0] || null;

  const reload = () => {
    const next = getInvitations();
    setItems(next);
    setSongs(getSongs());
    if (!activeId || !next.find((x) => x.id === activeId)) setActiveId(next[0]?.id || "");
    setBusy(false);
  };

  useEffect(() => {
    const onErr = (e) => setSyncError(String(e.detail || "Supabase sync error"));
    window.addEventListener("undangan-sync-error", onErr);
    refreshRemoteData(reload, { force: true });
    const unsub = subscribeLiveUpdates(reload);
    const timer = setInterval(() => refreshRemoteData(reload, { force: true }), 10000);
    return () => {
      window.removeEventListener("undangan-sync-error", onErr);
      unsub?.();
      clearInterval(timer);
    };
  }, []);

  const syncNow = async (message = "") => {
    setBusy(true);
    setSyncError("");
    await waitForSync();
    reload();
    setBusy(false);
    if (message) alert(message);
  };

  const save = (patch) => {
    if (!data) return;
    updateInvitation(data.id, patch);
    reload();
  };

  const createFirst = async () => {
    const item = addInvitation(newInvitation());
    setActiveId(item.id);
    await syncNow("Data pertama berhasil dibuat di Supabase.");
  };

  const createNew = async () => {
    const item = addInvitation({ ...newInvitation(), id: makeId(), slug: `undangan-${Date.now()}`, childName: "UNDANGAN BARU", gallery: [], guests: [] });
    setActiveId(item.id);
    await syncNow("Undangan baru dibuat di Supabase.");
  };

  const removeInvitation = async () => {
    if (!data || !confirm("Hapus undangan ini dari Supabase?")) return;
    deleteInvitation(data.id);
    await syncNow("Undangan dihapus dari Supabase.");
  };

  const publish = async () => {
    save({ status:"published", publishedAt:new Date().toISOString() });
    await syncNow("Publish selesai dan tersimpan di Supabase.");
  };

  const uploadGallery = async (e) => {
    if (!data) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const nextItems = [];
    for (const file of files) {
      const url = await uploadGalleryFile(file);
      if (url) nextItems.push({ id: makeId(), imageUrl: url, sortOrder: (data.gallery || []).length + nextItems.length, caption: "", createdAt: new Date().toISOString() });
    }
    if (nextItems.length) {
      const gallery = [...(data.gallery || []), ...nextItems];
      updateInvitation(data.id, { gallery, mainPhoto: data.mainPhoto || nextItems[0].imageUrl });
    }
    e.target.value = "";
    await syncNow(nextItems.length ? "Foto tersimpan ke Supabase Storage dan database." : "");
  };

  const editGallery = async (index, file) => {
    if (!data || !file) return;
    setBusy(true);
    const old = (data.gallery || [])[index];
    const oldUrl = typeof old === "string" ? old : old?.imageUrl;
    const newUrl = await uploadGalleryFile(file);
    if (!newUrl) { await syncNow(""); return; }
    const gallery = [...(data.gallery || [])];
    gallery[index] = { ...(typeof old === "object" ? old : {}), id: old?.id || makeId(), imageUrl: newUrl, sortOrder: old?.sortOrder ?? index, updatedAt: new Date().toISOString() };
    const mainPhoto = data.mainPhoto === oldUrl ? newUrl : data.mainPhoto;
    updateInvitation(data.id, { gallery, mainPhoto });
    await deleteStorageFile(oldUrl);
    await syncNow("Foto berhasil diedit dan tersimpan permanen.");
  };

  const deleteGallery = async (index) => {
    if (!data || !confirm("Hapus foto ini dari dashboard, frontend, database, dan storage?")) return;
    const gallery = [...(data.gallery || [])];
    const removed = gallery.splice(index, 1)[0];
    const removedUrl = typeof removed === "string" ? removed : removed?.imageUrl;
    const normalized = gallery.map((g, i) => typeof g === "string" ? { id: makeId(), imageUrl: g, sortOrder: i } : { ...g, sortOrder: i });
    const mainPhoto = removedUrl && data.mainPhoto === removedUrl ? ((normalized[0]?.imageUrl) || "") : data.mainPhoto;
    updateInvitation(data.id, { gallery: normalized, mainPhoto });
    await deleteStorageFile(removedUrl);
    await syncNow("Foto dihapus dari Supabase dan Storage.");
  };

  const setAsCover = async (item) => {
    const url = typeof item === "string" ? item : item?.imageUrl;
    save({ mainPhoto:url });
    await syncNow("Cover tersimpan ke database.");
  };


  const addTimeline = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const item = {
      id: makeId(),
      time: String(f.get("time") || "").trim(),
      title: String(f.get("title") || "").trim(),
      description: String(f.get("description") || "").trim(),
      icon: String(f.get("icon") || "").trim(),
      sortOrder: Number(f.get("sortOrder") || ((data.timeline || []).length + 1)),
      createdAt: new Date().toISOString(),
    };
    if (!item.time && !item.title && !item.description) return;
    updateInvitation(data.id, { timeline: [...(data.timeline || []), item].sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)) });
    e.currentTarget.reset();
    await syncNow("Timeline ditambahkan ke Supabase.");
  };

  const editTimeline = async (index, patch) => {
    const timeline = [...(data.timeline || [])];
    timeline[index] = { ...timeline[index], ...patch, sortOrder: patch.sortOrder !== undefined ? Number(patch.sortOrder || 0) : timeline[index]?.sortOrder };
    updateInvitation(data.id, { timeline: timeline.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)) });
    await syncNow("Timeline di-update di Supabase.");
  };

  const deleteTimeline = async (index) => {
    if (!confirm("Hapus item timeline ini?")) return;
    const timeline = [...(data.timeline || [])];
    timeline.splice(index, 1);
    updateInvitation(data.id, { timeline: timeline.map((t,i)=>({ ...t, sortOrder: t.sortOrder ?? i })) });
    await syncNow("Timeline dihapus dari Supabase.");
  };

  const addGuest = async (e) => {
    e.preventDefault();
    const name = e.currentTarget.guest.value.trim();
    if (!name) return;
    updateInvitation(data.id, { guests:[...(data.guests || []), name] });
    e.currentTarget.reset();
    await syncNow();
  };

  const editGuest = async (i, value) => {
    const guests = [...(data.guests || [])];
    guests[i] = value;
    updateInvitation(data.id, { guests });
    await syncNow();
  };

  const deleteGuest = async (i) => {
    const guests = [...(data.guests || [])];
    guests.splice(i, 1);
    updateInvitation(data.id, { guests });
    await syncNow();
  };

  const addRsvp = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    updateInvitation(data.id, { rsvps:[{ name:f.get("name"), attendance:f.get("attendance"), total:f.get("total"), createdAt:new Date().toISOString() }, ...(data.rsvps || [])] });
    e.currentTarget.reset();
    await syncNow();
  };

  const deleteRsvp = async (i) => {
    const rsvps = [...(data.rsvps || [])];
    rsvps.splice(i, 1);
    updateInvitation(data.id, { rsvps });
    await syncNow();
  };

  const addWish = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    updateInvitation(data.id, { wishes:[{ name:f.get("name"), message:f.get("message"), createdAt:new Date().toISOString() }, ...(data.wishes || [])] });
    e.currentTarget.reset();
    await syncNow();
  };

  const deleteWish = async (i) => {
    const wishes = [...(data.wishes || [])];
    wishes.splice(i, 1);
    updateInvitation(data.id, { wishes });
    await syncNow();
  };

  const addCheckin = async (name) => {
    updateInvitation(data.id, { checkins:[{ name, createdAt:new Date().toISOString() }, ...(data.checkins || [])] });
    await syncNow();
  };

  const deleteCheckin = async (i) => {
    const checkins = [...(data.checkins || [])];
    checkins.splice(i, 1);
    updateInvitation(data.id, { checkins });
    await syncNow();
  };

  const addSongUrl = async (e) => {
    e.preventDefault();
    const title = e.currentTarget.title.value.trim();
    const url = e.currentTarget.url.value.trim();
    if (!title || !validateMusicUrl(url)) return alert("Isi judul dan URL audio langsung.");
    addSong({ title, url, active:true });
    e.currentTarget.reset();
    await syncNow();
  };

  const uploadSong = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadSongFile(file);
    if (url) addSong({ title:file.name, url, active:true });
    await syncNow(url ? "Lagu tersimpan ke Supabase." : "");
  };

  const updateSongRow = async (id, patch) => {
    updateSong(id, patch);
    await syncNow();
  };

  const removeSong = async (id) => {
    deleteSong(id);
    await syncNow();
  };

  const shareGuest = (name) => {
    const url = `${window.location.origin}/i/${data.slug}?kpd=${encodeURIComponent(name)}`;
    const text = `Undangan ${data.childName || ""} untuk ${name}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const tabs = [["data","Data Acara"],["gallery","Galeri Foto Upload"],["timeline","Susunan Acara"],["theme","Theme Selector"],["guests","Daftar Tamu"],["rsvp","RSVP Masuk"],["wishes","Ucapan Masuk"],["gift","Amplop Digital"],["music","Music Background"],["publish","Preview & Publish"],["checkin","Data Kehadiran"]];

  if (busy && !data) return <main className="admin-page"><section className="panel glass"><h1>Loading Supabase...</h1></section></main>;

  if (!data) return (
    <main className="admin-page">
      <section className="panel glass">
        <h1>Database Supabase kosong</h1>
        <p>Tidak ada data lokal/default. Klik ini untuk membuat data pertama di Supabase.</p>
        {syncError && <p style={{color:"#ff7777"}}>{syncError}</p>}
        <button className="btn" onClick={createFirst}>+ Buat Data Pertama</button>
      </section>
    </main>
  );

  const tier = (data?.packageTier || data?.packageName || "premium").toLowerCase().includes("basic") ? "basic" : "premium";
  const allowedThemes = featureAccess[tier]?.themes || featureAccess.premium.themes;
  const canUseTheme = (id) => allowedThemes.includes(id);

  const publicUrl = `${window.location.origin}/i/${data.slug}`;
  const sampleUrl = `${publicUrl}?kpd=${encodeURIComponent(data.guests?.[0] || "Bapak Budi")}`;

  return (
    <main className="admin-page">
      <aside className="sidebar glass">
        <h2>Client Dashboard</h2>
        <small>Supabase 100% database-only</small><br/><br/>
        <button className="btn" onClick={createNew}>+ Add Undangan</button>
        <div className="side-list">{items.map((item)=><button key={item.id} className={item.id===data.id?"side-item active":"side-item"} onClick={()=>setActiveId(item.id)}><b>{item.childName || "(Tanpa Nama)"}</b><span>/{item.slug} • {item.status}</span></button>)}</div>
      </aside>

      <section className="editor-area">
        <div className="topbar glass">
          <div><p>Premium Invitation Editor</p><h1>{data.childName || "(Tanpa Nama)"}</h1><small>{busy ? "Syncing..." : "Supabase connected"}</small>{syncError && <small style={{color:"#ff7777",display:"block"}}>{syncError}</small>}</div>
          <div className="actions"><Link className="btn secondary" to={sampleUrl}>Preview</Link><button className="btn success" onClick={publish}>Publish</button><button className="btn danger" onClick={removeInvitation}>Delete</button></div>
        </div>

        <div className="tabs">{tabs.map(([k,l])=><button key={k} className={tab===k?"tab active":"tab"} onClick={()=>setTab(k)}>{l}</button>)}</div>

        {tab==="data" && <div className="editor-grid">
          <div className="panel glass"><h2>Data Acara</h2><div className="form-grid">
            <label className="label">Nama Anak<input className="input" value={data.childName || ""} onChange={(e)=>save({childName:e.target.value})}/></label>
            <label className="label">Nama Panggilan<input className="input" value={data.nickname || ""} onChange={(e)=>save({nickname:e.target.value})}/></label>
            <label className="label">Nama Ayah<input className="input" value={data.fatherName || ""} onChange={(e)=>save({fatherName:e.target.value})}/></label>
            <label className="label">Nama Ibu<input className="input" value={data.motherName || ""} onChange={(e)=>save({motherName:e.target.value})}/></label>
            <label className="label">Nama Keluarga Besar<input className="input" value={data.familyName || ""} onChange={(e)=>save({familyName:e.target.value})}/></label>
            <label className="label">Kata Penutup<textarea className="input" rows="4" value={data.closingText || ""} onChange={(e)=>save({closingText:e.target.value})}/></label>
            <label className="label">Slug Link<input className="input" value={data.slug || ""} onChange={(e)=>save({slug:e.target.value.toLowerCase().replaceAll(" ","-")})}/></label>
            <label className="label">Hari<input className="input" value={data.eventDay || ""} onChange={(e)=>save({eventDay:e.target.value})}/></label>
            <label className="label">Tanggal Tampil<input className="input" value={data.eventDateText || ""} onChange={(e)=>save({eventDateText:e.target.value})}/></label>
            <label className="label">Tanggal Countdown<input className="input" type="date" value={data.eventDate || ""} onChange={(e)=>save({eventDate:e.target.value})}/></label>
            <label className="label">Jam<input className="input" value={data.eventTime || ""} onChange={(e)=>save({eventTime:e.target.value})}/></label>
          </div></div>
          <div className="panel glass"><h2>Lokasi & Kontak</h2><div className="form-grid">
            <label className="label">Nama Lokasi<input className="input" value={data.addressTitle || ""} onChange={(e)=>save({addressTitle:e.target.value})}/></label>
            <label className="label">Alamat<textarea className="input" rows="5" value={data.addressDetail || ""} onChange={(e)=>save({addressDetail:e.target.value})}/></label>
            <label className="label">Maps URL<input className="input" value={data.mapsUrl || ""} onChange={(e)=>save({mapsUrl:e.target.value})}/></label>
            <label className="label">WhatsApp<input className="input" value={data.whatsapp || ""} onChange={(e)=>save({whatsapp:e.target.value})}/></label>
          </div></div>
        </div>}

        {tab==="gallery" && <div className="panel glass">
          <h2>Galeri Foto Upload</h2>
          <p className="hint">Dashboard sekarang membaca URL asli dari Supabase/database. Add menambah foto baru, Edit mengganti foto dipilih, Delete menghapus foto dipilih.</p>
          <input className="input" type="file" multiple accept="image/*" onChange={uploadGallery}/>
          <div className="gallery-admin" style={{marginTop:16}}>
            {(data.gallery||[]).map((item,i)=>{
              const url = typeof item === "string" ? item : (item?.imageUrl || item?.url || "");
              const key = typeof item === "string" ? `${item}-${i}` : (item?.id || `${url}-${i}`);
              return <div className="guest-card" key={key}>
                <img src={url || "/fathir.jpeg"} onError={(e)=>{e.currentTarget.src="/fathir.jpeg"}}/>
                <div className="gallery-actions">
                  <button className="mini-btn" onClick={()=>setAsCover(item)}>Jadikan Cover</button>
                  <label className="mini-btn">Edit Foto
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>editGallery(i, e.target.files?.[0])}/>
                  </label>
                  <button className="mini-btn danger" onClick={()=>deleteGallery(i)}>Delete</button>
                </div>
              </div>
            })}
          </div>
        </div>}


        {tab==="timeline" && <div className="panel glass"><h2>Susunan Acara / Timeline Acara</h2><p className="hint">Data timeline full dari Supabase. Jika kosong, frontend menampilkan "Belum ada susunan acara".</p><form className="form-grid" onSubmit={addTimeline}><label className="label">Jam Acara<input className="input" name="time" placeholder="10.00 WIB"/></label><label className="label">Judul Acara<input className="input" name="title" placeholder="Pembukaan"/></label><label className="label">Deskripsi<input className="input" name="description" placeholder="Deskripsi acara"/></label><label className="label">Icon Opsional<input className="input" name="icon" placeholder="✨"/></label><label className="label">Sort Order<input className="input" type="number" name="sortOrder" defaultValue={(data.timeline||[]).length+1}/></label><button className="btn success">+ Tambah Acara</button></form><div className="timeline-admin">{(data.timeline||[]).slice().sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)).map((item,i)=><div className="guest-card timeline-edit" key={item.id || i}><label className="label">Jam<input className="input" value={item.time || ""} onChange={(e)=>editTimeline(i,{time:e.target.value})}/></label><label className="label">Judul<input className="input" value={item.title || ""} onChange={(e)=>editTimeline(i,{title:e.target.value})}/></label><label className="label">Deskripsi<textarea className="input" rows="2" value={item.description || ""} onChange={(e)=>editTimeline(i,{description:e.target.value})}/></label><label className="label">Sort Order<input className="input" type="number" value={item.sortOrder ?? i} onChange={(e)=>editTimeline(i,{sortOrder:e.target.value})}/></label><button className="mini-btn danger" onClick={()=>deleteTimeline(i)}>Delete</button></div>)}{!(data.timeline||[]).length && <p>Belum ada susunan acara</p>}</div></div>}

        {tab==="theme" && <div className="panel glass"><h2>Theme Selector</h2><div className="stats-grid">{templates.map((t)=> {
            const locked = !canUseTheme(t.id);
            return <button key={t.id} className={data.template===t.id?"side-item active":"side-item"} disabled={locked} onClick={()=> locked ? alert("Theme ini khusus paket Premium. Upgrade paket untuk membuka.") : save({template:t.id})}>
              <b>{t.icon || "✨"} {t.name} {locked ? "🔒" : ""}</b>
              <span>{t.description || t.id}</span>
            </button>
          })}</div></div>}

        {tab==="guests" && <div className="panel glass"><h2>Daftar Tamu</h2><form onSubmit={addGuest} className="form-grid"><input className="input" name="guest" placeholder="Nama tamu"/><button className="btn">Add Tamu</button></form><div className="guest-list">{(data.guests||[]).map((name,i)=><div className="guest-card" key={`${name}-${i}`}><input className="input" value={name} onChange={(e)=>editGuest(i,e.target.value)}/><small>{`/i/${data.slug}?kpd=${encodeURIComponent(name)}`}</small><button className="mini-btn" onClick={()=>shareGuest(name)}>Bagikan</button><button className="mini-btn danger" onClick={()=>deleteGuest(i)}>Delete</button></div>)}</div></div>}

        {tab==="rsvp" && <div className="panel glass"><h2>RSVP Masuk</h2><form className="form-grid" onSubmit={addRsvp}><input className="input" name="name" placeholder="Nama"/><select className="input" name="attendance"><option>Hadir</option><option>Tidak Hadir</option></select><input className="input" name="total" placeholder="Total"/><button className="btn">Add RSVP</button></form><div className="guest-list">{(data.rsvps||[]).map((r,i)=><div className="guest-card" key={i}><b>{r.name}</b><small>{r.attendance} • {r.total}</small><button className="mini-btn danger" onClick={()=>deleteRsvp(i)}>Delete</button></div>)}</div></div>}

        {tab==="wishes" && <div className="panel glass"><h2>Ucapan Masuk</h2><form className="form-grid" onSubmit={addWish}><input className="input" name="name" placeholder="Nama"/><textarea className="input" name="message" placeholder="Ucapan"/><button className="btn">Add Ucapan</button></form><div className="guest-list">{(data.wishes||[]).map((w,i)=><div className="guest-card" key={i}><b>{w.name}</b><small>{w.message}</small><button className="mini-btn danger" onClick={()=>deleteWish(i)}>Delete</button></div>)}</div></div>}

        {tab==="gift" && <div className="panel glass"><h2>Amplop Digital</h2><div className="form-grid"><label className="label">Bank<input className="input" value={data.bankName || ""} onChange={(e)=>save({bankName:e.target.value})}/></label><label className="label">No Rekening<input className="input" value={data.bankAccount || ""} onChange={(e)=>save({bankAccount:e.target.value})}/></label><label className="label">Nama Rekening<input className="input" value={data.bankOwner || ""} onChange={(e)=>save({bankOwner:e.target.value})}/></label></div></div>}

        {tab==="music" && <div className="editor-grid"><div className="panel glass"><h2>Musik Undangan</h2><select className="input" value={data.musicUrl || ""} onChange={(e)=>{const s=songs.find(x=>x.url===e.target.value);save({musicUrl:e.target.value,musicTitle:s?.title||""})}}><option value="">No Music</option>{songs.filter(s=>s.active).map(s=><option key={s.id} value={s.url}>{s.title}</option>)}</select><br/><br/><input className="input" type="file" accept="audio/*" onChange={async(e)=>{const url=await uploadSongFile(e.target.files?.[0]); if(url){save({musicUrl:url,musicTitle:e.target.files[0].name}); await syncNow("Lagu dipasang.");}}}/>{data.musicUrl && <audio controls src={data.musicUrl} style={{width:"100%",marginTop:12}}/>}</div><div className="panel glass"><h2>Library Lagu</h2><form className="form-grid" onSubmit={addSongUrl}><input className="input" name="title" placeholder="Judul"/><input className="input" name="url" placeholder="URL MP3"/><button className="btn">Add URL</button></form><br/><input className="input" type="file" accept="audio/*" onChange={uploadSong}/><div className="guest-list">{songs.map(s=><div className="guest-card" key={s.id}><input className="input" value={s.title} onChange={(e)=>updateSongRow(s.id,{title:e.target.value})}/><input className="input" value={s.url || ""} onChange={(e)=>updateSongRow(s.id,{url:e.target.value})}/>{s.url && <audio controls src={s.url} style={{width:"100%"}}/>}<button className="mini-btn" onClick={()=>save({musicUrl:s.url,musicTitle:s.title})}>Pakai</button><button className="mini-btn" onClick={()=>updateSongRow(s.id,{active:!s.active})}>{s.active?"Active":"Inactive"}</button><button className="mini-btn danger" onClick={()=>removeSong(s.id)}>Delete</button></div>)}</div></div></div>}

        {tab==="publish" && <div className="editor-grid"><div className="panel glass"><h2>Publish Link</h2><div className="publish-box">{publicUrl}</div><br/><div className="publish-box">{sampleUrl}</div><br/><button className="btn success" onClick={publish}>Publish Sekarang</button></div><div className="panel glass"><h2>Live Preview</h2><div className="preview-phone"><iframe src={sampleUrl}></iframe></div></div></div>}

        {tab==="checkin" && <div className="panel glass"><h2>Data Kehadiran</h2><div className="guest-list">{(data.guests||[]).map(g=><div className="guest-card" key={g}><b>{g}</b><small>{`${window.location.origin}/checkin/${data.slug}?kpd=${encodeURIComponent(g)}`}</small><button className="mini-btn" onClick={()=>addCheckin(g)}>Manual Hadir</button></div>)}</div><h2>Data Bagikan</h2>{(data.checkins||[]).map((c,i)=><div className="guest-card" key={i}><b>{c.name}</b><small>{c.createdAt ? new Date(c.createdAt).toLocaleString("id-ID") : "-"}</small><button className="mini-btn danger" onClick={()=>deleteCheckin(i)}>Delete</button></div>)}</div>}

        <footer className="creator-footer">Powered by Briesdy Branstanata</footer>
      </section>
    </main>
  );
}
