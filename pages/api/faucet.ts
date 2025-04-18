import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

// Cooldown period for IP and wallet address
const IP_COOLDOWN_SECONDS = parseInt(process.env.IP_COOLDOWN_SECONDS || "86400");
const ADDRESS_COOLDOWN_SECONDS = parseInt(process.env.ADDRESS_COOLDOWN_SECONDS || "86400");

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed." });
    }

    const { address, hcaptchaToken } = JSON.parse(req.body);

    // Extract IP
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;

    if (!ip) return res.status(400).json({ message: "Unable to detect IP address." });

    const ipKey = `cooldown_ip_${ip}`;
    const walletKey = `cooldown_wallet_${address}`;

    const ipTTL = await redis.ttl(ipKey);
    const walletTTL = await redis.ttl(walletKey);

    if (ipTTL > 0) {
      return res.status(429).json({
        message: `This IP has already claimed. Try again in ${formatTTL(ipTTL)}.`,
      });
    }

    if (walletTTL > 0) {
      return res.status(429).json({
        message: `This wallet has already claimed. Try again in ${formatTTL(walletTTL)}.`,
      });
    }

    // Verify address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ message: "Invalid wallet address." });
    }

    // Check user-agent (block empty or generic ones used by bots)
    const ua = req.headers["user-agent"] || "";
    if (!ua || ua.length < 10 || ua.toLowerCase().includes("python") || ua.toLowerCase().includes("curl")) {
      return res.status(400).json({ message: "Suspicious user-agent." });
    }

    // Optional: check Referer
    const referer = req.headers["referer"];
    if (!referer || !referer.includes("0g")) {
      return res.status(400).json({ message: "Invalid referer." });
    }

    // hCaptcha verification
    const captcha = await verify(process.env.HCAPTCHA_SECRET!, hcaptchaToken);
    if (!captcha.success) {
      return res.status(401).json({ message: "Captcha verification failed." });
    }

    // Internal cooldown check
    const check = await canRecieve(address);
    if (!check.success) {
      return res.status(400).json({ message: check.message });
    }

    // Transfer token
    const tx = await transferCoin(address);
    if (!tx.success) {
      return res.status(400).json({ message: tx.message });
    }

    // Store cooldowns
    await redis.set(ipKey, "1", "EX", IP_COOLDOWN_SECONDS);
    await redis.set(walletKey, "1", "EX", ADDRESS_COOLDOWN_SECONDS);

    return res.status(200).json({ message: tx.message });
  } catch (err) {
    console.error("[ERROR]", err);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

function formatTTL(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
