import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

const IP_COOLDOWN_SECONDS = parseInt(process.env.IP_COOLDOWN_SECONDS || "86400"); // 24 jam default
const ADDRESS_COOLDOWN_SECONDS = parseInt(process.env.ADDRESS_COOLDOWN_SECONDS || "86400");
const ALLOWED_DOMAIN = "https://0g-faucet.bangcode.id"; // Allowed domain

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed." });
    }

    const { address, hcaptchaToken } = JSON.parse(req.body || "{}");

    if (!address || !hcaptchaToken) {
      return res.status(400).json({ message: "Missing address or captcha token." });
    }

    // Extract IP Address
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
    if (!ip) return res.status(400).json({ message: "Unable to detect IP address." });

    const ipKey = `cooldown_ip_${ip}`;
    const walletKey = `cooldown_wallet_${address}`;

    // Check Redis TTL
    const [ipTTL, walletTTL] = await Promise.all([redis.ttl(ipKey), redis.ttl(walletKey)]);
    if (ipTTL > 0) {
      return res.status(429).json({ message: `This IP has already claimed. Try again in ${formatTTL(ipTTL)}.` });
    }

    if (walletTTL > 0) {
      return res.status(429).json({ message: `This wallet has already claimed. Try again in ${formatTTL(walletTTL)}.` });
    }

    // Validate Address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ message: "Invalid wallet address." });
    }

    // Check User-Agent
    const userAgent = req.headers["user-agent"] || "";
    if (!userAgent || userAgent.length < 10 || /python|curl|wget/i.test(userAgent)) {
      return res.status(400).json({ message: "Suspicious user-agent." });
    }

    // Check Referer for domain validation
    const referer = req.headers["referer"] || "";
    if (!referer.startsWith(ALLOWED_DOMAIN)) {
      return res.status(400).json({ message: "Invalid referer. Request must come from the allowed domain." });
    }

    // ✅ hCaptcha Verification
    const captchaResult = await verify(process.env.HCAPTCHA_SECRET || "", hcaptchaToken);
    if (!captchaResult.success) {
      return res.status(401).json({ message: "Captcha verification failed." });
    }

    // ✅ Internal Cooldown via Redis Timestamp
    const cooldownCheck = await canRecieve(address);
    if (!cooldownCheck.success) {
      return res.status(400).json({ message: cooldownCheck.message });
    }

    // ✅ Kirim Koin
    const tx = await transferCoin(address);
    if (!tx.success) {
      return res.status(400).json({ message: tx.message });
    }

    // ✅ Simpan ke Redis (Cooldown)
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
