import Link from "next/link";

export default function Promo(){
 return <main className="shell" style={{maxWidth:520,margin:"0 auto",background:"#fff"}}>

  {/* ===== Ad hero ===== */}
  <header className="heroTop" style={{borderRadius:0,textAlign:"center",paddingTop:34,paddingBottom:34}}>
   <div style={{fontSize:13,letterSpacing:4,color:"#ffd6d6",fontWeight:800}}>✦ BAZAAR GO LOYALTY</div>
   <h1 style={{color:"#fff",fontSize:34,lineHeight:1.15,margin:"14px 0 10px"}}>Turn every visit<br/>into a reward.</h1>
   <p style={{color:"#ffe3e3",fontSize:14.5,maxWidth:360,margin:"0 auto"}}>QR-based digital loyalty cards for cafés, salons, gyms &amp; retail — no app download for your customers.</p>
   <div style={{marginTop:20,display:"inline-flex",alignItems:"center",gap:8,background:"#ffffff22",border:"1px solid #ffffff44",borderRadius:999,padding:"8px 16px",color:"#fff",fontWeight:800,fontSize:13}}>
    🎁 3-Day Free Trial — No Card Needed
   </div>
  </header>

  <div className="main" style={{maxWidth:520,paddingTop:22}}>

   {/* ===== Live product preview ===== */}
   <section className="card" style={{padding:0,overflow:"hidden"}}>
    <div className="heroTop" style={{borderRadius:0,padding:"18px 18px 22px"}}>
     <div className="shopRow">
      <div className="shopLogo">🏪</div>
      <div><div className="shopName">Borcella Cafe</div><div className="partnerBadge">PREMIUM PARTNER ✓</div></div>
     </div>
     <div className="stampCount">4 of 5 Stamps</div>
     <div className="progress"><i style={{width:"80%"}}/></div>
    </div>
    <div style={{padding:16}}>
     <div className="stampRow" style={{marginTop:0}}>
      {[1,2,3,4].map(i=><div key={i} className="stampCircle filled">✓</div>)}
      <div className="stampCircle gift">🎁</div>
     </div>
     <p className="muted" style={{fontSize:13}}>You&apos;re <b style={{color:"#a5152f"}}>1 stamp</b> away from your treat!</p>
    </div>
   </section>

   {/* ===== Feature highlights ===== */}
   <h2 style={{textAlign:"center",marginTop:28}}>Everything your shop needs</h2>
   <div className="grid feature-grid" style={{marginTop:12}}>
    {[
     ["📷","QR Stamp Cards","Customers scan → collect stamps → earn rewards."],
     ["🎟️","Scratch Cards","Fun surprise-and-delight offers on every visit."],
     ["📋","Digital Menu","Share your menu/catalog from the same QR."],
     ["📊","Live Analytics","Track visits, repeat customers &amp; redemptions."],
     ["📍","GPS Branch Detect","Same QR works correctly across branches."],
     ["🖨️","Free QR Stand","A printed stand delivered straight to your store."],
    ].map(([i,t,d])=><section className="card" key={t}><div className="feature-icon">{i}</div><h3 style={{fontSize:14.5}}>{t}</h3><p className="muted" style={{fontSize:12.5}}>{d}</p></section>)}
   </div>

   {/* ===== Social proof ===== */}
   <section className="card" style={{marginTop:20,textAlign:"center",border:"1px solid #f0c9c9"}}>
    <div style={{fontSize:28,fontWeight:800,color:"#a5152f"}}>500+</div>
    <p className="muted" style={{margin:0}}>businesses already using Bazaar Go to bring customers back</p>
   </section>

   {/* ===== Pricing teaser ===== */}
   <section className="card" style={{marginTop:20,textAlign:"center"}}>
    <p className="gold" style={{letterSpacing:3,fontSize:11,fontWeight:800,margin:0}}>STARTER PLAN</p>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:8,marginTop:6}}>
     <span className="muted" style={{textDecoration:"line-through",fontSize:14}}>PKR 19,999</span>
     <span style={{fontSize:30,fontWeight:800}}>PKR 10,000</span><span className="muted" style={{fontSize:13}}>/yr</span>
    </div>
    <p className="muted" style={{fontSize:12.5}}>1 location • Unlimited QR scans • Free QR stand</p>
   </section>

   {/* ===== CTA ===== */}
   <Link href="/login?role=business" className="primary" style={{display:"block",textAlign:"center",padding:15,marginTop:22,textDecoration:"none",fontSize:16,borderRadius:16}}>Start Your Free Trial →</Link>
   <p className="muted" style={{textAlign:"center",marginTop:12,fontSize:12}}>No credit card required • Cancel anytime</p>

   <footer className="footer">✦ BAZAAR GO LOYALTY — Scan. Collect. Reward.</footer>
  </div>
 </main>
}
