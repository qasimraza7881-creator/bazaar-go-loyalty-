import { NextResponse } from "next/server";
import { adminDb, adminConfigured } from "../../../../lib/firebase-admin";

// Haversine distance in kilometers.
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Public endpoint: only ever returns fields that are safe to show a
// non-authenticated customer (no phone/email/subscription/activation data).
export async function GET(req) {
  if (!adminConfigured || !adminDb) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured on the server" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  try {
    const snap = await adminDb.collection("businesses").where("active", "!=", false).limit(100).get();
    let businesses = snap.docs
      .map((d) => {
        const b = d.data();
        const bLat = Number(b.lat);
        const bLng = Number(b.lng);
        const hasCoords = Number.isFinite(bLat) && Number.isFinite(bLng);
        return {
          id: d.id,
          name: b.name || d.id,
          category: b.category || "",
          address: b.address || "",
          logo: b.logo || "",
          googleReview: b.googleReview || "",
          lat: hasCoords ? bLat : null,
          lng: hasCoords ? bLng : null,
          distanceKm: hasLocation && hasCoords ? Math.round(distanceKm(lat, lng, bLat, bLng) * 10) / 10 : null
        };
      })
      .filter((b) => b.lat !== null && b.lng !== null);

    if (hasLocation) {
      businesses.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else {
      businesses.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Cache at the CDN edge for a short window. Shop list rarely changes
    // second-to-second, so this avoids hitting Firestore on every scan/visit
    // while still refreshing quickly when a business updates its info.
    return NextResponse.json(
      { ok: true, businesses },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Could not load nearby shops" }, { status: 500 });
  }
}
