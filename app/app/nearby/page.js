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

  return <main className="shell" style={{paddingBottom:90}}><div className="main" style={{maxWidth:700}}>
    <section className="card">
      <h1>📍 Nearby Shops</h1>
      <p className="muted">{locDenied?"Location access wasn't available — showing all shops alphabetically.":"Sorted by distance from your current location."}</p>
      {loading&&<p className="muted">Loading shops…</p>}
      {!loading&&error&&<p className="notice">{error}</p>}
      {!loading&&!error&&shops.length===0&&<p className="muted">No shops found yet.</p>}
      {!loading&&shops.map(s=>
        <div className="row" key={s.id} style={{flexDirection:'column',alignItems:'flex-start',gap:4}}>
          <b>{s.name}</b>
          <span className="muted">{s.category||"—"} • {s.address||"—"}</span>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {s.distanceKm!=null&&<span className="muted">{s.distanceKm} km away</span>}
            <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}>Directions</a>
            <a className="btn" target="_blank" rel="noopener noreferrer" href={s.googleReview||`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}>⭐ Feedback</a>
          </div>
        </div>
      )}
      <div style={{marginTop:15}}><Link className="primary" href="/scan">📷 Scan a Shop QR</Link></div>
    </section>
  </div>
  <BottomNav/>
  </main>;
}
