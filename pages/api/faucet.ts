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
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // ✅ Gunakan req.body langsung (tidak perlu JSON.parse)
    const { address, hcaptchaToken } = req.body;

    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ message: "Invalid Address" });
    }

    const verified = await verify(
      process.env.HCAPTCHA_SECRET as string,
      hcaptchaToken
    );
    if (!verified.success) {
      return res.status(401).json({ message: "Invalid Captcha" });
    }

    const ip = getClientIp(req);
    const ipKey = `ip:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const cooldownHours = parseInt(process.env.COOLDOWN_HOURS || "24");
    const cooldownSeconds = cooldownHours * 60 * 60;

    // Cek cooldown IP
    const ipCooldown = await redis.get(ipKey);
    if (ipCooldown) {
      const remaining = parseInt(ipCooldown) + cooldownSeconds - now;
      const minutes = Math.ceil(remaining / 60);
      return res
        .status(429)
        .json({ message: `Please wait ${minutes} minutes before requesting again (IP).` });
    }

    // Cek cooldown wallet
    const canReceive = await canRecieve(address);
    if (!canReceive.success) {
      return res.status(429).json({ message: canReceive.message });
    }

    const transfer = await transferCoin(address);
    if (!transfer.success) {
      return res.status(400).json({ message: transfer.message });
    }

    // Set redis cooldown
    await redis.set(address, now);
    await redis.set(ipKey, now, "EX", cooldownSeconds);

    return res.status(200).json({ message: transfer.message });
  } catch (err: any) {
    console.error("🔥 Server Error:", err);
    return res.status(500).json({ message: "Server error occurred." });
  }
}
