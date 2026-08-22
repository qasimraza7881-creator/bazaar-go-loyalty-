"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

export default function Nearby(){
  const [shops,setShops]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [locDenied,setLocDenied]=useState(false);

  function load(lat,lng){
    setLoading(true);
    const qs=lat!=null&&lng!=null?`?lat=${lat}&lng=${lng}`:"";
    fetch(`/api/businesses/nearby${qs}`)
      .then(r=>r.json())
      .then(json=>{
        if(json.ok){setShops(json.businesses);setError("");}
        else setError(json.error||"Could not load shops.");
      })
      .catch(()=>setError("Network error. Please try again."))
      .finally(()=>setLoading(false));
  }

  useEffect(()=>{
    // Show the alphabetical list immediately instead of blocking on the
    // geolocation prompt (which can take several seconds or time out).
    // If location resolves shortly after, silently re-sort by distance.
    load();
    if(!navigator.geolocation){setLocDenied(true);return;}
    navigator.geolocation.getCurrentPosition(
      (pos)=>load(pos.coords.latitude,pos.coords.longitude),
      ()=>{setLocDenied(true);},
      {timeout:8000}
    );
  },[]);

  return <main className="shell" style={{paddingBottom:90}}>
    <header className="heroTop" style={{borderRadius:"0 0 22px 22px"}}>
      <div className="brand" style={{marginBottom:8}}>
        <b style={{color:"#ffe3e3"}}>✦ BAZAAR GO</b>
        <strong style={{color:"#fff"}}>LOYALTY</strong>
      </div>
      <h1 style={{color:"#fff",fontSize:"clamp(22px,4.5vw,30px)",margin:"4px 0 6px"}}>📍 Nearby Shops</h1>
      <p style={{color:"#ffe3e3",fontSize:13.5,margin:0}}>{locDenied?"Location access wasn't available — showing all shops alphabetically.":"Sorted by distance from your current location."}</p>
    </header>
    <div className="main" style={{maxWidth:700}}>
      {loading&&<p className="muted">Loading shops…</p>}
      {!loading&&error&&<p className="notice">{error}</p>}
      {!loading&&!error&&shops.length===0&&<p className="muted">No shops found yet.</p>}
      {!loading&&shops.map(s=>
        <div className="card" key={s.id} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
          <div className="feature-icon" style={{margin:0,flex:"0 0 46px"}}>{categoryIcon(s.category)}</div>
          <div style={{flex:1}}>
            <b>{s.name}</b>
            <div className="muted" style={{fontSize:12.5}}>{s.category||"—"} • {s.address||"—"}</div>
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8,flexWrap:'wrap'}}>
              {s.distanceKm!=null&&<span className="muted" style={{fontSize:12.5}}>{s.distanceKm} km away</span>}
              <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}>Directions</a>
              <a className="btn" target="_blank" rel="noopener noreferrer" href={s.googleReview||`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}>⭐ Feedback</a>
            </div>
          </div>
        </div>
      )}
      <div style={{marginTop:15,marginBottom:20}}><Link className="primary" href="/scan">📷 Scan a Shop QR</Link></div>
  </div>
  <BottomNav/>
  </main>;
}

function categoryIcon(category){
  const c=(category||"").toLowerCase();
  if(c.includes("cafe")||c.includes("café")||c.includes("restaurant")||c.includes("food"))return "☕";
  if(c.includes("salon")||c.includes("spa")||c.includes("beauty"))return "💇";
  if(c.includes("gym")||c.includes("fitness"))return "🏋️";
  if(c.includes("car")||c.includes("wash")||c.includes("auto"))return "🚗";
  if(c.includes("jewel"))return "💎";
  if(c.includes("retail")||c.includes("store")||c.includes("shop"))return "🛍️";
  return "🏪";
}
