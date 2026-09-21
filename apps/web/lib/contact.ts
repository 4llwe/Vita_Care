export const CONTACT = {
  address:
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS ??
    "Jl. Kecubung No.20, Gomong Lama, Kota Mataram, NTB",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "vitacare87@gmail.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+6282227420800",
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/6282227420800",
  mapUrl:
    process.env.NEXT_PUBLIC_MAP_URL ??
    "https://www.google.com/maps/search/?api=1&query=Jl.%20Kecubung%20No.20%2C%20Gomong%20Lama%2C%20Kota%20Mataram%2C%20NTB",
} as const;
