"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function BottomNav(){
  const pathname=usePathname();
  const is=(p)=>pathname===p;
  return <nav className="bottomnav">
    <Link href="/" className={is("/")?"active":""}><span className="icon">🏠</span>Home</Link>
    <Link href="/nearby" className={is("/nearby")?"active":""}><span className="icon">🧭</span>Explore</Link>
    <Link href="/scan" className="scanbtn">⛶</Link>
    <Link href="/card" className={is("/card")?"active":""}><span className="icon">🎁</span>Reward</Link>
    <Link href="/login?role=business" className={is("/login")?"active":""}><span className="icon">👤</span>Profile</Link>
  </nav>;
}
