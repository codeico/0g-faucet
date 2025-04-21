import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

const IP_COOLDOWN_SECONDS = parseInt(process.env.IP_COOLDOWN_SECONDS || "86400");
const ADDRESS_COOLDOWN_SECONDS = parseInt(process.env.ADDRESS_COOLDOWN_SECONDS || "86400");

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed." });
    }

    // ⛔ Batasi akses hanya dari IP yang diizinkan (Cloudflare-aware)
    const ip = getRealIP(req);
    const allowedIPs = (process.env.ALLOWED_IPS || "").split(",").map(ip => ip.trim());
    if (!ip || !allowedIPs.includes(ip)) {
      console.warn(`[BLOCKED] Unauthorized IP: ${ip}`);
      return res.status(403).json({ message: "Forbidden. IP not allowed." });
    }

    // ✅ Ambil data dari body
    const { address, hcaptchaToken } = JSON.parse(req.body || "{}");
    if (!address || !hcaptchaToken) {
      return res.status(400).json({ message: "Missing address or captcha token." });
    }

    // ✅ Validasi Alamat
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ message: "Invalid wallet address." });
    }

    // ✅ Validasi User-Agent (anti bot)
    const ua = req.headers["user-agent"] || "";
    if (!ua || ua.length < 10 || /python|curl|wget/i.test(ua)) {
      return res.status(400).json({ message: "Suspicious user-agent." });
    }

    // ✅ Validasi Referer (opsional)
    const referer = req.headers["referer"] || "";
    if (!referer.includes("0g")) {
      return res.status(400).json({ message: "Invalid referer." });
    }

    // ✅ hCaptcha Verification
    const captchaResult = await verify(process.env.HCAPTCHA_SECRET || "", hcaptchaToken);
    if (!captchaResult.success) {
      return res.status(401).json({ message: "Captcha verification failed." });
    }

    // ✅ Cek cooldown
    const ipKey = `cooldown_ip_${ip}`;
    const walletKey = `cooldown_wallet_${address}`;
    const [ipTTL, walletTTL] = await Promise.all([redis.ttl(ipKey), redis.ttl(walletKey)]);

    if (ipTTL > 0) {
      return res.status(429).json({ message: `This IP has already claimed. Try again in ${formatTTL(ipTTL)}.` });
    }

    if (walletTTL > 0) {
      return res.status(429).json({ message: `This wallet has already claimed. Try again in ${formatTTL(walletTTL)}.` });
    }

    const cooldownCheck = await canRecieve(address);
    if (!cooldownCheck.success) {
      return res.status(400).json({ message: cooldownCheck.message });
    }

    // ✅ Kirim token
    const tx = await transferCoin(address);
    if (!tx.success) {
      return res.status(400).json({ message: tx.message });
    }

    // ✅ Simpan ke Redis cooldown
    await redis.set(ipKey, "1", "EX", IP_COOLDOWN_SECONDS);
    await redis.set(walletKey, "1", "EX", ADDRESS_COOLDOWN_SECONDS);

    return res.status(200).json({ message: tx.message });

  } catch (err: any) {
    console.error("[ERROR]", err);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

function formatTTL(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function getRealIP(req: NextApiRequest): string | null {
  // Cloudflare IP header or fallback
  return (req.headers["cf-connecting-ip"] as string)
    || (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    || req.socket.remoteAddress
    || null;
}
