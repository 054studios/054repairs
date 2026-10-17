export function whatsappHref(): string | null {
  const number = process.env.WHATSAPP_NUMBER?.replace(/[\s+()-]/g, "") ?? "";
  return /^[1-9]\d{7,14}$/.test(number) ? `https://wa.me/${number}` : null;
}
