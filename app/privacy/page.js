import Link from "next/link";

export default function Privacy(){
 return <main className="shell">
  <header className="heroTop" style={{borderRadius:"0 0 22px 22px",paddingBottom:22}}>
   <div className="brand" style={{marginBottom:8}}>
    <b style={{color:"#ffe3e3"}}>✦ BAZAAR GO</b>
    <strong style={{color:"#fff"}}>LOYALTY</strong>
   </div>
   <h1 style={{color:"#fff",fontSize:26,margin:"4px 0 0"}}>🔒 Privacy Policy</h1>
  </header>
  <div className="main" style={{maxWidth:700}}>
  <section className="card">
   <p className="muted">Last updated: 2026</p>
   <p>We collect the minimum information needed to operate the loyalty program: customer name and phone number (provided by the customer on first visit), business profile details, and scan/visit history.</p>
   <p>This data is used only to run the loyalty program — tracking stamps, rewards, and visit history — and is visible to the business the customer interacts with. We do not sell customer data to third parties.</p>
   <p>Businesses are responsible for using customer data only for loyalty and marketing purposes the customer would reasonably expect.</p>
   <p>You can request deletion of your data by contacting the business directly or reaching out to our support.</p>
   <Link className="btn" href="/">← Back to Home</Link>
  </section>
 </div></main>;
}
