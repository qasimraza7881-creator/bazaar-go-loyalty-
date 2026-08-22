// Client-side unsigned upload to Cloudinary.
// Requires two env vars (safe to expose publicly, they only allow
// uploads into your configured unsigned preset — not deletes/reads):
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//
// Setup (Cloudinary dashboard):
//  1. Settings -> Upload -> Add upload preset -> Signing Mode: "Unsigned".
//  2. Optionally restrict folder + allowed formats on the preset.
//  3. Copy your Cloud Name from the dashboard home page.

export const cloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
);

export async function uploadToCloudinary(file, folder = "bazaar-go") {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message || "Cloudinary upload failed.");
  }
  return json.secure_url;
}
