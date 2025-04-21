// pages/api/proxy-faucet.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed." });

  const origin = req.headers.origin ?? "";
  const referer = req.headers.referer ?? "";
  const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "";

  // ❌ Tolak jika bukan dari frontend kamu
  if (
    !origin.startsWith(ALLOWED_ORIGIN) &&
    !referer.startsWith(ALLOWED_ORIGIN)
  ) {
    return res.status(403).json({ message: "Forbidden: Invalid origin." });
  }

  try {
    const body = req.body;
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-faucet-auth": process.env.FAUCET_SECRET || "",
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
