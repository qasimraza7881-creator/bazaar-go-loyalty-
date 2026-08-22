import Link from "next/link";
import BottomNav from "./components/BottomNav";

export default function Home(){
 return <main className="shell" style={{paddingBottom:90}}>

  <header className="heroTop" style={{borderRadius:0,paddingTop:18}}>
   <div className="brand" style={{marginBottom:10}}>
    <b style={{color:"#ffe3e3"}}>✦ BAZAAR GO</b>
    <strong style={{color:"#fff"}}>LOYALTY</strong>
    <span style={{color:"#ffd6d6"}}>Scan. Collect. Reward.</span>
   </div>
   <h1 style={{color:"#fff",fontSize:"clamp(24px,5vw,36px)",lineHeight:1.15,margin:"6px 0 8px"}}>Collect rewards every time you visit.</h1>
   <p style={{color:"#ffe3e3",fontSize:13.5,maxWidth:520}}>Customer login nahi. Customer sirf shop ka QR scan karega, phir first visit par name + phone number add karega.</p>

   {/* ===== Hero: live stamp-card visual ===== */}
   <div className="card" style={{marginTop:20,padding:0,overflow:"hidden",maxWidth:360}}>
    <div style={{padding:"14px 16px 4px"}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
       <div className="shopLogo" style={{background:"#fdeceb",width:32,height:32,fontSize:15}}>☕</div>
       <div style={{fontWeight:800,fontSize:13.5}}>Borcella Cafe</div>
      </div>
      <span className="pill" style={{margin:0,fontSize:10.5,color:"#a5152f",borderColor:"#e6c9c9"}}>4 of 5 stamps</span>
     </div>
     <div className="stampRow" style={{marginTop:12,marginBottom:4,gap:7}}>
      {[1,2,3,4].map(i=><div key={i} className="stampCircle filled" style={{width:38,height:38,flex:"0 0 38px",fontSize:14}}>✓</div>)}
      <div className="stampCircle gift" style={{width:38,height:38,flex:"0 0 38px",fontSize:16}}>🎁</div>
     </div>
    </div>
    <div style={{padding:"8px 16px 14px"}}>
     <p className="muted" style={{fontSize:12,margin:0}}>1 stamp away from a free reward — this is what your customers see.</p>
    </div>
   </div>
  </header>

  <div className="main" style={{maxWidth:700,paddingTop:16}}>

   <div className="treatCard" style={{alignItems:"stretch"}}>
    <div style={{flex:1}}>
     <div className="label">GET STARTED</div>
     <div className="title">Scan a shop&apos;s QR to begin</div>
     <div className="muted" style={{fontSize:12.5}}>No app install, no password — just scan and collect.</div>
    </div>
   </div>

   <div className="actions" style={{marginTop:14}}>
    <Link className="primary bigbtn" href="/scan">📷 Scan Shop QR</Link>
    <Link className="btn bigbtn" href="/nearby">📍 Nearby Shops</Link>
   </div>
   <div className="actions" style={{marginTop:8}}>
    <Link className="btn bigbtn" href="/login?role=business">🏪 Business Owner Login</Link>
    <Link className="btn bigbtn" href="/login?role=admin">🛡️ Admin Login</Link>
   </div>

   {/* ===== How it works ===== */}
   <h2 style={{marginTop:30,marginBottom:10}}>How it works</h2>
   <div className="grid2" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
    {[
     ["1","📷","Scan the QR","Customer shop ke counter par QR scan karta hai — no app install."],
     ["2","✍️","Add name & phone","Sirf first visit par — future visits automatic recognize."],
     ["3","🎁","Earn & redeem","Har visit par ek stamp, target complete hone par free reward."],
    ].map(([n,i,t,d])=>
     <section className="card" key={n} style={{position:"relative"}}>
      <span style={{position:"absolute",top:12,right:14,fontSize:11,fontWeight:800,color:"#e6c9c9"}}>{n}</span>
      <div className="feature-icon">{i}</div><h3>{t}</h3><p className="muted">{d}</p>
     </section>)}
   </div>

   {/* ===== Categories ===== */}
   <h2 style={{marginTop:30,marginBottom:2}}>Perfect for every local business</h2>
   <p className="muted" style={{marginTop:0,marginBottom:12}}>Cafes se le kar gyms tak — jahan bhi repeat customers matter karte hain.</p>
   <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
    {[
     ["☕","Cafés & Restaurants"],
     ["💇","Salons & Spas"],
     ["🏋️","Gyms & Fitness"],
     ["🚗","Car Washes"],
     ["🛍️","Retail Stores"],
     ["💎","Jewelry Shops"],
    ].map(([i,t])=>
     <section className="card" key={t} style={{textAlign:"center",padding:"18px 10px"}}>
      <div className="feature-icon" style={{margin:"0 auto 6px"}}>{i}</div>
      <h3 style={{fontSize:13.5,margin:0}}>{t}</h3>
     </section>)}
   </div>

   <h2 style={{marginTop:30,marginBottom:10}}>Why Bazaar Go</h2>
   <div className="grid feature-grid">
    {[
     ["📷","Shop QR Scan","Customer login ke baghair secure shop/branch QR scan."],
     ["🎫","Loyalty Cards","Stamps, progress, rewards aur visit history."],
     ["📍","Shop Map","Business apni shop location aur branches map par set kare."],
     ["👥","Customers","Business owner customer ka name aur phone dekh sakta hai."],
     ["📊","Analytics","Visits, customers, stamps aur reward activity."],
     ["🛡️","Admin Control","Businesses, customers, packages, payments aur activation."],
    ].map(([i,t,d])=><section className="card" key={t}><div className="feature-icon">{i}</div><h3>{t}</h3><p className="muted">{d}</p></section>)}
   </div>

  </div>

  {/* ===== Pricing ===== */}
  <header className="heroTop" style={{borderRadius:0,marginTop:26,textAlign:"center"}}>
   <h2 style={{color:"#fff",fontSize:26,margin:"4px 0"}}>Simple, transparent pricing</h2>
   <p style={{color:"#ffe3e3",fontSize:13.5,margin:0}}>Start free. Scale as you grow.</p>
  </header>

  <div className="main" style={{maxWidth:700,paddingTop:0}}>
   <div style={{display:"grid",gap:16,marginTop:-30}}>
    {[
     {
      name:"Basic",was:"19,999",price:"10,000",locations:"1 location",popular:false,
      features:["1 store location","Digital Stamp Cards","Digital Menu","Scratch Cards","Unlimited QR scans","Analytics dashboard","FREE QR code stand"]
     },
     {
      name:"Growth",was:"49,999",price:"25,000",locations:"3 locations",popular:true,
      features:["Up to 3 store locations","Digital Stamp Cards","Digital Menu","Scratch Cards","Same QR, GPS branch detection","Branch-wise scan analytics","Priority support"]
     },
     {
      name:"Pro",was:"99,999",price:"50,000",locations:"6 locations",popular:false,
      features:["Up to 6 store locations","Digital Stamp Cards","Digital Menu","Scratch Cards","Same QR, GPS branch detection","Branch-wise scan analytics","Dedicated account manager"]
     },
    ].map(plan=>
     <section key={plan.name} className="card" style={plan.popular?{border:"2px solid #a5152f",position:"relative",paddingTop:26}:{}}>
      {plan.popular&&<span className="pill" style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:"#a5152f",color:"#fff",borderColor:"#a5152f",fontWeight:800}}>Most Popular</span>}
      <div style={{textAlign:"center"}}>
       <h3 style={{fontSize:20,margin:"0 0 6px"}}>{plan.name}</h3>
       <div className="muted" style={{textDecoration:"line-through",fontSize:13}}>PKR {plan.was}/yr</div>
       <div style={{fontSize:30,fontWeight:800,margin:"2px 0"}}>PKR {plan.price}<span className="muted" style={{fontSize:14,fontWeight:400}}>/yr</span></div>
       <div className="muted" style={{fontSize:12.5}}>📍 {plan.locations}</div>
      </div>
      <div style={{display:"grid",gap:9,margin:"16px 0"}}>
       {plan.features.map(f=>
        <div key={f} style={{display:"flex",alignItems:"center",gap:9}}>
         <span style={{color:"#1f9d55",fontWeight:800}}>✓</span><span style={{fontSize:13.5}}>{f}</span>
        </div>)}
      </div>
      <Link href="/login?role=business" className={plan.popular?"primary":"btn"} style={{display:"block",textAlign:"center",width:"100%",textDecoration:"none",padding:"11px"}}>Get Started</Link>
     </section>
    )}
   </div>

   <p className="muted" style={{textAlign:"center",marginTop:14,fontSize:12.5}}>All plans include a <b style={{color:"#a5152f"}}>3-day free trial</b> — no payment required to start. Enterprise plans with unlimited locations also available.</p>

   {/* ===== FAQ ===== */}
   <h2 style={{marginTop:34,textAlign:"center"}}>Frequently Asked Questions</h2>
   <p className="muted" style={{textAlign:"center",marginTop:-6}}>Everything you need to know about Bazaar Go</p>
   <div style={{display:"grid",gap:12,marginTop:16}}>
    {[
     ["What is Bazaar Go Loyalty?","Bazaar Go is a digital loyalty platform that helps businesses retain customers with QR-based stamp cards. Customers scan your QR code on each visit and earn rewards — no app download needed."],
     ["How does it work for my business?","Sign up, add your business name, set your reward (e.g., 10 visits = free reward), and display your QR code. Customers scan it on each visit to collect stamps. You track everything from your dashboard."],
     ["How much does Bazaar Go cost?","We offer three plans: Basic (PKR 10,000/yr, 1 location), Growth (PKR 25,000/yr, up to 3 locations with GPS branch detection), and Pro (PKR 50,000/yr, up to 6 locations). All plans include a 3-day free trial with no payment required. Enterprise plans with unlimited locations are also available."],
     ["What types of businesses can use Bazaar Go?","Bazaar Go works for cafés, businesses, salons, gyms, car washes, retail stores, spas — any business that wants to bring customers back with rewards."],
    ].map(([q,a])=>
     <section className="card" key={q}>
      <h3 style={{margin:"0 0 8px"}}>{q}</h3>
      <p className="muted" style={{margin:0}}>{a}</p>
     </section>)}
   </div>

   {/* ===== CTA ===== */}
   <section className="card" style={{marginTop:26,textAlign:"center",border:"1px solid #f0c9c9"}}>
    <h2 style={{fontSize:24,margin:"4px 0"}}>Ready to grow your business?</h2>
    <p className="muted">Join 500+ businesses using Bazaar Go to increase repeat customers.</p>
    <Link href="/login?role=business" className="primary" style={{display:"block",textAlign:"center",padding:13,marginTop:14,textDecoration:"none",fontSize:15}}>Start Your Free Trial →</Link>
    <p className="muted" style={{marginTop:14,fontSize:13}}>Already have a business? <Link href="/login?role=business" style={{color:"#a5152f",fontWeight:800,textDecoration:"none"}}>Sign In</Link></p>
   </section>

   {/* ===== Footer ===== */}
   <footer className="footer">
    <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap",marginBottom:8}}>
     <Link href="/terms" style={{color:"#8a7877",textDecoration:"none"}}>Terms &amp; Conditions</Link>
     <Link href="/privacy" style={{color:"#8a7877",textDecoration:"none"}}>Privacy Policy</Link>
     <Link href="/refund" style={{color:"#8a7877",textDecoration:"none"}}>Refund Policy</Link>
    </div>
    © 2025-2026 Bazaar Go. Made with ❤️ in Pakistan
   </footer>
  </div>

  <BottomNav/>
 </main>
}
