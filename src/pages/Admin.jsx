
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addInvitation, deleteInvitation, updateInvitation, getInvitations, getPackages, getSongs,
  addPackage, updatePackage, deletePackage,
  addSong, updateSong, deleteSong, uploadSongFile,
  refreshRemoteData, validateMusicUrl, subscribeLiveUpdates, waitForSync, makeId
} from "../lib/storage";

const blankInvitation = () => ({
  id: makeId(),
  ownerName:"Customer",
  ownerEmail:"customer@email.com",
  slug:`customer-${Date.now()}`,
  packageName:"Premium",
  template:"blue-islamic",
  status:"draft",
  paymentStatus:"unpaid",
  title:"Undangan Khitanan",
  childName:"UNDANGAN BARU",
  nickname:"",
  eventType:"Khitanan",
  eventDay:"Minggu",
  eventDate:"2026-06-28",
  eventDateText:"28 Juni 2026",
  eventTime:"10.00 WIB s/d selesai",
  addressTitle:"",
  addressDetail:"",
  mapsUrl:"",
  whatsapp:"",
  mainPhoto:"/fathir.jpeg",
  gallery:[],
  guests:[],
  rsvps:[],
  wishes:[],
  checkins:[],
  createdAt:new Date().toISOString()
});

export default function Admin(){
  const [invitations,setInvitations]=useState([]);
  const [packages,setPackages]=useState([]);
  const [songs,setSongs]=useState([]);
  const [err,setErr]=useState("");

  const refresh=()=>{
    setInvitations(getInvitations());
    setPackages(getPackages());
    setSongs(getSongs());
  };

  useEffect(()=>{
    const onErr=(e)=>setErr(String(e.detail||"Supabase error"));
    window.addEventListener("undangan-sync-error",onErr);
    refreshRemoteData(refresh,{force:true});
    const unsub=subscribeLiveUpdates(refresh);
    return()=>{window.removeEventListener("undangan-sync-error",onErr);unsub?.();};
  },[]);

  const sync=async()=>{await waitForSync(); refresh();};

  const createOrder=async()=>{addInvitation(blankInvitation()); await sync();};

  const removeOrder=async(id)=>{if(!confirm("Hapus order ini?"))return; deleteInvitation(id); await sync();};

  const addPkg=async(e)=>{
    e.preventDefault();
    const name=e.currentTarget.name.value.trim();
    const price=Number(e.currentTarget.price.value||0);
    if(!name)return;
    addPackage({name,price,active:true});
    e.currentTarget.reset();
    await sync();
  };

  const updatePkg=async(id,patch)=>{updatePackage(id,patch); await sync();};
  const removePkg=async(id)=>{if(!confirm("Hapus paket?"))return; deletePackage(id); await sync();};

  const addSongUrl=async(e)=>{
    e.preventDefault();
    const title=e.currentTarget.title.value.trim();
    const url=e.currentTarget.url.value.trim();
    if(!title||!validateMusicUrl(url))return alert("Isi judul dan URL file audio langsung.");
    addSong({title,url,active:true});
    e.currentTarget.reset();
    await sync();
  };

  const uploadSong=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const url=await uploadSongFile(file);
    if(url)addSong({title:file.name,url,active:true});
    await sync();
  };

  const totalGuests=invitations.reduce((a,b)=>a+(b.guests?.length||0),0);
  const totalRsvp=invitations.reduce((a,b)=>a+(b.rsvps?.length||0),0);
  const totalPaid=invitations.filter(x=>x.paymentStatus==="paid").length;

  return <main className="admin-page">
    <aside className="sidebar glass">
      <h2>Owner Admin</h2>
      <small>CRUD customer, order, paket, music, payment, suspend.</small><br/><br/>
      <Link className="btn" to="/dashboard">Client Dashboard</Link><br/><br/>
      <button className="btn success" onClick={createOrder}>+ Add Customer/Order</button>
      {err&&<small style={{color:"#ff7777",display:"block",marginTop:12}}>{err}</small>}
    </aside>

    <section className="editor-area">
      <div className="topbar glass"><div><p>Admin / Owner</p><h1>Panel Undangan Online</h1></div><button className="btn" onClick={sync}>Refresh Supabase</button></div>
      <div className="stats-grid">
        <div className="panel glass"><b>Total Order</b><h2>{invitations.length}</h2></div>
        <div className="panel glass"><b>Total Tamu</b><h2>{totalGuests}</h2></div>
        <div className="panel glass"><b>Total RSVP</b><h2>{totalRsvp}</h2></div>
        <div className="panel glass"><b>Paid</b><h2>{totalPaid}</h2></div>
      </div>

      <div className="panel glass"><h2>Customer / Order Add-Edit-Delete</h2>
        <div className="guest-list">{invitations.map(item=><div className="guest-card" key={item.id}>
          <label className="label">Owner<input className="input" value={item.ownerName||""} onChange={(e)=>{updateInvitation(item.id,{ownerName:e.target.value}); sync();}}/></label>
          <label className="label">Nama Anak<input className="input" value={item.childName||""} onChange={(e)=>{updateInvitation(item.id,{childName:e.target.value}); sync();}}/></label>
          <label className="label">Slug<input className="input" value={item.slug||""} onChange={(e)=>{updateInvitation(item.id,{slug:e.target.value.toLowerCase().replaceAll(" ","-")}); sync();}}/></label>
          <label className="label">Paket<select className="input" value={item.packageName||"Premium"} onChange={(e)=>{updateInvitation(item.id,{packageName:e.target.value}); sync();}}>{packages.map(p=><option key={p.id}>{p.name}</option>)}</select></label>
          <label className="label">Theme<select className="input" value={item.template||"blue-islamic"} onChange={(e)=>{updateInvitation(item.id,{template:e.target.value}); sync();}}><option value="blue-islamic">Blue Islamic</option><option value="gold-luxury">Gold Luxury</option><option value="emerald-mosque">Emerald Mosque</option><option value="white-elegant">White Elegant</option><option value="dark-premium">Dark Premium</option></select></label>
          <label className="label">Payment<select className="input" value={item.paymentStatus||"unpaid"} onChange={(e)=>{updateInvitation(item.id,{paymentStatus:e.target.value}); sync();}}><option>unpaid</option><option>pending</option><option>paid</option></select></label>
          <button className="mini-btn" onClick={()=>{updateInvitation(item.id,{suspended:!item.suspended}); sync();}}>{item.suspended?"Aktifkan":"Suspend"}</button>
          <Link className="mini-btn" to={`/i/${item.slug}?kpd=Bapak%20Budi`}>Preview</Link>
          <button className="mini-btn danger" onClick={()=>removeOrder(item.id)}>Delete</button>
        </div>)}</div>
      </div>

      <div className="editor-grid">
        <div className="panel glass"><h2>Paket Add/Edit/Delete</h2>
          <form className="form-grid" onSubmit={addPkg}><input className="input" name="name" placeholder="Nama Paket"/><input className="input" name="price" type="number" placeholder="Harga"/><button className="btn">Add Paket</button></form>
          <div className="guest-list">{packages.map(p=><div className="guest-card" key={p.id}>
            <input className="input" value={p.name||""} onChange={(e)=>updatePkg(p.id,{name:e.target.value})}/>
            <input className="input" type="number" value={p.price||0} onChange={(e)=>updatePkg(p.id,{price:Number(e.target.value)})}/>
            <button className="mini-btn" onClick={()=>updatePkg(p.id,{active:!p.active})}>{p.active?"Active":"Inactive"}</button>
            <button className="mini-btn danger" onClick={()=>removePkg(p.id)}>Delete</button>
          </div>)}</div>
        </div>

        <div className="panel glass"><h2>Music Library Add/Edit/Delete</h2>
          <form className="form-grid" onSubmit={addSongUrl}><input className="input" name="title" placeholder="Judul lagu"/><input className="input" name="url" placeholder="URL MP3"/><button className="btn">Add Lagu URL</button></form><br/>
          <input className="input" type="file" accept="audio/*" onChange={uploadSong}/>
          <div className="guest-list">{songs.map(s=><div className="guest-card" key={s.id}>
            <input className="input" value={s.title||""} onChange={(e)=>{updateSong(s.id,{title:e.target.value}); sync();}}/>
            <input className="input" value={s.url||""} onChange={(e)=>{updateSong(s.id,{url:e.target.value}); sync();}}/>
            {s.url&&<audio controls src={s.url} style={{width:"100%"}}/>}
            <button className="mini-btn" onClick={()=>{updateSong(s.id,{active:!s.active}); sync();}}>{s.active?"Active":"Inactive"}</button>
            <button className="mini-btn danger" onClick={()=>{deleteSong(s.id); sync();}}>Delete</button>
          </div>)}</div>
        </div>
      </div>
      <footer className="creator-footer">Powered by Briesdy Branstanata</footer>
    </section>
  </main>;
}
