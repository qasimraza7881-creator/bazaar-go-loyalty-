"use client";
import {useEffect,useMemo,useRef,useState,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {QRCodeCanvas} from "qrcode.react";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {doc,getDoc,setDoc,updateDoc,onSnapshot,collection,query,where,orderBy,limit} from "firebase/firestore";
import {auth,db,firebaseConfigured} from "../../lib/firebase";
import {uploadToCloudinary,cloudinaryConfigured} from "../../lib/cloudinary";
import {packages,payment} from "../../lib/data";

const businessMenu=[["overview","Overview"],["customers","Customers"],["programs","Loyalty Programs"],["qr","QR Codes"],["branches","Branches"],["shopmap","Shop Map"],["menu","Digital Menu"],["scratch","Scratch Cards"],["analytics","Analytics"],["profile","Profile"],["subscriptions","Subscriptions"],["settings","Settings"]];
const adminMenuList=[["dashboard","Dashboard"],["businesses","Businesses"],["customers","Customers"],["subscriptions","Subscriptions"],["settings","Settings"]];

const mapUrl=(lat,lng)=>`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// Saves a canvas as a PNG in a way that actually works on mobile browsers.
// The old approach (a.download + a.click() on a detached <a>) is unreliable
// on iOS Safari and many Android browsers — it either silently does nothing
// or just opens the image instead of saving it, even though no JS error is
// thrown. Native share sheet ("Save Image" / "Save to Photos") is the
// reliable path on phones, with the classic download-link trick kept as the
// desktop-friendly fallback.
async function saveCanvasAsImage(canvas,filename,notify){
 canvas.toBlob(async(blob)=>{
  if(!blob){notify("Could not prepare the image. Please try again.");return;}
  const file=new File([blob],filename,{type:"image/png"});
  try{
   if(navigator.canShare && navigator.canShare({files:[file]})){
    await navigator.share({files:[file],title:filename});
    notify("Choose \"Save Image\" / \"Save to Photos\" to keep it.");
    return;
   }
  }catch(e){
   if(e && e.name==="AbortError") return; // user cancelled the share sheet
   // fall through to the link-download fallback below
  }
  try{
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.href=url; a.download=filename;
   document.body.appendChild(a); a.click(); document.body.removeChild(a);
   setTimeout(()=>URL.revokeObjectURL(url),4000);
   notify("Downloaded. On phones, check your Downloads/Files app if it's not in Photos.");
  }catch(e){
   notify("Could not download the image. Try long-pressing the QR below and choosing Save Image.");
  }
 },"image/png");
}

function DashboardInner(){
 const params=useSearchParams();
 const role=params.get("role")||"customer";

 if(role==="business") return <BusinessDashboard/>;
 if(role==="admin") return <AdminDashboard/>;
 return <CustomerRedirect/>;
}

function CustomerRedirect(){
 return <main className="shell"><div className="main" style={{maxWidth:700}}>
  <section className="card hero">
   <h2>Welcome to Bazaar Go 👋</h2>
   <p className="muted big">Customer login nahi hota. Loyalty card ke liye shop ka QR scan karein.</p>
   <div className="actions" style={{marginTop:15}}>
    <a className="primary bigbtn" href="/scan">📷 Scan Shop QR</a>
    <a className="btn bigbtn" href="/">Home</a>
   </div>
  </section>
 </div></main>;
}

function AdminDashboard(){
 const [page,setPage]=useState("dashboard");
 const [authChecked,setAuthChecked]=useState(false);
 const [authUser,setAuthUser]=useState(null);
 const [isAdmin,setIsAdmin]=useState(false);
 const [businesses,setBusinesses]=useState([]);
 const [customers,setCustomers]=useState([]);
 const [transactions,setTransactions]=useState([]);
 const [loading,setLoading]=useState(true);
 const [toast,setToast]=useState("");
 const [promoteEmail,setPromoteEmail]=useState("");
 const [promoteMsg,setPromoteMsg]=useState("");
 const [viewBiz,setViewBiz]=useState(null);
 const [editBiz,setEditBiz]=useState(null);

 function notify(x){setToast(x);setTimeout(()=>setToast(""),2500);}

 useEffect(()=>{
  if(!firebaseConfigured||!auth){setAuthChecked(true);return;}
  const unsub=onAuthStateChanged(auth,async(user)=>{
   setAuthUser(user);
   if(user&&db){
    const usnap=await getDoc(doc(db,"users",user.uid));
    setIsAdmin(usnap.exists()&&usnap.data().role==="admin");
   }else setIsAdmin(false);
   setAuthChecked(true);
  });
  return ()=>unsub();
 },[]);

 useEffect(()=>{
  if(!isAdmin||!db){setLoading(false);return;}
  setLoading(true);
  // Capped at 500 docs each — an unbounded onSnapshot on the whole
  // collection re-downloads and re-renders everything on every write and
  // gets noticeably slower as the business grows.
  const unsub1=onSnapshot(query(collection(db,"businesses"),limit(500)),(snap)=>setBusinesses(snap.docs.map(d=>({id:d.id,...d.data()}))));
  const unsub2=onSnapshot(query(collection(db,"customers"),limit(500)),(snap)=>setCustomers(snap.docs.map(d=>({id:d.id,...d.data()}))));
  const unsub3=onSnapshot(query(collection(db,"transactions"),orderBy("createdAt","desc"),limit(50)),(snap)=>setTransactions(snap.docs.map(d=>({id:d.id,...d.data()}))));
  setLoading(false);
  return ()=>{unsub1();unsub2();unsub3();};
 },[isAdmin]);

 const pendingSubs=useMemo(()=>businesses.filter(b=>b.subscriptionRequest&&b.subscriptionRequest.status==="pending"),[businesses]);

 async function toggleActive(biz){
  await updateDoc(doc(db,"businesses",biz.id),{active:!biz.active});
  notify(biz.active?"Business suspended.":"Business activated.");
 }

 async function setPaymentStatus(biz,status){
  await updateDoc(doc(db,"businesses",biz.id),{paymentStatus:status});
  notify(status==="paid"?"Marked as paid.":"Marked as payment pending.");
 }

 async function saveBusinessEdit(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const updates={};
  ["name","owner","phone","email","address","category","lat","lng","activePackage","googleReview"].forEach(k=>updates[k]=fd.get(k)||"");
  updates.requiredStamps=Number(fd.get("requiredStamps"))||9;
  await updateDoc(doc(db,"businesses",editBiz.id),updates);
  setEditBiz(null);
  notify("Business details updated.");
 }

 async function approveSub(biz){
  const req=biz.subscriptionRequest;
  const pkg=packages.find(p=>p.name===req.package);
  const days=pkg?pkg.days:30;
  await updateDoc(doc(db,"businesses",biz.id),{
   active:true,
   subscriptionRequest:{...req,status:"approved",approvedAt:Date.now()},
   subscriptionStart:Date.now(),
   subscriptionActiveUntil:Date.now()+days*24*60*60*1000,
   activePackage:req.package,
   paymentStatus:"paid"
  });
  notify("Subscription approved and business activated.");
 }
 async function rejectSub(biz){
  await updateDoc(doc(db,"businesses",biz.id),{subscriptionRequest:{...biz.subscriptionRequest,status:"rejected"}});
  notify("Subscription request rejected.");
 }

 async function promote(){
  setPromoteMsg("");
  if(!promoteEmail){setPromoteMsg("Enter an email first.");return;}
  try{
   const idToken=await authUser.getIdToken();
   const res=await fetch("/api/admin/promote",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${idToken}`},body:JSON.stringify({email:promoteEmail})});
   const json=await res.json();
   setPromoteMsg(json.ok?`${json.email} is now an admin.`:(json.error||"Could not promote that user."));
   if(json.ok) setPromoteEmail("");
  }catch(e){setPromoteMsg("Network error.");}
 }

 if(!firebaseConfigured){
  return <main className="shell"><div className="main"><section className="card"><h2>Firebase is not configured</h2><p className="muted">Add NEXT_PUBLIC_FIREBASE_* variables in Vercel, then redeploy.</p></section></div></main>;
 }
 if(!authChecked){
  return <main className="shell"><div className="main"><section className="card"><p className="muted">Checking your session…</p></section></div></main>;
 }
 if(!authUser){
  return <main className="shell"><div className="main"><section className="card"><h2>Please log in</h2><p className="muted">You need an admin account to view this panel.</p><a className="primary" href="/login?role=admin">Admin Login</a></section></div></main>;
 }
 if(!isAdmin){
  return <main className="shell"><div className="main"><section className="card"><h2>Not authorized</h2><p className="muted">Your account ({authUser.email}) does not have admin access. Ask an existing admin to promote you, or use the bootstrap endpoint described in the README.</p><a className="btn" href="/">Home</a></section></div></main>;
 }

 function content(){
  if(page==="dashboard")return <><div className="pagehead"><div><h2>Admin Dashboard</h2><p className="muted">Complete platform control.</p></div></div>
   <div className="stats">{[["Businesses",businesses.length],["Customers",customers.length],["Transactions",transactions.length],["Pending Subscriptions",pendingSubs.length]].map(x=><div className="stat" key={x[0]}><span className="muted">{x[0]}</span><b>{x[1]}</b></div>)}</div>
   <div className="grid"><section className="card"><h3>Payment Accounts</h3><p>{payment.jazzcash}</p><p>{payment.meezan}</p></section><section className="card"><h3>Activation</h3><p>Admin verifies payment and approves the subscription request.</p></section><section className="card"><h3>Customer Privacy</h3><p>Name + phone visible to authorized business/admin only.</p></section></div></>;

  if(page==="businesses")return <section className="card"><h2>Businesses</h2><p className="muted">Complete business details, status and payment control.</p>{loading?<p className="muted">Loading…</p>:
   businesses.length===0?<p className="muted">No businesses yet.</p>:
   <div className="table">
    <div className="row" style={{gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr auto'}}><b>Business</b><b>Owner / Phone</b><b>Category</b><b>Status</b><b>Payment</b><b>Actions</b></div>
    {businesses.map(b=><div className="row" style={{gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr auto'}} key={b.id}>
     <span><b>{b.name||b.id}</b><br/><span className="muted">{b.email||"—"}</span></span>
     <span>{b.owner||"—"}<br/><span className="muted">{b.phone||"—"}</span></span>
     <span>{b.category||"—"}</span>
     <span>{b.active===false?"🔴 Suspended":"🟢 Active"}</span>
     <span>{b.paymentStatus==="paid"?"💳 Paid":"💳 Pending"}</span>
     <span style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      <button className="btn" onClick={()=>setViewBiz(b)}>View</button>
      <button className="btn" onClick={()=>setEditBiz(b)}>Edit</button>
      <button className="btn" onClick={()=>toggleActive(b)}>{b.active===false?"Activate":"Suspend"}</button>
      <button className="btn" onClick={()=>setPaymentStatus(b,b.paymentStatus==="paid"?"pending":"paid")}>{b.paymentStatus==="paid"?"Mark Pending":"Mark Paid"}</button>
     </span>
    </div>)}
   </div>}</section>;

  if(page==="customers")return <section className="card"><h2>All Customers</h2><p className="muted">Admin ko customer ka name + phone + business show hota hai.</p>{loading?<p className="muted">Loading…</p>:
   <div className="table"><div className="row"><b>Name</b><b>Phone</b><b>Business</b><b>Stamps / Visits</b></div>
   {customers.map(c=><div className="row" key={c.id}><b>{c.name}</b><span>{c.phone}</span><span>{c.businessId}</span><span>{c.stamps}/— • {c.visits}</span></div>)}
   </div>}</section>;

  if(page==="subscriptions")return <section className="card"><h2>Subscriptions / Activation</h2>
   {pendingSubs.length===0?<p className="muted">No pending activation requests.</p>:pendingSubs.map(b=><div className="notice" key={b.id} style={{marginBottom:12}}>
    <b>{b.name}</b> — {b.subscriptionRequest.package} (PKR {Number(b.subscriptionRequest.amount).toLocaleString()})<br/>
    <span className="muted">Code entered: {b.subscriptionRequest.code}</span><br/>
    <div className="actions" style={{marginTop:10}}><button className="primary" onClick={()=>approveSub(b)}>Approve</button><button className="btn" onClick={()=>rejectSub(b)}>Reject</button></div>
   </div>)}
   <div className="notice" style={{marginTop:15}}><b>Payment:</b> {payment.jazzcash}<br/>{payment.meezan}</div>
  </section>;

  if(page==="reports")return <section className="card"><h2>Reports</h2><p className="muted">Platform report preview.</p><div className="stats">{[["Businesses",businesses.length],["Customers",customers.length],["Transactions",transactions.length]].map(x=><div className="stat" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div><button className="primary" style={{marginTop:15}} onClick={()=>window.print()}>Print Report</button></section>;

  return <section className="card"><h2>Admin Settings</h2>
   <div style={{marginBottom:20}}><h3>Promote an admin</h3><p className="muted">User must have logged in at least once before you can promote them.</p><input className="field" value={promoteEmail} onChange={e=>setPromoteEmail(e.target.value)} placeholder="user@example.com"/><button className="primary" onClick={promote}>Make Admin</button>{promoteMsg&&<p className="notice" style={{marginTop:10}}>{promoteMsg}</p>}</div>
   <div className="settings"><button className="btn" onClick={async()=>{await signOut(auth);window.location.href="/";}}>Sign Out</button></div>
  </section>;
 }

 return <main className="shell"><header className="top"><div className="topin"><div className="brand"><b>✦ BAZAAR GO</b><strong>LOYALTY</strong><span>Scan. Collect. Reward.</span></div><div className="top-actions"><span className="role-label">Admin</span><a className="btn" href="/">Home</a></div></div><div className="nav">{adminMenuList.map(([id,label])=><button key={id} className={page===id?"on":""} onClick={()=>setPage(id)}>{label}</button>)}</div></header>
 <div className="main">{content()}</div>

 {viewBiz&&<div className="modal"><div className="modalbox">
  <div className="pagehead"><h2>Business Details</h2><button className="btn" onClick={()=>setViewBiz(null)}>✕</button></div>
  <div className="avatar" style={{marginBottom:15}}>{viewBiz.logo?<img src={viewBiz.logo}/>:"🏪"}</div>
  <p><b>🏪 Business Name:</b> {viewBiz.name||"—"}</p>
  <p><b>👤 Owner Name:</b> {viewBiz.owner||"—"}</p>
  <p><b>📞 Phone:</b> {viewBiz.phone||"—"}</p>
  <p><b>📧 Email:</b> {viewBiz.email||"—"}</p>
  <p><b>📍 Address:</b> {viewBiz.address||"—"}</p>
  <p><b>🏷️ Category:</b> {viewBiz.category||"—"}</p>
  <p><b>🗺️ Map Location:</b> {viewBiz.lat&&viewBiz.lng?<a className="btn" target="_blank" rel="noopener noreferrer" href={mapUrl(viewBiz.lat,viewBiz.lng)}>Open in Maps</a>:"—"}</p>
  <p><b>⭐ Google Review Link:</b> {viewBiz.googleReview?<a className="btn" target="_blank" rel="noopener noreferrer" href={viewBiz.googleReview}>Open Review Link</a>:"—"}</p>
  <p><b>🏬 Branches:</b> {(viewBiz.branches||[]).length===0?"None":(viewBiz.branches||[]).map(br=>br.name).join(", ")}</p>
  <p><b>📅 Registration Date:</b> {viewBiz.createdAt?new Date(viewBiz.createdAt).toLocaleDateString():"—"}</p>
  <p><b>📦 Active Package:</b> {viewBiz.activePackage||viewBiz.subscriptionRequest?.package||"—"}</p>
  <p><b>Business Status:</b> {viewBiz.active===false?"🔴 Suspended":"🟢 Active"}</p>
  <p><b>💳 Payment Status:</b> {viewBiz.paymentStatus==="paid"?"Paid":"Pending"}</p>
  <p><b>Subscription Start:</b> {viewBiz.subscriptionStart?new Date(viewBiz.subscriptionStart).toLocaleDateString():"—"}</p>
  <p><b>Subscription Expiry:</b> {viewBiz.subscriptionActiveUntil?new Date(viewBiz.subscriptionActiveUntil).toLocaleDateString():"—"}</p>
  <div className="actions" style={{marginTop:15}}><button className="primary" onClick={()=>{setEditBiz(viewBiz);setViewBiz(null);}}>Edit This Business</button></div>
 </div></div>}

 {editBiz&&<div className="modal"><div className="modalbox">
  <div className="pagehead"><h2>Edit Business</h2><button className="btn" onClick={()=>setEditBiz(null)}>✕</button></div>
  <form onSubmit={saveBusinessEdit}>
   <label>🏪 Business Name<input className="field" name="name" defaultValue={editBiz.name}/></label>
   <label>👤 Owner Name<input className="field" name="owner" defaultValue={editBiz.owner}/></label>
   <label>📞 Phone<input className="field" name="phone" defaultValue={editBiz.phone}/></label>
   <label>📧 Email<input className="field" name="email" type="email" defaultValue={editBiz.email}/></label>
   <label>📍 Complete Address<input className="field" name="address" defaultValue={editBiz.address}/></label>
   <label>🏷️ Category<input className="field" name="category" defaultValue={editBiz.category}/></label>
   <label>Latitude<input className="field" name="lat" defaultValue={editBiz.lat}/></label>
   <label>Longitude<input className="field" name="lng" defaultValue={editBiz.lng}/></label>
   <label>📦 Active Package<input className="field" name="activePackage" defaultValue={editBiz.activePackage||""} placeholder="e.g. 6 Months"/></label>
   <label>Required Stamps<input className="field" name="requiredStamps" type="number" min="1" defaultValue={editBiz.requiredStamps||9}/></label>
   <label>Google Review Link<input className="field" name="googleReview" defaultValue={editBiz.googleReview||""} placeholder="https://g.page/r/yourshop/review"/></label>
   <button className="primary">Save Changes</button>
  </form>
 </div></div>}

 {toast&&<div className="toast">✓ {toast}</div>}
 </main>;
}

const emptyProfile={
 name:"",owner:"",phone:"",address:"",category:"",email:"",lat:"24.8607",lng:"67.0011",
 logo:"",active:true,requiredStamps:9,programName:"Loyalty Program",programReward:"Free Item",
 facebook:"",instagram:"",googleReview:"",
 branches:[],menuItems:[],paymentStatus:"pending",activePackage:"",subscriptionStart:null,subscriptionActiveUntil:null
};

// ---- Shop QR "poster" card generator ----
function roundRect(ctx,x,y,w,h,r){
 ctx.beginPath();
 ctx.moveTo(x+r,y);
 ctx.arcTo(x+w,y,x+w,y+h,r);
 ctx.arcTo(x+w,y+h,x,y+h,r);
 ctx.arcTo(x,y+h,x,y,r);
 ctx.arcTo(x,y,x+w,y,r);
 ctx.closePath();
}
function loadImage(src){
 return new Promise((resolve,reject)=>{
  const img=new Image(); img.crossOrigin="anonymous";
  img.onload=()=>resolve(img); img.onerror=reject; img.src=src;
 });
}
// Draws centered, word-wrapped text and returns the y position after the last line.
function wrapCenterText(ctx,text,cx,y,maxWidth,lineHeight){
 const words=String(text||"").split(/\s+/).filter(Boolean);
 let line="",lines=[];
 for(const w of words){
  const test=line?`${line} ${w}`:w;
  if(ctx.measureText(test).width>maxWidth && line){lines.push(line);line=w;}
  else line=test;
 }
 if(line)lines.push(line);
 lines.forEach((l,i)=>ctx.fillText(l,cx,y+i*lineHeight));
 return y+lines.length*lineHeight;
}

function BusinessDashboard(){
 const [page,setPage]=useState("overview");
 const [authChecked,setAuthChecked]=useState(false);
 const [authUser,setAuthUser]=useState(null);
 const [authError,setAuthError]=useState("");
 const [businessId,setBusinessId]=useState("");
 const [profile,setProfile]=useState(emptyProfile);
 const [customers,setCustomers]=useState([]);
 const [customersLoading,setCustomersLoading]=useState(true);
 const [modal,setModal]=useState(false);
 const [selected,setSelected]=useState(packages[0]);
 const [code,setCode]=useState("");
 const [toast,setToast]=useState("");
 const [qrValue,setQrValue]=useState("");
 const [qrLoading,setQrLoading]=useState(false);
 const [qrError,setQrError]=useState("");
 const [redeeming,setRedeeming]=useState(null);
 const [logoUploading,setLogoUploading]=useState(false);
 const fileRef=useRef();

 function notify(x){setToast(x);setTimeout(()=>setToast(""),2500);}

 // Auth + bootstrap: create the users/{uid} + businesses/{businessId} docs
 // the first time a business account signs in.
 useEffect(()=>{
  if(!firebaseConfigured||!auth){setAuthChecked(true);return;}
  const unsub=onAuthStateChanged(auth,async(user)=>{
   setAuthUser(user);
   setAuthChecked(true);
   if(!user||!db) return;
   try{
    const uref=doc(db,"users",user.uid);
    const usnap=await getDoc(uref);
    let bId=usnap.exists()?usnap.data().businessId:null;
    if(!bId){
     bId=`biz_${user.uid.slice(0,10)}`;
     await setDoc(uref,{role:"business",businessId:bId,email:user.email||"",createdAt:Date.now()},{merge:true});
    }
    const bref=doc(db,"businesses",bId);
    const bsnap=await getDoc(bref);
    if(!bsnap.exists()){
     await setDoc(bref,{
      ...emptyProfile,name:user.email?`${user.email.split("@")[0]}'s Shop`:"My Shop",owner:user.displayName||"",
      email:user.email||"",branches:[{id:"main",name:"Main Branch",address:"",lat:"24.8607",lng:"67.0011"}],
      ownerUid:user.uid,createdAt:Date.now()
     });
    }
    setBusinessId(bId);
   }catch(e){setAuthError("Could not set up your business account. Please try logging in again.");}
  });
  return ()=>unsub();
 },[]);

 // Live business profile
 useEffect(()=>{
  if(!businessId||!db) return;
  const unsub=onSnapshot(doc(db,"businesses",businessId),(snap)=>{
   if(snap.exists()) setProfile({id:businessId,...emptyProfile,...snap.data()});
  });
  return ()=>unsub();
 },[businessId]);

 // Live customers list for this business
 useEffect(()=>{
  if(!businessId||!db){setCustomersLoading(false);return;}
  setCustomersLoading(true);
  const q=query(collection(db,"customers"),where("businessId","==",businessId),orderBy("lastVisit","desc"));
  const unsub=onSnapshot(q,(snap)=>{
   setCustomers(snap.docs.map(d=>({id:d.id,...d.data()})));
   setCustomersLoading(false);
  },()=>setCustomersLoading(false));
  return ()=>unsub();
 },[businessId]);

 async function loadQr(branchId="MAIN",attempt=0){
  if(!authUser){return;}
  setQrLoading(true);if(attempt===0)setQrError("");
  try{
   const idToken=await authUser.getIdToken();
   // Send businessId along so the server can verify ownership directly
   // against the businesses/{id} doc, instead of only trusting the
   // users/{uid} lookup — that doc can briefly lag right after a fresh
   // login creates it, which used to cause a false "no business account
   // found" error on the very first QR load.
   const res=await fetch("/api/business/qr",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${idToken}`},body:JSON.stringify({branchId,businessId})});
   const json=await res.json();
   if(!json.ok){
    // "No business account found" right after a fresh signup usually just
    // means the users/{uid} + businesses/{id} docs we wrote a moment ago
    // haven't finished propagating yet. Retry a couple of times with a
    // short delay before surfacing an error to the user, instead of
    // failing permanently on the very first QR load.
    if(json.error==="No business account found for this login" && attempt<3){
     setTimeout(()=>loadQr(branchId,attempt+1),900*(attempt+1));
     return;
    }
    setQrError(json.error||"Could not generate QR.");
   }else{
    // Encode a real https:// link instead of a bare "BAZAARGO:token" string.
    // A normal phone camera app can't do anything useful with plain text —
    // it just offers a Google search. A real URL opens directly in the
    // browser on /scan, which reads the token and jumps straight to the
    // name/phone step without needing this app's own in-page scanner.
    setQrValue(`${window.location.origin}/scan?t=${encodeURIComponent(json.token)}`);
   }
  }catch(e){setQrError("Network error while generating QR.");}
  setQrLoading(false);
 }

 useEffect(()=>{ if(page==="qr" && businessId && !qrValue) loadQr("MAIN"); },[page,businessId]); // eslint-disable-line

 const totalVisits=useMemo(()=>customers.reduce((a,c)=>a+(c.visits||0),0),[customers]);
 const totalStamps=useMemo(()=>customers.reduce((a,c)=>a+(c.stamps||0),0),[customers]);
 const rewardsRedeemed=useMemo(()=>customers.reduce((a,c)=>a+(c.rewardsEarned||0),0),[customers]);

 const whatsapp=`https://wa.me/${payment.whatsapp}?text=${encodeURIComponent(`Bazaar Go Subscription Payment\nPackage: ${selected.name}\nAmount: PKR ${selected.amount.toLocaleString()}\nBusiness: ${profile.name}\nOwner: ${profile.owner}\nPhone: ${profile.phone}\nPlease verify payment and send activation code.`)}`;

 async function saveProfile(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const updates={};
  ["name","owner","phone","address","category","email","facebook","instagram","googleReview"].forEach(k=>updates[k]=fd.get(k)||"");
  await updateDoc(doc(db,"businesses",businessId),updates);
  notify("Business profile saved.");
 }

 async function uploadLogo(e){
  const f=e.target.files?.[0]; if(!f)return;
  if(!cloudinaryConfigured){notify("Image upload is not configured. Set Cloudinary env vars.");return;}
  if(f.size>5*1024*1024){notify("Please choose an image under 5MB.");return;}
  setLogoUploading(true);
  try{
   const url=await uploadToCloudinary(f,`business-logos/${businessId}`);
   await updateDoc(doc(db,"businesses",businessId),{logo:url});
   notify("Profile picture updated.");
  }catch(err){
   notify(err?.message||"Could not upload image. Please try again.");
  }
  setLogoUploading(false);
 }

 function downloadQR(){
  if(qrLoading){notify("QR is still generating — please wait a moment and try again.");return;}
  if(!qrValue){notify(qrError||"QR is not ready yet. Tap Regenerate, or check that QR_SIGNING_SECRET and Firebase Admin env vars are set on the server.");return;}
  const c=document.querySelector(".qr canvas");
  if(!c){notify("QR is not ready yet. Please wait a moment and try again.");return;}
  saveCanvasAsImage(c,`${profile.name||"shop"}-qr.png`,notify);
 }

 // Builds a branded, print-ready shop card: logo, name, address, the loyalty
 // QR, and (if provided) small Facebook/Instagram QR codes — one PNG.
 async function downloadShopCard(){
  if(qrLoading){notify("QR is still generating — please wait a moment and try again.");return;}
  if(!qrValue){notify(qrError||"QR is not ready yet. Tap Regenerate, or check that QR_SIGNING_SECRET and Firebase Admin env vars are set on the server.");return;}
  const mainC=document.querySelector(".qr-main-hi canvas")||document.querySelector(".qr canvas");
  if(!mainC){notify("QR is not ready yet.");return;}
  const fbC=document.querySelector(".qr-fb canvas");
  const igC=document.querySelector(".qr-ig canvas");

  const W=1080,H=1600;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx=cv.getContext("2d");

  // Background card
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#ffffff"); bg.addColorStop(1,"#fdf1f1");
  ctx.fillStyle=bg; roundRect(ctx,0,0,W,H,54); ctx.fill();
  ctx.lineWidth=5; ctx.strokeStyle="#a5152f"; roundRect(ctx,12,12,W-24,H-24,46); ctx.stroke();

  ctx.textAlign="center";
  ctx.fillStyle="#a5152f"; ctx.font="600 28px Arial";
  ctx.fillText("✦ BAZAAR GO LOYALTY", W/2, 100);

  // Logo / avatar
  const cy=232;
  try{
   if(profile.logo){
    const img=await loadImage(profile.logo);
    ctx.save(); ctx.beginPath(); ctx.arc(W/2,cy,92,0,Math.PI*2); ctx.closePath(); ctx.clip();
    ctx.drawImage(img,W/2-92,cy-92,184,184); ctx.restore();
   } else throw new Error("no-logo");
  }catch(e){
   ctx.fillStyle="#fdeceb"; ctx.beginPath(); ctx.arc(W/2,cy,92,0,Math.PI*2); ctx.fill();
   ctx.fillStyle="#a5152f"; ctx.font="86px Arial"; ctx.fillText("🏪",W/2,cy+30);
  }
  ctx.lineWidth=5; ctx.strokeStyle="#a5152f"; ctx.beginPath(); ctx.arc(W/2,cy,92,0,Math.PI*2); ctx.stroke();

  // Shop name
  let y=cy+165;
  ctx.fillStyle="#1c1414"; ctx.font="800 58px Arial";
  y=wrapCenterText(ctx,profile.name||"My Shop",W/2,y,W-160,64);

  // Category / tagline
  if(profile.category){ y+=10; ctx.fillStyle="#a5152f"; ctx.font="500 30px Arial"; ctx.fillText(profile.category,W/2,y); y+=44; }
  else y+=16;

  // Address & phone
  ctx.fillStyle="#8a7877"; ctx.font="400 28px Arial";
  if(profile.address){ y=wrapCenterText(ctx,`📍 ${profile.address}`,W/2,y,W-200,38); y+=6; }
  if(profile.phone){ ctx.fillText(`📞 ${profile.phone}`,W/2,y); y+=44; } else y+=10;

  // Main QR panel
  const panelSize=620, panelX=(W-panelSize)/2; y+=20;
  ctx.fillStyle="#ffffff"; roundRect(ctx,panelX,y,panelSize,panelSize,28); ctx.fill();
  const pad=42;
  // Draw the QR without smoothing — it's already rendered at full size
  // now (720px source, no upscale needed), and disabling smoothing here
  // avoids the browser softening the crisp black/white modules that
  // scanners rely on. Re-enabled right after for the social icons/photos.
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(mainC,panelX+pad,y+pad,panelSize-pad*2,panelSize-pad*2);
  ctx.imageSmoothingEnabled=true;
  y+=panelSize+52;

  ctx.fillStyle="#a5152f"; ctx.font="700 32px Arial";
  ctx.fillText("Scan • Collect • Reward",W/2,y);
  y+=40;
  ctx.fillStyle="#8a7877"; ctx.font="400 26px Arial";
  ctx.fillText(`Collect ${profile.requiredStamps||9} stamps → ${profile.programReward||"a free reward"}`,W/2,y);
  y+=50;

  // Social QR mini-panels
  const socials=[];
  if(fbC&&profile.facebook) socials.push({canvas:fbC,label:"📘 Facebook"});
  if(igC&&profile.instagram) socials.push({canvas:igC,label:"📸 Instagram"});
  if(socials.length){
   const mini=260, gap=40, totalW=socials.length*mini+(socials.length-1)*gap;
   let sx=(W-totalW)/2;
   socials.forEach(s=>{
    ctx.fillStyle="#ffffff"; roundRect(ctx,sx,y,mini,mini,20); ctx.fill();
    const mp=18;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(s.canvas,sx+mp,y+mp,mini-mp*2,mini-mp*2-30);
    ctx.imageSmoothingEnabled=true;
    ctx.fillStyle="#1c1414"; ctx.font="700 22px Arial";
    ctx.fillText(s.label,sx+mini/2,y+mini-14);
    sx+=mini+gap;
   });
   y+=mini+50;
  }

  // Footer
  ctx.strokeStyle="#f0e2e2"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(90,H-90); ctx.lineTo(W-90,H-90); ctx.stroke();
  ctx.fillStyle="#8a7877"; ctx.font="400 24px Arial";
  ctx.fillText("Powered by Bazaar Go Loyalty",W/2,H-50);

  try{
   await saveCanvasAsImage(cv,`${profile.name||"shop"}-qr-card.png`,notify);
  }catch(err){
   notify("Could not download the shop card image — this can happen if the logo image blocks cross-origin downloads. Try removing/re-uploading the logo, or download the QR only.");
  }
 }

 async function saveProgram(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  await updateDoc(doc(db,"businesses",businessId),{
   programName:fd.get("programName"),
   requiredStamps:Number(fd.get("requiredStamps"))||9,
   programReward:fd.get("programReward")
  });
  notify("Loyalty program saved.");
 }

 async function addBranch(){
  const branches=[...(profile.branches||[]),{id:Date.now().toString(),name:`Branch ${(profile.branches||[]).length+1}`,address:"New branch address",lat:profile.lat,lng:profile.lng}];
  await updateDoc(doc(db,"businesses",businessId),{branches});
  notify("New branch added.");
 }

 async function saveShopMap(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  await updateDoc(doc(db,"businesses",businessId),{lat:fd.get("lat"),lng:fd.get("lng")});
  notify("Shop map location saved.");
 }

 async function addMenu(){
  const menuItems=[...(profile.menuItems||[]),{name:"New Item",price:500,available:true}];
  await updateDoc(doc(db,"businesses",businessId),{menuItems});
  notify("Menu item added.");
 }
 async function removeMenu(i){
  const menuItems=(profile.menuItems||[]).filter((_,x)=>x!==i);
  await updateDoc(doc(db,"businesses",businessId),{menuItems});
 }

 async function addScratchCard(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const title=String(fd.get("title")||"").trim();
  const reward=String(fd.get("reward")||"").trim();
  const winChance=Math.min(100,Math.max(1,Number(fd.get("winChance"))||30));
  if(!title||!reward){notify("Title and reward text are required.");return;}
  const scratchCards=[...(profile.scratchCards||[]),{
   id:Date.now().toString(),title,reward,winChance,active:true,createdAt:Date.now()
  }];
  await updateDoc(doc(db,"businesses",businessId),{scratchCards});
  e.currentTarget.reset();
  notify("Scratch card campaign created.");
 }
 async function toggleScratchCard(id){
  const scratchCards=(profile.scratchCards||[]).map(c=>c.id===id?{...c,active:!c.active}:c);
  await updateDoc(doc(db,"businesses",businessId),{scratchCards});
 }
 async function removeScratchCard(id){
  const scratchCards=(profile.scratchCards||[]).filter(c=>c.id!==id);
  await updateDoc(doc(db,"businesses",businessId),{scratchCards});
  notify("Scratch card removed.");
 }

 async function redeemReward(customerId){
  if(!authUser){notify("Please sign in again.");return;}
  setRedeeming(customerId);
  try{
   const idToken=await authUser.getIdToken();
   const res=await fetch("/api/redeem",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${idToken}`},body:JSON.stringify({customerId})});
   const json=await res.json();
   if(!json.ok){notify(json.error||"Could not redeem reward.");}
   else notify("Reward redeemed! Stamps reset for this customer.");
  }catch(e){notify("Network error while redeeming reward.");}
  setRedeeming(null);
 }

 async function addCustomer(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const name=String(fd.get("name")||"").trim();
  const phone=String(fd.get("phone")||"").replace(/\D/g,"");
  const email=fd.get("email")||"";
  if(!name||phone.length<10){notify("Valid name and phone required.");return;}
  const customerId=`${businessId}_${phone}`;
  await setDoc(doc(db,"customers",customerId),{
   businessId,name,phone,email,stamps:0,visits:0,rewardsEarned:0,createdAt:Date.now(),lastVisit:Date.now()
  },{merge:true});
  setModal(false);
  notify("Customer added and loyalty card created.");
 }

 async function submitActivation(){
  if(!code){notify("Activation code enter karein.");return;}
  await updateDoc(doc(db,"businesses",businessId),{
   subscriptionRequest:{package:selected.name,amount:selected.amount,code,submittedAt:Date.now(),status:"pending"}
  });
  notify("Activation submitted for admin verification.");
  setCode("");
 }

 if(!firebaseConfigured){
  return <main className="shell"><div className="main"><section className="card"><h2>Firebase is not configured</h2><p className="muted">Add NEXT_PUBLIC_FIREBASE_* variables in Vercel, then redeploy.</p></section></div></main>;
 }
 if(!authChecked){
  return <main className="shell"><div className="main"><section className="card"><p className="muted">Checking your session…</p></section></div></main>;
 }
 if(!authUser){
  return <main className="shell"><div className="main"><section className="card"><h2>Please log in</h2><p className="muted">You need a business account to view this dashboard.</p><a className="primary" href="/login?role=business">Business Owner Login</a></section></div></main>;
 }
 if(authError){
  return <main className="shell"><div className="main"><section className="card"><p className="notice">{authError}</p></section></div></main>;
 }
 if(!businessId){
  return <main className="shell"><div className="main"><section className="card"><p className="muted">Setting up your business account…</p></section></div></main>;
 }

 function content(){
  if(page==="overview")return <><div className="pagehead"><div><h2>Business Overview</h2><p className="muted">Your shop, customers and loyalty performance.</p></div><button className="primary" onClick={()=>setPage("qr")}>📷 Shop QR</button></div>
   <div className="stats">{[["Customers",customers.length],["Visits",totalVisits],["Stamps",totalStamps],["Rewards Redeemed",rewardsRedeemed]].map(x=><div className="stat" key={x[0]}><span className="muted">{x[0]}</span><b>{x[1]}</b></div>)}</div>
   <div className="grid"><section className="card"><h3>Shop</h3><p>{profile.name||"—"}</p><p className="muted">{profile.category||"—"} • {profile.address||"—"}</p></section><section className="card"><h3>Active Program</h3><p>{profile.programName}</p><p className="muted">{profile.requiredStamps} stamps → {profile.programReward}</p></section><section className="card"><h3>Subscription</h3><p>{profile.subscriptionRequest?`${profile.subscriptionRequest.status} — ${profile.subscriptionRequest.package}`:"No active plan"}</p><button className="btn" onClick={()=>setPage("subscriptions")}>Manage</button></section></div></>;

  if(page==="customers")return <section className="card"><div className="pagehead"><div><h2>Customers</h2><p className="muted">Real customers from your Firestore database.</p></div><button className="primary" onClick={()=>setModal(true)}>+ New Customer</button></div>
   {customersLoading?<p className="muted">Loading…</p>:customers.length===0?<p className="muted">No customers yet. Share your shop QR to get your first scan.</p>:
   <div className="table"><div className="row"><b>Name</b><b>Phone</b><b>Gmail</b><b>Stamps / Visits</b><b>Reward</b></div>{customers.map(c=>{
     const ready=(c.stamps||0)>=(profile.requiredStamps||9);
     return <div className="row" key={c.id}>
       <b>{c.name}</b><span>{c.phone}</span><span>{c.email||"—"}</span><span>{c.stamps}/{profile.requiredStamps} • {c.visits}</span>
       <span>{ready?<button className="btn" disabled={redeeming===c.id} onClick={()=>redeemReward(c.id)}>{redeeming===c.id?"Redeeming…":"🎁 Redeem"}</button>:"—"}</span>
     </div>;
   })}</div>}
  </section>;

  if(page==="programs")return <section className="card"><div className="pagehead"><div><h2>Loyalty Programs</h2><p className="muted">Stamp rules and rewards.</p></div></div>
   <form onSubmit={saveProgram}>
    <label>Program Name<input className="field" name="programName" defaultValue={profile.programName}/></label>
    <label>Required Stamps<input className="field" name="requiredStamps" type="number" min="1" defaultValue={profile.requiredStamps}/></label>
    <label>Reward<input className="field" name="programReward" defaultValue={profile.programReward}/></label>
    <button className="primary">Save Program</button>
   </form>
  </section>;

  if(page==="qr")return <div className="grid2"><section className="card"><h2>Shop QR Code</h2><p className="muted">Customer isi QR ko scan karega. Ye signed hai aur backend verify karta hai.</p>
    <div className="actions">
     <button className="primary" onClick={downloadShopCard}>🖼️ Download Shop Card</button>
     <button className="btn" onClick={downloadQR}>Download QR Only</button>
     <button className="btn" onClick={()=>window.print()}>Print</button>
     <button className="btn" onClick={()=>{setQrValue("");loadQr("MAIN");}}>Regenerate</button>
    </div>
    {qrError&&<p className="notice" style={{marginTop:12}}>{qrError}</p>}
    <div className="notice" style={{marginTop:15}}><b>Business:</b> {businessId} / MAIN</div>
    <p className="muted" style={{marginTop:12,fontSize:14}}>"Download Shop Card" adds your shop name, logo, address aur (agar diye ho) Facebook/Instagram QR ek hi poster me — Profile page se add karein.</p>
   </section>
   <section className="card qr-card">{qrLoading?<p className="muted">Generating…</p>:qrValue?<div className="qr"><QRCodeCanvas value={qrValue} size={360} level="M" includeMargin/></div>:<p className="muted">—</p>}
    {/* Hidden high-res QR codes used only when composing the downloadable shop card */}
    <div style={{position:"absolute",left:-9999,top:-9999}}>
     {/* Sharp full-resolution copy of the main QR used only for the
         downloadable shop card. Drawing the small on-screen 360px QR
         scaled up to the poster's 536px panel blurred it under browser
         image smoothing and made it unscannable — this renders it at
         the exact target size instead, so no upscaling ever happens. */}
     {qrValue&&<div className="qr-main-hi"><QRCodeCanvas value={qrValue} size={720} level="M" includeMargin/></div>}
     {profile.facebook&&<div className="qr-fb"><QRCodeCanvas value={profile.facebook} size={300} level="M" includeMargin/></div>}
     {profile.instagram&&<div className="qr-ig"><QRCodeCanvas value={profile.instagram} size={300} level="M" includeMargin/></div>}
    </div>
   </section>
  </div>;

  if(page==="branches")return <section className="card"><div className="pagehead"><div><h2>Branches</h2><p className="muted">Branch address and location.</p></div><button className="primary" onClick={addBranch}>+ Add Branch</button></div>
   {(profile.branches||[]).map(b=><div className="notice branch" key={b.id}><b>{b.name}</b><span>{b.address}</span><a target="_blank" href={mapUrl(b.lat,b.lng)}>Open Map</a></div>)}
  </section>;

  if(page==="shopmap")return <section className="card"><h2>Shop Map / Location</h2><p className="muted">Customer Nearby / Map mein yahi location use hogi.</p>
   <div className="map"><span className="pin" style={{left:"50%",top:"50%"}}>📍</span></div>
   <form onSubmit={saveShopMap}><div className="grid2" style={{marginTop:15}}><label>Latitude<input className="field" name="lat" defaultValue={profile.lat}/></label><label>Longitude<input className="field" name="lng" defaultValue={profile.lng}/></label></div>
   <button className="primary">Save Location</button> <a className="btn" target="_blank" href={mapUrl(profile.lat,profile.lng)}>Open Google Maps</a></form>
  </section>;

  if(page==="menu")return <section className="card"><div className="pagehead"><div><h2>Digital Menu</h2><p className="muted">Customer-facing digital menu items.</p></div><button className="primary" onClick={addMenu}>+ Add Item</button></div>
   {(profile.menuItems||[]).map((m,i)=><div className="row" key={i}><b>{m.name}</b><span>PKR {m.price}</span><span>{m.available?"Available":"Hidden"}</span><button className="btn" onClick={()=>removeMenu(i)}>Delete</button></div>)}
  </section>;

  if(page==="scratch")return <section className="card"><div className="pagehead"><div><h2>Scratch Cards</h2><p className="muted">Customers scratch these from their loyalty card. Win chance is checked server-side so it can't be tampered with.</p></div></div>
   <form onSubmit={addScratchCard} style={{display:'grid',gap:10,marginBottom:20}}>
    <label>Title<input className="field" name="title" required placeholder="e.g. Anniversary Scratch Card"/></label>
    <label>Reward text (shown on win)<input className="field" name="reward" required placeholder="e.g. Free Coffee"/></label>
    <label>Win chance %<input className="field" name="winChance" type="number" min="1" max="100" defaultValue={30}/></label>
    <button className="primary">+ Create Scratch Card</button>
   </form>
   {(profile.scratchCards||[]).length===0?<p className="muted">No scratch cards yet.</p>:
   <div className="table"><div className="row"><b>Title</b><b>Reward</b><b>Win %</b><b>Status</b><b>Actions</b></div>
   {(profile.scratchCards||[]).map(c=><div className="row" key={c.id}><b>{c.title}</b><span>{c.reward}</span><span>{c.winChance}%</span><span>{c.active?"Active":"Paused"}</span>
    <span style={{display:'flex',gap:8}}><button className="btn" onClick={()=>toggleScratchCard(c.id)}>{c.active?"Pause":"Activate"}</button><button className="btn" onClick={()=>removeScratchCard(c.id)}>Delete</button></span>
   </div>)}</div>}
  </section>;

  if(page==="analytics")return <><h2>Analytics</h2><div className="stats">{[["Customers",customers.length],["Total Visits",totalVisits],["Total Stamps",totalStamps],["Rewards Redeemed",rewardsRedeemed]].map(x=><div className="stat" key={x[0]}><span className="muted">{x[0]}</span><b>{x[1]}</b></div>)}</div></>;

  if(page==="profile")return <section className="card"><h2>Business Profile</h2><div className="profile-layout"><div><div className="avatar">{profile.logo?<img src={profile.logo}/>:"🏪"}</div><input ref={fileRef} type="file" accept="image/*" onChange={uploadLogo} hidden/><button className="btn" disabled={logoUploading} onClick={()=>fileRef.current?.click()}>{logoUploading?"Uploading…":"Upload / Change Picture"}</button>
   <div className="notice" style={{marginTop:15,fontSize:14}}>
    <p style={{margin:'4px 0'}}><b>📅 Registered:</b> {profile.createdAt?new Date(profile.createdAt).toLocaleDateString():"—"}</p>
    <p style={{margin:'4px 0'}}><b>📦 Package:</b> {profile.activePackage||"None"}</p>
    <p style={{margin:'4px 0'}}><b>Status:</b> {profile.active===false?"🔴 Suspended":"🟢 Active"}</p>
    <p style={{margin:'4px 0'}}><b>💳 Payment:</b> {profile.paymentStatus==="paid"?"Paid":"Pending"}</p>
    <p style={{margin:'4px 0'}}><b>Expiry:</b> {profile.subscriptionActiveUntil?new Date(profile.subscriptionActiveUntil).toLocaleDateString():"—"}</p>
   </div>
  </div><form onSubmit={saveProfile}>{["name","owner","phone","address","category","email"].map(k=><label key={k}>{k[0].toUpperCase()+k.slice(1)}<input className="field" name={k} defaultValue={profile[k]}/></label>)}
   <label>Facebook Page Link<input className="field" name="facebook" defaultValue={profile.facebook} placeholder="https://facebook.com/yourshop"/></label>
   <label>Instagram Profile Link<input className="field" name="instagram" defaultValue={profile.instagram} placeholder="https://instagram.com/yourshop"/></label>
   <label>Google Review Link<input className="field" name="googleReview" defaultValue={profile.googleReview} placeholder="https://g.page/r/yourshop/review"/></label>
   <button className="primary">Save Profile</button></form></div></section>;

  if(page==="subscriptions")return <section className="card"><h2>Packages & Payment</h2><div className="packages">{packages.map(p=><div className={`package ${selected.id===p.id?"selected":""}`} key={p.id}><h3>{p.name}</h3><div className="price">PKR {p.amount.toLocaleString()}</div><p>{p.days} days</p><button className="primary" onClick={()=>setSelected(p)}>Select</button></div>)}</div>
   <div className="notice" style={{marginTop:15}}><b>JazzCash:</b> {payment.jazzcash}<br/><b>Easypaisa:</b> {payment.easypaisa}<br/><b>Meezan Bank:</b> {payment.meezan}<br/><br/><a className="primary" target="_blank" href={whatsapp}>📲 Payment ke baad WhatsApp bhejein</a></div>
   <div className="notice" style={{marginTop:15}}><h3>Admin Activation Code</h3><p className="muted">Payment verify hone ke baad Admin activation code dega.</p><input className="field" value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter activation code"/><button className="primary" onClick={submitActivation}>Activate Package</button>
   {profile.subscriptionRequest&&<p className="muted" style={{marginTop:10}}>Last request: {profile.subscriptionRequest.package} — {profile.subscriptionRequest.status}</p>}</div>
  </section>;

  return <section className="card"><h2>Settings</h2><div className="settings"><button className="btn" onClick={()=>setPage("shopmap")}>Shop Map Location</button><button className="btn" onClick={()=>setPage("qr")}>QR Settings</button><button className="btn" onClick={async()=>{await signOut(auth);window.location.href="/";}}>Sign Out</button></div></section>;
 }

 return <main className="shell"><header className="top"><div className="topin"><div className="brand"><b>✦ BAZAAR GO</b><strong>LOYALTY</strong><span>Scan. Collect. Reward.</span></div><div className="top-actions"><span className="role-label">Business Owner</span><a className="btn" href="/">Home</a></div></div><div className="nav">{businessMenu.map(([id,label])=><button key={id} className={page===id?"on":""} onClick={()=>setPage(id)}>{label}</button>)}</div></header>
 <div className="main">{content()}</div>
 {toast&&<div className="toast">✓ {toast}</div>}
 {modal&&<div className="modal"><div className="modalbox"><div className="pagehead"><h2>New Customer</h2><button className="btn" onClick={()=>setModal(false)}>✕</button></div><form onSubmit={addCustomer}><label>Name<input className="field" name="name" required placeholder="Customer name"/></label><label>Phone Number<input className="field" name="phone" required inputMode="tel" placeholder="03XXXXXXXXX"/></label><label>Gmail (optional)<input className="field" name="email" type="email" placeholder="customer@gmail.com"/></label><button className="primary">Create Loyalty Card</button></form></div></div>}
 </main>;
}

export default function Dashboard(){
 return <Suspense fallback={<main className="shell"><div className="main"><section className="card"><p className="muted">Loading…</p></section></div></main>}>
  <DashboardInner/>
 </Suspense>;
}
