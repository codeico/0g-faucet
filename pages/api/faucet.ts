import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

// Cooldown period for IP in seconds (24 hours)
const IP_COOLDOWN_SECONDS = parseInt(process.env.IP_COOLDOWN_SECONDS || "86400");

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  try {
    const { address, hcaptchaToken } = JSON.parse(req.body);

    // Get user IP address
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;

    if (!ip) {
      return res.status(400).json({ message: "Unable to read IP address." });
    }

    const ipKey = `cooldown_ip_${ip}`;
    const ipTTL = await redis.ttl(ipKey);

    if (ipTTL > 0) {
      const hours = Math.floor(ipTTL / 3600);
      const minutes = Math.floor((ipTTL % 3600) / 60);
      const seconds = ipTTL % 60;

      return res.status(429).json({
        message: `This IP has already claimed tokens. Please wait ${hours}h ${minutes}m ${seconds}s before trying again.`,
      });
    }

    // Validate wallet address
    const isAddress = ethers.utils.isAddress(address);
    if (!isAddress) return res.status(400).json({ message: "Invalid wallet address." });

    // Verify hCaptcha token
    const verified = await verify(process.env.HCAPTCHA_SECRET as string, hcaptchaToken);
    if (!verified.success) return res.status(401).json({ message: "Captcha verification failed." });

    // Check cooldown for wallet address
    const recieved = await canRecieve(address);
    if (!recieved.success) return res.status(400).json({ message: recieved.message });

    // Send tokens
    const transfer = await transferCoin(address);
    if (!transfer.success) return res.status(400).json({ message: transfer.message });

    // Store cooldowns for both wallet and IP
    await redis.set(address, Math.floor(Date.now() / 1000));
    await redis.set(ipKey, "1", "EX", IP_COOLDOWN_SECONDS);

    return res.status(200).json({ message: transfer.message });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}
