import Link from "next/link";

export default function Refund(){
 return <main className="shell"><div className="main" style={{maxWidth:700}}>
  <section className="card">
   <h1>Refund Policy</h1>
   <p className="muted">Last updated: 2026</p>
   <p>All plans include a 3-day free trial — no payment is required to try the platform, so please use this period to confirm Bazaar Go fits your business before subscribing.</p>
   <p>Once a paid subscription is activated, fees are non-refundable except where required by law, or in cases of a verified billing error on our part.</p>
   <p>If you believe you were charged incorrectly, contact our support team within 7 days of the charge and we will review your case.</p>
   <Link className="btn" href="/">← Back to Home</Link>
  </section>
 </div></main>;
}
