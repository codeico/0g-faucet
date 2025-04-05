import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  return typeof forwarded === "string"
    ? forwarded.split(",")[0]
    : req.socket.remoteAddress || "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Message>
) {
  try {
    console.log("🚀 Incoming request");

    if (req.method !== "POST") {
      console.log("❌ Invalid method");
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Parse JSON body safely
    let address = "";
    let hcaptchaToken = "";
    try {
      const parsed = JSON.parse(req.body);
      address = parsed.address;
      hcaptchaToken = parsed.hcaptchaToken;
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      return res.status(400).json({ message: "Invalid request body" });
    }

    if (!ethers.utils.isAddress(address)) {
      console.log("❌ Invalid address");
      return res.status(400).json({ message: "Invalid Address" });
    }

    const verified = await verify(
      process.env.HCAPTCHA_SECRET as string,
      hcaptchaToken
    );
    if (!verified.success) {
      console.log("❌ Invalid captcha");
      return res.status(401).json({ message: "Invalid Captcha" });
    }

    const ip = getClientIp(req);
    console.log(`🌐 IP: ${ip}`);
    const ipKey = `ip:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const cooldownHours = parseInt(process.env.COOLDOWN_HOURS || "24");
    const cooldownSeconds = cooldownHours * 60 * 60;

    // Check IP cooldown
    const ipCooldown = await redis.get(ipKey);
    if (ipCooldown) {
      const remaining = parseInt(ipCooldown) + cooldownSeconds - now;
      const minutes = Math.ceil(remaining / 60);
      console.log(`⏱️ IP rate limited: ${minutes}m remaining`);
      return res
        .status(429)
        .json({ message: `Please wait ${minutes} minutes before requesting again (IP).` });
    }

    // Check wallet cooldown
    const canReceive = await canRecieve(address);
    if (!canReceive.success) {
      console.log("⏱️ Wallet cooldown:", canReceive.message);
      return res.status(429).json({ message: canReceive.message });
    }

    const transfer = await transferCoin(address);
    if (!transfer.success) {
      console.log("❌ Transfer failed:", transfer.message);
      return res.status(400).json({ message: transfer.message });
    }

    // Save cooldowns
    await redis.set(address, now);
    await redis.set(ipKey, now, "EX", cooldownSeconds);

    console.log("✅ Transfer success:", transfer.message);
    return res.status(200).json({ message: transfer.message });
  } catch (err: any) {
    console.error("🔥 Server Error:", err);
    return res.status(500).json({ message: "Server error occurred." });
  }
}
