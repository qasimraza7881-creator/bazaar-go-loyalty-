import Link from "next/link";

export default function Refund(){
 return <main className="shell">
  <header className="heroTop" style={{borderRadius:"0 0 22px 22px",paddingBottom:22}}>
   <div className="brand" style={{marginBottom:8}}>
    <b style={{color:"#ffe3e3"}}>✦ BAZAAR GO</b>
    <strong style={{color:"#fff"}}>LOYALTY</strong>
   </div>
   <h1 style={{color:"#fff",fontSize:26,margin:"4px 0 0"}}>💳 Refund Policy</h1>
  </header>
  <div className="main" style={{maxWidth:700}}>
  <section className="card">
   <p className="muted">Last updated: 2026</p>
   <p>All plans include a 3-day free trial — no payment is required to try the platform, so please use this period to confirm Bazaar Go fits your business before subscribing.</p>
   <p>Once a paid subscription is activated, fees are non-refundable except where required by law, or in cases of a verified billing error on our part.</p>
   <p>If you believe you were charged incorrectly, contact our support team within 7 days of the charge and we will review your case.</p>
   <Link className="btn" href="/">← Back to Home</Link>
  </section>
 </div></main>;
}
