import crypto from "crypto";
export function signQrPayload(payload) {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not configured");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyQrPayload(token) {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) return { ok:false, reason:"QR signing is not configured" };
  const [body,sig]=String(token).split(".");
  if(!body||!sig) return {ok:false,reason:"Invalid QR"};
  const expected=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return {ok:false,reason:"Invalid signature"};
  const data=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
  if(data.exp && Date.now()>data.exp) return {ok:false,reason:"QR expired"};
  return {ok:true,data};
}
