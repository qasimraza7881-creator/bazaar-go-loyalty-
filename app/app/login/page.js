"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {signInWithPopup} from "firebase/auth";
import {auth,googleProvider,firebaseConfigured} from "../../lib/firebase";

export default function Login(){
 const router=useRouter();
 const [role,setRole]=useState("customer");
 const [msg,setMsg]=useState("");
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
   const p=new URLSearchParams(window.location.search);
   setRole(p.get("role")||"customer");
 },[]);

 async function google(){
   setMsg("");
   if(!firebaseConfigured||!auth){setMsg("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables in Vercel.");return}
   setBusy(true);
   try{
     await signInWithPopup(auth,googleProvider);
     router.push(role==="customer"?"/":"/dashboard?role="+role);
   }catch(e){
     setMsg(e?.code==="auth/popup-closed-by-user"?"Google sign-in was cancelled.":"Google sign-in failed. Enable Google in Firebase Authentication and try again.");
   }finally{setBusy(false);}
 }

 return <main className="shell" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px"}}>
  <div className="main" style={{maxWidth:420,padding:0,width:"100%"}}>
   <section className="card" style={{textAlign:"center"}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(180deg,#c81e3e,#7c0e26)",display:"grid",placeItems:"center",margin:"0 auto 14px",fontSize:28,color:"#fff",boxShadow:"0 10px 24px -10px #a5152f66"}}>✦</div>
   <h1 style={{textAlign:"center"}}>{role==="business"?"Business Owner":role==="admin"?"Admin":"Customer"} Login</h1>
   <p className="muted" style={{textAlign:"center"}}>Fast and secure login with your Google account.</p>
   <button className="primary" onClick={google} disabled={busy} style={{width:"100%",marginTop:16}}>
     {busy?"Connecting…":"Continue with Google"}
   </button>
   <p className="muted" style={{textAlign:"center",marginTop:14,fontSize:13}}>No SIM OTP required.</p>
   {msg&&<p className="notice">{msg}</p>}
  </section>
  </div>
 </main>
}
