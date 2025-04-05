import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  // Parse request body
  const { address, hcaptchaToken } = JSON.parse(req.body);

  // Get IP Address
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress;

  // Validate address
  const isAddress = ethers.utils.isAddress(address);
  if (!isAddress) return res.status(400).json({ message: "Invalid Address" });

  // Verify hCaptcha
  const verified = await verify(process.env.HCAPTCHA_SECRET as string, hcaptchaToken);
  if (!verified.success) return res.status(401).json({ message: "Invalid Captcha" });

  // Check cooldown by wallet address
  const addressCooldown = await canRecieve(address);
  if (!addressCooldown.success) return res.status(400).json({ message: addressCooldown.message });

  // Check cooldown by IP
  const lastIPRequest = await redis.get(`ip:${ip}`);
  if (lastIPRequest !== null) {
    const now = Math.floor(Date.now() / 1000);
    const cooldown = parseInt(process.env.COOLDOWN_HOURS as string) * 60 * 60;

    if (now < parseInt(lastIPRequest) + cooldown) {
      const timeLeft = Math.ceil((parseInt(lastIPRequest) + cooldown - now) / 60 / 60);
      return res.status(400).json({
        message: `This IP has requested recently. Please wait ${timeLeft} hours.`,
      });
    }
  }

  // Transfer token
  const transfer = await transferCoin(address);
  if (!transfer.success) return res.status(400).json({ message: transfer.message });

  // Save last request time for both address and IP
  const timestamp = Math.floor(Date.now() / 1000);
  await redis.set(address, timestamp);
  await redis.set(`ip:${ip}`, timestamp);

  return res.status(200).json({ message: transfer.message });
}
