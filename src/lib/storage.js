
import { supabase, isSupabaseReady } from "./supabase";

let invitationsCache = [];
let packagesCache = [];
let songsCache = [];
let loadedRemote = false;
let pendingWrites = [];
const CHANNEL = "undangan-online-supabase-only";

export function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex().slice(1)}-${hex()}${hex()}${hex()}`;
}

function cleanImageUrl(src) {
  if (!src || String(src).includes("/src/assets/")) return "/fathir.jpeg";
  return src;
}
function dispatchSyncError(message) {
  try { window.dispatchEvent(new CustomEvent("undangan-sync-error", { detail: message })); } catch {}
}
function broadcastUpdate() {
  try {
    window.dispatchEvent(new CustomEvent("undangan-live-updated"));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage({ type: "updated", at: Date.now() });
      channel.close();
    }
  } catch {}
}
function queue(promise) {
  if (!promise || typeof promise.then !== "function") return promise;
  const tracked = promise.catch((err) => {
    console.error("Supabase write error:", err);
    dispatchSyncError(err?.message || String(err));
    return null;
  });
  pendingWrites.push(tracked);
  tracked.finally(() => { pendingWrites = pendingWrites.filter((p) => p !== tracked); });
  return tracked;
}
async function flushWrites() {
  if (!pendingWrites.length) return;
  await Promise.allSettled([...pendingWrites]);
}
async function run(label, promise) {
  if (!isSupabaseReady || !supabase) throw new Error("Supabase env belum diisi");
  const { data, error } = await promise;
  if (error) {
    console.error(label + " failed:", error);
    dispatchSyncError(label + ": " + (error.message || String(error)));
    throw error;
  }
  return data;
}

const toSnakeInvitation = (item) => ({
  id: item.id || makeId(),
  user_id: item.userId || null,
  owner_name: item.ownerName || null,
  owner_email: item.ownerEmail || null,
  slug: item.slug || `undangan-${Date.now()}`,
  package_name: item.packageName || "Premium",
  package_tier: (item.packageTier || item.packageName || "premium").toLowerCase().includes("basic") ? "basic" : "premium",
  template: item.template || "blue-islamic",
  status: item.status || "draft",
  payment_status: item.paymentStatus || "unpaid",
  suspended: Boolean(item.suspended),
  title: item.title || "Undangan Khitanan",
  child_name: item.childName || "NAMA ANAK",
  nickname: item.nickname || "",
  event_type: item.eventType || "Khitanan",
  event_day: item.eventDay || "",
  event_date: item.eventDate || null,
  event_date_text: item.eventDateText || "",
  event_time: item.eventTime || "",
  address_title: item.addressTitle || "",
  address_detail: item.addressDetail || "",
  maps_url: item.mapsUrl || "",
  whatsapp: item.whatsapp || "",
  music_title: item.musicTitle || "",
  music_url: item.musicUrl || "",
  bank_name: item.bankName || "",
  bank_account: item.bankAccount || "",
  bank_owner: item.bankOwner || "",
  custom_domain: item.customDomain || "",
  subdomain: item.subdomain || "",
  main_photo: cleanImageUrl(item.mainPhoto),
  published_at: item.publishedAt || null,
  created_at: item.createdAt || new Date().toISOString(),
});

const fromSnakeInvitation = (row) => ({
  id: row.id,
  userId: row.user_id || "",
  ownerName: row.owner_name || "",
  ownerEmail: row.owner_email || "",
  slug: row.slug,
  packageName: row.package_name || "Premium",
  packageTier: row.package_tier || ((row.package_name || "Premium").toLowerCase().includes("basic") ? "basic" : "premium"),
  template: row.template || "blue-islamic",
  status: row.status || "draft",
  paymentStatus: row.payment_status || "unpaid",
  suspended: Boolean(row.suspended),
  title: row.title || "Undangan Khitanan",
  childName: row.child_name || "",
  nickname: row.nickname || "",
  eventType: row.event_type || "Khitanan",
  eventDay: row.event_day || "",
  eventDate: row.event_date || "",
  eventDateText: row.event_date_text || "",
  eventTime: row.event_time || "",
  addressTitle: row.address_title || "",
  addressDetail: row.address_detail || "",
  mapsUrl: row.maps_url || "",
  whatsapp: row.whatsapp || "",
  musicTitle: row.music_title || "",
  musicUrl: row.music_url || "",
  bankName: row.bank_name || "",
  bankAccount: row.bank_account || "",
  bankOwner: row.bank_owner || "",
  customDomain: row.custom_domain || "",
  subdomain: row.subdomain || "",
  mainPhoto: cleanImageUrl(row.main_photo),
  gallery: [],
  guests: [],
  rsvps: [],
  wishes: [],
  checkins: [],
  createdAt: row.created_at || new Date().toISOString(),
  publishedAt: row.published_at || null,
});

const toSnakeSong = (s) => ({ id: s.id || makeId(), title: s.title || "Untitled", url: s.url || "", is_active: s.active !== false, created_at: s.createdAt || new Date().toISOString() });
const fromSnakeSong = (row) => ({ id: row.id, title: row.title || "Untitled", url: row.url || "", active: row.is_active !== false, createdAt: row.created_at });
const toSnakePackage = (p) => ({ id: p.id || makeId(), name: p.name || "Package", price: Number(p.price || 0), tier: p.tier || ((p.name || "").toLowerCase().includes("basic") ? "basic" : "premium"), is_active: p.active !== false, created_at: p.createdAt || new Date().toISOString() });
const fromSnakePackage = (row) => ({ id: row.id, name: row.name, price: Number(row.price || 0), tier: row.tier || ((row.name || "").toLowerCase().includes("basic") ? "basic" : "premium"), active: row.is_active !== false, createdAt: row.created_at });

async function hydrateInvitations(rows) {
  const items = rows.map(fromSnakeInvitation);
  const ids = items.map((i) => i.id).filter(Boolean);
  if (!ids.length) return items;
  const [galleries, guests, rsvps, wishes, checkins] = await Promise.all([
    run("load galleries", supabase.from("galleries").select("*").in("invitation_id", ids).order("sort_order", { ascending: true })),
    run("load guests", supabase.from("guests").select("*").in("invitation_id", ids).order("created_at", { ascending: true })),
    run("load rsvps", supabase.from("rsvps").select("*").in("invitation_id", ids).order("created_at", { ascending: false })),
    run("load wishes", supabase.from("wishes").select("*").in("invitation_id", ids).order("created_at", { ascending: false })),
    run("load checkins", supabase.from("checkins").select("*").in("invitation_id", ids).order("checked_at", { ascending: false })),
  ]);
  return items.map((item) => ({
    ...item,
    gallery: (galleries || []).filter((g) => g.invitation_id === item.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map((g) => cleanImageUrl(g.image_url)),
    guests: (guests || []).filter((g) => g.invitation_id === item.id).map((g) => g.guest_name),
    rsvps: (rsvps || []).filter((r) => r.invitation_id === item.id).map((r) => ({ id:r.id, name:r.guest_name, attendance:r.attendance, total:r.total_guest, createdAt:r.created_at })),
    wishes: (wishes || []).filter((w) => w.invitation_id === item.id).map((w) => ({ id:w.id, name:w.guest_name, message:w.message, createdAt:w.created_at })),
    checkins: (checkins || []).filter((c) => c.invitation_id === item.id).map((c) => ({ id:c.id, name:c.guest_name, createdAt:c.checked_at })),
  }));
}

async function syncInvitationRelations(invitation) {
  const cleanGallery = (invitation.gallery || []).map(cleanImageUrl).filter(Boolean);
  await run("delete galleries", supabase.from("galleries").delete().eq("invitation_id", invitation.id));
  if (cleanGallery.length) await run("insert galleries", supabase.from("galleries").insert(cleanGallery.map((imageUrl, index) => ({ invitation_id: invitation.id, image_url: imageUrl, sort_order: index }))));
  await run("delete guests", supabase.from("guests").delete().eq("invitation_id", invitation.id));
  if (invitation.guests?.length) await run("insert guests", supabase.from("guests").insert(invitation.guests.map((guestName) => ({ invitation_id: invitation.id, guest_name: guestName }))));
  await run("delete rsvps", supabase.from("rsvps").delete().eq("invitation_id", invitation.id));
  if (invitation.rsvps?.length) await run("insert rsvps", supabase.from("rsvps").insert(invitation.rsvps.map((r) => ({ invitation_id: invitation.id, guest_name: r.name, attendance: r.attendance, total_guest: r.total, created_at: r.createdAt || new Date().toISOString() }))));
  await run("delete wishes", supabase.from("wishes").delete().eq("invitation_id", invitation.id));
  if (invitation.wishes?.length) await run("insert wishes", supabase.from("wishes").insert(invitation.wishes.map((w) => ({ invitation_id: invitation.id, guest_name: w.name, message: w.message, created_at: w.createdAt || new Date().toISOString() }))));
  await run("delete checkins", supabase.from("checkins").delete().eq("invitation_id", invitation.id));
  if (invitation.checkins?.length) await run("insert checkins", supabase.from("checkins").insert(invitation.checkins.map((c) => ({ invitation_id: invitation.id, guest_name: c.name, checked_at: c.createdAt || new Date().toISOString() }))));
}

async function upsertInvitationRemote(invitation) {
  if (!isSupabaseReady || !invitation?.id || !invitation?.slug) return;
  const clean = { ...invitation, mainPhoto: cleanImageUrl(invitation.mainPhoto), gallery: (invitation.gallery || []).map(cleanImageUrl) };
  await run("upsert invitation", supabase.from("invitations").upsert(toSnakeInvitation(clean), { onConflict: "id" }));
  await syncInvitationRelations(clean);
}
async function loadInvitationsRemote() {
  if (!isSupabaseReady) return invitationsCache;
  const data = await run("load invitations", supabase.from("invitations").select("*").order("created_at", { ascending: false }));
  invitationsCache = data?.length ? await hydrateInvitations(data) : [];
  return invitationsCache;
}
async function loadSongsRemote() {
  if (!isSupabaseReady) return songsCache;
  const data = await run("load songs", supabase.from("songs").select("*").order("created_at", { ascending: false }));
  songsCache = data?.length ? data.map(fromSnakeSong) : [];
  return songsCache;
}
async function loadPackagesRemote() {
  if (!isSupabaseReady) return packagesCache;
  const data = await run("load packages", supabase.from("packages").select("*").order("price", { ascending: true }));
  packagesCache = data?.length ? data.map(fromSnakePackage) : [];
  return packagesCache;
}

export async function bootstrapSupabaseData({ force = false } = {}) {
  if (loadedRemote && !force) return;
  loadedRemote = true;
  try { await Promise.all([loadInvitationsRemote(), loadSongsRemote(), loadPackagesRemote()]); }
  catch (err) { console.error("bootstrap failed", err); }
}
export function refreshRemoteData(callback, options = {}) {
  flushWrites()
    .then(() => { loadedRemote = false; return bootstrapSupabaseData({ force: options.force !== false }); })
    .then(() => { if (typeof callback === "function") callback(); })
    .catch((err) => { console.error("refreshRemoteData failed:", err); dispatchSyncError(err?.message || String(err)); if (typeof callback === "function") callback(); });
}
export function subscribeLiveUpdates(callback) {
  const handler = async () => {
    loadedRemote = false;
    await bootstrapSupabaseData({ force: true });
    if (typeof callback === "function") callback();
  };
  window.addEventListener("undangan-live-updated", handler);
  let bc;
  if ("BroadcastChannel" in window) { bc = new BroadcastChannel(CHANNEL); bc.onmessage = handler; }
  let supaChannel;
  if (isSupabaseReady && supabase) {
    supaChannel = supabase
      .channel(`undangan-realtime-${makeId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invitations" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "galleries" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "guests" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "wishes" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "songs" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, handler)
      .subscribe();
  }
  return () => { window.removeEventListener("undangan-live-updated", handler); if (bc) bc.close(); if (supaChannel) supabase.removeChannel(supaChannel); };
}

