"use client";
import {useEffect,useState,useCallback,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

function ScratchCard({card,businessId,phone,onResult}){
  const [scratching,setScratching]=useState(false);
  const [localResult,setLocalResult]=useState(card.result);

  async function doScratch(){
    setScratching(true);
    try{
      const res=await fetch("/api/scratch",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({businessId,phone,cardId:card.id})
      });
      const json=await res.json();
      if(json.ok){setLocalResult(json);onResult();}
      else alert(json.error||"Could not scratch this card.");
    }catch(e){alert("Network error. Please try again.");}
    setScratching(false);
  }

  return <div className="row" style={{flexDirection:'column',alignItems:'flex-start',gap:6}}>
    <b>{card.title}</b>
    {localResult?
      <p className={localResult.won?"notice":"muted"}>{localResult.won?`🎉 You won: ${localResult.prize}! Show this to the shop.`:"No prize this time — try another card next visit."}</p>
      :<button className="primary" disabled={scratching} onClick={doScratch}>{scratching?"Scratching…":"🎟️ Scratch Now"}</button>}
  </div>;
}

function CardInner(){
  const params=useSearchParams();
  const businessId=params.get("businessId")||"";
  const phone=params.get("phone")||"";
  const [data,setData]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{
    if(!businessId||!phone){setError("Missing card details. Please scan the shop QR again.");setLoading(false);return;}
    setLoading(true);
    try{
      const res=await fetch(`/api/card?businessId=${encodeURIComponent(businessId)}&phone=${encodeURIComponent(phone)}`);
      const json=await res.json();
      if(!json.ok){setError(json.error||"Could not load your card.");setData(null);}
      else{setData(json);setError("");}
    }catch(e){setError("Network error. Please try again.");}
    setLoading(false);
  },[businessId,phone]);

  useEffect(()=>{load();},[load]);

  const remaining=data?Math.max(0,data.requiredStamps-data.stamps):0;
  const ready=!!(data&&data.rewardReady);

  return <main className="shell" style={{paddingBottom:90}}>

    {loading&&<div className="main"><section className="card"><p className="muted">Loading your card…</p></section></div>}
    {!loading&&error&&<div className="main"><section className="card"><p className="notice">{error}</p>
      <div style={{marginTop:12,display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="primary" href="/scan">📷 Scan Again</Link>
        <Link className="btn" href="/nearby">📍 Nearby Shops</Link>
      </div>
    </section></div>}

    {!loading&&data&&<>
      <header className="heroTop">
        <div className="shopRow">
          <div className="shopLogo">🏪</div>
          <div>
            <div className="shopName">{data.businessName}</div>
            <div className="partnerBadge">PREMIUM PARTNER ✓</div>
          </div>
        </div>
        <div className="stampCount">{data.stamps} of {data.requiredStamps} Stamps</div>
        <div className="progress"><i style={{width:`${Math.min(100,(data.stamps/data.requiredStamps)*100)}%`}}/></div>
      </header>

      <div className="main" style={{maxWidth:700,paddingTop:0}}>
        <div className="treatCard">
          <div className="treatIcon" aria-hidden="true">🎁</div>
          <div>
            <div className="label">YOUR NEXT TREAT</div>
            <div className="title">Free reward on completion</div>
            <div className="muted" style={{fontSize:12.5}}>Collect {remaining} more stamps</div>
          </div>
        </div>

        <section className="card" style={{marginTop:14}}>
          <h3 style={{margin:'0 0 10px'}}>STAMP CARD</h3>
          <div className="stampRow">
            {Array.from({length:data.requiredStamps},(_,i)=>{
              const isLast=i===data.requiredStamps-1;
              const filled=i<data.stamps;
              if(isLast&&!filled) return <div key={i} className="stampCircle gift">🎁</div>;
              return <div key={i} className={filled?"stampCircle filled":"stampCircle empty"}>{filled?"✓":i+1}</div>;
            })}
          </div>
          <p className="muted" style={{fontSize:13.5}}>
            {ready?<>🎉 <b>Your reward is ready!</b></>:<>You&apos;re <b style={{color:'#a5152f'}}>{remaining} stamps</b> away from your treat!</>}
          </p>

          <button className={ready?"claimBtn ready":"claimBtn notready"} disabled={!ready}>🎁 {ready?"Claim Reward":"Claim Reward"}</button>

          {(data.googleReview||data.mapUrl)&&
            <a className="goldBtn" target="_blank" rel="noopener noreferrer" href={data.googleReview||data.mapUrl}>⭐ Rate us on Google</a>}

          <p className="muted" style={{marginTop:10,fontSize:12.5}}>{data.name} • {data.phone} • Visits: {data.visits} • Rewards earned: {data.rewardsEarned}</p>

          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
            <button className="btn" onClick={load}>Refresh</button>
            <Link className="btn" href="/scan">📷 Scan Again</Link>
            <Link className="btn" href="/nearby">📍 Nearby Shops</Link>
          </div>
        </section>

        {data.scratchCards&&data.scratchCards.length>0&&
        <section className="card" style={{marginTop:14}}>
          <h2>🎟️ Scratch Cards</h2>
          <p className="muted">One scratch per card. Results are checked and locked in on the server.</p>
          {data.scratchCards.map(c=><ScratchCard key={c.id} card={c} businessId={businessId} phone={phone} onResult={load}/>)}
        </section>}
      </div>
    </>}

    <BottomNav/>
  </main>;
}

export default function Card(){
  return <Suspense fallback={<main className="shell"><div className="main"><section className="card"><p className="muted">Loading…</p></section></div></main>}>
    <CardInner/>
  </Suspense>;
}
