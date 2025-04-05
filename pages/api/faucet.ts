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
  res.setHeader("Content-Type", "application/json"); // Force JSON for all responses

  try {
    const { address, hcaptchaToken } = JSON.parse(req.body);

    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ message: "Invalid Address" });
    }

    const verified = await verify(process.env.HCAPTCHA_SECRET as string, hcaptchaToken);
    if (!verified.success) {
      return res.status(401).json({ message: "Invalid Captcha" });
    }

    const ip = getClientIp(req);
    const ipKey = `ip:${ip}`;
    const ipCooldownTimestamp = await redis.get(ipKey);
    const now = Math.floor(Date.now() / 1000);
    const cooldownHours = parseInt(process.env.COOLDOWN_HOURS as string);
    const cooldownSeconds = cooldownHours * 60 * 60;

    if (ipCooldownTimestamp) {
      const timeLeftSeconds = parseInt(ipCooldownTimestamp) + cooldownSeconds - now;
      if (timeLeftSeconds > 0) {
        const minutes = Math.ceil(timeLeftSeconds / 60);
        return res
          .status(429)
          .json({ message: `Please wait ${minutes} minute(s) before requesting again from this IP.` });
      }
    }

    const recieved = await canRecieve(address);
    if (!recieved.success) {
      return res.status(429).json({ message: recieved.message });
    }

    const transfer = await transferCoin(address);
    if (!transfer.success) {
      return res.status(500).json({ message: transfer.message });
    }

    await redis.set(address, now);
    await redis.set(ipKey, now, "EX", cooldownSeconds);

    return res.status(200).json({ message: transfer.message });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ message: "Server error occurred." });
  }
}