export function getInvitations() { return invitationsCache; }
export function getSongs() { return songsCache; }
export function getPackages() { return packagesCache; }
export function getInvitationBySlug(slug) { return invitationsCache.find((item) => item.slug === slug) || null; }
export async function fetchInvitationBySlug(slug) {
  if (!isSupabaseReady) return null;
  try {
    const row = await run("fetch invitation", supabase.from("invitations").select("*").eq("slug", slug).maybeSingle());
    if (!row) return null;
    const [item] = await hydrateInvitations([row]);
    invitationsCache = [item, ...invitationsCache.filter((i) => i.id !== item.id)];
    return item;
  } catch { return null; }
}
export function updateInvitation(id, patch) {
  invitationsCache = invitationsCache.map((item) => item.id === id ? { ...item, ...patch } : item);
  const updated = invitationsCache.find((item) => item.id === id);
  broadcastUpdate();
  if (updated) queue(upsertInvitationRemote(updated));
  return updated;
}
export function addInvitation(data) {
  const item = { id: data.id || makeId(), ownerName:"", ownerEmail:"", packageName:"Premium", packageTier:"premium", template:"blue-islamic", status:"draft", paymentStatus:"unpaid", suspended:false, title:"Undangan Khitanan", childName:"", nickname:"", eventType:"Khitanan", eventDay:"", eventDate:"", eventDateText:"", eventTime:"", addressTitle:"", addressDetail:"", mapsUrl:"", whatsapp:"", musicTitle:"", musicUrl:"", bankName:"", bankAccount:"", bankOwner:"", customDomain:"", subdomain:"", mainPhoto:"/fathir.jpeg", gallery:[], guests:[], rsvps:[], wishes:[], checkins:[], createdAt:new Date().toISOString(), ...data };
  const exists = invitationsCache.some((x) => x.id === item.id);
  invitationsCache = exists ? invitationsCache.map((x) => x.id === item.id ? item : x) : [item, ...invitationsCache];
  broadcastUpdate();
  queue(upsertInvitationRemote(item));
  return item;
}
export function deleteInvitation(id) {
  invitationsCache = invitationsCache.filter((item) => item.id !== id);
  broadcastUpdate();
  if (isSupabaseReady) queue(run("delete invitation", supabase.from("invitations").delete().eq("id", id)));
  return invitationsCache;
}
export function addPackage(data) {
  const item = { id: data.id || makeId(), name: data.name || "Package", price: Number(data.price || 0), tier: data.tier || "premium", active: data.active !== false, createdAt:new Date().toISOString() };
  packagesCache = [item, ...packagesCache];
  broadcastUpdate();
  if (isSupabaseReady) queue(run("upsert package", supabase.from("packages").upsert(toSnakePackage(item), { onConflict: "id" })));
  return item;
}
export function updatePackage(id, patch) {
  packagesCache = packagesCache.map((p) => p.id === id ? { ...p, ...patch } : p);
  const item = packagesCache.find((p) => p.id === id);
  broadcastUpdate();
  if (item && isSupabaseReady) queue(run("upsert package", supabase.from("packages").upsert(toSnakePackage(item), { onConflict: "id" })));
  return item;
}
export function deletePackage(id) {
  packagesCache = packagesCache.filter((p) => p.id !== id);
  broadcastUpdate();
  if (isSupabaseReady) queue(run("delete package", supabase.from("packages").delete().eq("id", id)));
  return packagesCache;
}
function isValidMusicUrl(url = "") {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com/watch") || lower.includes("youtu.be/")) return false;
  return lower.includes(".mp3") || lower.includes(".wav") || lower.includes(".ogg") || lower.includes("supabase.co/storage");
}
export function validateMusicUrl(url = "") { return isValidMusicUrl(url); }
export function addSong(data) {
  if (!isValidMusicUrl(data.url || "")) { alert("URL musik harus file audio langsung .mp3/.wav/.ogg atau Supabase Storage."); return null; }
  const item = { id: data.id || makeId(), active: true, createdAt:new Date().toISOString(), ...data };
  songsCache = [item, ...songsCache];
  broadcastUpdate();
  if (isSupabaseReady) queue(run("upsert song", supabase.from("songs").upsert(toSnakeSong(item), { onConflict: "id" })));
  return item;
}
export function updateSong(id, patch) {
  if (patch.url !== undefined && !isValidMusicUrl(patch.url)) { alert("URL musik harus file audio langsung .mp3/.wav/.ogg atau Supabase Storage."); return songsCache.find((s) => s.id === id); }
  songsCache = songsCache.map((s) => s.id === id ? { ...s, ...patch } : s);
  const updated = songsCache.find((s) => s.id === id);
  broadcastUpdate();
  if (updated && isSupabaseReady) queue(run("upsert song", supabase.from("songs").upsert(toSnakeSong(updated), { onConflict: "id" })));
  return updated;
}
export function deleteSong(id) {
  songsCache = songsCache.filter((s) => s.id !== id);
  broadcastUpdate();
  if (isSupabaseReady) queue(run("delete song", supabase.from("songs").delete().eq("id", id)));
  return songsCache;
}
function requireSupabase() { if (!isSupabaseReady) { alert("Supabase belum connect. Isi ENV Vercel/lokal."); return false; } return true; }
export async function uploadGalleryFile(file) {
  if (!requireSupabase() || !file) return "";
  const ext = file.name.split(".").pop();
  const path = `gallery/${Date.now()}-${makeId()}.${ext}`;
  const { error } = await supabase.storage.from("invitation-gallery").upload(path, file, { upsert: true });
  if (error) { console.error(error); alert("Upload foto gagal. Jalankan SQL policy storage."); return ""; }
  const { data } = supabase.storage.from("invitation-gallery").getPublicUrl(path);
  return data.publicUrl;
}
export async function uploadSongFile(file) {
  if (!requireSupabase() || !file) return "";
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const ok = type.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg");
  if (!ok) { alert("File lagu harus MP3/WAV/OGG."); return ""; }
  const ext = file.name.split(".").pop();
  const path = `music/${Date.now()}-${makeId()}.${ext}`;
  const { error } = await supabase.storage.from("invitation-music").upload(path, file, { upsert: true, contentType: file.type || "audio/mpeg" });
  if (error) { console.error(error); alert("Upload lagu gagal. Jalankan SQL policy storage."); return ""; }
  const { data } = supabase.storage.from("invitation-music").getPublicUrl(path);
  return data.publicUrl;
}
export async function waitForSync() { await flushWrites(); loadedRemote = false; await bootstrapSupabaseData({ force: true }); }
export function getSupabaseStatus() { return { isSupabaseReady, totalInvitations: invitationsCache.length, totalSongs: songsCache.length, totalPackages: packagesCache.length }; }
