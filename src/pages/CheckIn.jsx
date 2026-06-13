/* PREMIUM_MOBILE_PATCH */

import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { getInvitationBySlug, updateInvitation } from "../lib/storage";

export default function CheckIn(){
 const { slug }=useParams();
 const [q]=useSearchParams();
 const inv=getInvitationBySlug(slug);
 const name=q.get("kpd")||q.get("tamu")||"Tamu";
 const [done,setDone]=useState(false);
 const [time,setTime]=useState("");
 const checkin=()=>{
   const now=new Date();
   updateInvitation(inv.id,{checkins:[{name,createdAt:now.toISOString()},...(inv.checkins||[])]});
   setTime(now.toLocaleString("id-ID"));
   setDone(true);
   setTimeout(()=>window.location.href=`/i/${slug}?kpd=${encodeURIComponent(name)}`,3000);
 };
 return <main className="admin-page" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
 <section className="panel glass" style={{maxWidth:700,width:"95%",textAlign:"center",padding:"40px"}}>
 {!done ? <>
 <h1 style={{fontSize:"3rem"}}>QR CHECK-IN</h1>
 <h2 style={{fontSize:"2rem"}}>{name}</h2>
 <p>Khitanan {inv.childName}</p>
 <button className="btn success" onClick={checkin}>Konfirmasi Hadir</button>
 </>:
 <>
 <h1 style={{color:"#18d39e"}}>✓ CHECK-IN BERHASIL</h1>
 <h2>{name}</h2>
 <p>{time}</p>
 <h3>Selamat datang di Khitanan {inv.childName}</h3>
 <p>Mengalihkan ke undangan...</p>
 </>}
 </section></main>
}
