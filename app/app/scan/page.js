"use client";
import {useEffect,useRef,useState,Suspense} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import jsQR from "jsqr";
import BottomNav from "../components/BottomNav";

function parseShopToken(raw){
  const v = String(raw||"").trim();
  if(v.startsWith("BAZAARGO:")) return v.slice(9);
  return v; // allow scanning a raw token too
}

function ScanInner(){
 const router=useRouter();
 const params=useSearchParams();
 const videoRef=useRef(null); const streamRef=useRef(null); const timerRef=useRef(null); const canvasRef=useRef(null);
 const [status,setStatus]=useState("Camera ready — scan the shop QR code.");
 const [scanned,setScanned]=useState("");
 const [showCustomer,setShowCustomer]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>()=>{stopCamera();},[]);

 // If the shop QR now encodes a real https://.../scan?t=TOKEN link (instead
 // of a plain "BAZAARGO:token" string), any normal phone camera app opens
 // this page directly with the token already in the URL — so we can skip
 // straight to the name/phone step without ever needing the in-page camera
 // scanner at all.
 useEffect(()=>{
   const t=params.get("t");
   if(t){
     setScanned(t);
     setShowCustomer(true);
     setStatus("Shop QR detected. Enter your details to create/continue your loyalty card.");
   }
 },[params]);

 function stopCamera(){
   if(timerRef.current) clearInterval(timerRef.current);
   timerRef.current=null;
   if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
 }

 // Falls back to the pure-JS jsQR decoder (works in every browser,
 // including iOS Safari) whenever the native BarcodeDetector API is
 // unavailable or fails to find a code.
 function decodeWithJsQR(source,w,h){
   const canvas=canvasRef.current; if(!canvas||!w||!h) return "";
   canvas.width=w; canvas.height=h;
   const ctx=canvas.getContext("2d",{willReadFrequently:true});
   ctx.drawImage(source,0,0,w,h);
   const imageData=ctx.getImageData(0,0,w,h);
   const result=jsQR(imageData.data,w,h);
   return result?.data||"";
 }

 async function startCamera(){
   try{
     if(!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported");
     const hasNativeDetector='BarcodeDetector' in window;
     const detector=hasNativeDetector?new window.BarcodeDetector({formats:['qr_code']}):null;
     const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
     streamRef.current=stream;
     videoRef.current.srcObject=stream;
     await videoRef.current.play();
     setStatus("Point the camera at the shop QR code…");
     timerRef.current=setInterval(async()=>{
       try{
         if(!videoRef.current || videoRef.current.readyState<2) return;
         let value="";
         if(detector){
           const codes=await detector.detect(videoRef.current);
           if(codes?.length) value=codes[0].rawValue||"";
         }
         if(!value){
           value=decodeWithJsQR(videoRef.current,videoRef.current.videoWidth,videoRef.current.videoHeight);
         }
         if(value){
           setScanned(value); setShowCustomer(true); setStatus("Shop QR detected. Enter your details to create/continue your loyalty card."); stopCamera();
         }
       }catch(e){}
     },500);
   }catch(e){setStatus("Camera permission was denied or unavailable. Please allow camera access and try again.");}
 }

 async function imageScan(e){
   const file=e.target.files?.[0]; if(!file)return;
   try{
     const bitmap=await createImageBitmap(file);
     let value="";
     if('BarcodeDetector' in window){
       try{
         const detector=new window.BarcodeDetector({formats:['qr_code']});
         const codes=await detector.detect(bitmap);
         if(codes?.length) value=codes[0].rawValue||"";
       }catch(e){}
     }
     if(!value){
       value=decodeWithJsQR(bitmap,bitmap.width,bitmap.height);
     }
     if(value){setScanned(value);setShowCustomer(true);setStatus("Shop QR detected. Enter your details.");}
     else setStatus("No QR code found in that image.");
   }catch(e){setStatus("Could not read that QR image.");}
 }

 async function continueToCard(e){
   e.preventDefault();
   setError("");
   const fd=new FormData(e.currentTarget);
   const name=String(fd.get('name')||'').trim();
   const phone=String(fd.get('phone')||'').trim();
   if(!name||!phone)return;

   const token=parseShopToken(scanned);
   if(!token){setError("This QR code is not a valid Bazaar Go shop code.");return;}

   setBusy(true);
   try{
     const res=await fetch("/api/stamp",{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify({token,name,phone})
     });
     const json=await res.json();
     if(!json.ok){
       setError(json.error||"Could not process this scan. Please try again.");
       setBusy(false);
       return;
     }
     if(json.cooldown){
       setError(`You already collected a stamp here recently. Try again in about ${json.cooldownRemainingMinutes} minute(s) — opening your card now.`);
     }
     router.push(`/card?businessId=${encodeURIComponent(json.businessId)}&phone=${encodeURIComponent(phone)}`);
   }catch(e){
     setError("Network error. Please check your connection and try again.");
     setBusy(false);
   }
 }

 return <main className="shell" style={{paddingBottom:90}}><div className="main" style={{maxWidth:700}}>
  <section className="card">
   <h1>📷 Scan Shop QR</h1>
   <p className="muted">Customer login is not required. Scan the QR code displayed by the shop.</p>
   <video ref={videoRef} playsInline muted style={{width:'100%',height:320,objectFit:'cover',background:'#100608',borderRadius:18,border:'1px solid #f0e2e2'}} />
   <canvas ref={canvasRef} style={{display:'none'}} />
   <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:15}}>
    <button className="primary" onClick={startCamera}>Start Camera</button>
    <label className="btn" style={{cursor:'pointer'}}>Scan QR Image<input type="file" accept="image/*" onChange={imageScan} style={{display:'none'}}/></label>
   </div>
   <p className="notice">{status}</p>
  </section>

  {showCustomer&&<section className="card" style={{marginTop:18}}>
   <h2>New / Returning Customer</h2>
   <p className="muted">First visit: add name and phone number. The business owner and authorized admin can see these details.</p>
   <form onSubmit={continueToCard}>
    <label>Name<input className="field" name="name" required placeholder="Customer name"/></label>
    <label>Phone Number<input className="field" name="phone" required inputMode="tel" placeholder="03XXXXXXXXX"/></label>
    <button className="primary" disabled={busy}>{busy?"Checking…":"Continue to Loyalty Card"}</button>
   </form>
   {error&&<p className="notice">{error}</p>}
  </section>}

  <section className="card" style={{marginTop:18}}><h3>How it works</h3><p className="muted">1. Scan shop QR → 2. Verify shop/branch → 3. Enter phone/name if needed → 4. Open loyalty card → 5. Collect stamp/reward.</p></section>
 </div>
 <BottomNav/>
 </main>;
}

export default function Scan(){
 return <Suspense fallback={<main className="shell"><div className="main"><section className="card"><p className="muted">Loading…</p></section></div></main>}>
  <ScanInner/>
 </Suspense>;
}
