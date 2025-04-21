// pages/api/proxy-faucet.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL;
const FAUCET_SECRET = process.env.FAUCET_SECRET || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer || "";
  const userAgent = req.headers["user-agent"] || "";

  // ❌ Tolak jika bukan dari frontend kamu
if (
  !(origin && origin.startsWith(ALLOWED_ORIGIN)) &&
  !(referer && referer.startsWith(ALLOWED_ORIGIN))
) {
    return res.status(403).json({ message: "Forbidden: Invalid origin." });
  }

  // ❌ Tolak user-agent mencurigakan
  if (/curl|python|wget|bot|postman/i.test(userAgent)) {
    return res.status(403).json({ message: "Forbidden: Suspicious agent." });
  }

  try {
    const body = req.body;

    const response = await fetch(`${ALLOWED_ORIGIN}/api/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-faucet-auth": FAUCET_SECRET,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).json({ message: "Proxy error" });
  }
}
