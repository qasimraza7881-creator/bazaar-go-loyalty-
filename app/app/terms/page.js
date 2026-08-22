import Link from "next/link";

export default function Terms(){
 return <main className="shell"><div className="main" style={{maxWidth:700}}>
  <section className="card">
   <h1>Terms &amp; Conditions</h1>
   <p className="muted">Last updated: 2026</p>
   <p>By using Bazaar Go Loyalty, you agree to use the service only for legitimate business loyalty purposes. Businesses are responsible for the accuracy of the rewards and offers they configure. Bazaar Go is not responsible for disputes between a business and its customers regarding reward fulfillment.</p>
   <p>Accounts found misusing the platform (fake scans, fraudulent activity, abusive behavior) may be suspended without refund.</p>
   <p>Subscription plans renew as selected at checkout. You may cancel anytime from your dashboard; access continues until the end of the current billing period.</p>
   <Link className="btn" href="/">← Back to Home</Link>
  </section>
 </div></main>;
}
