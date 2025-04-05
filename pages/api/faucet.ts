// pages/api/faucet.ts
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
  const { address, hcaptchaToken } = JSON.parse(req.body);

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

  // Check IP cooldown
  const ipKey = `ip:${ip}`;
  const ipCooldown = await redis.get(ipKey);
  if (ipCooldown) {
    return res
      .status(429)
      .json({ message: "Too many requests from this IP. Try again later." });
  }

  // Check wallet cooldown
  const recieved = await canRecieve(address);
  if (!recieved.success) {
    return res.status(400).json({ message: recieved.message });
  }

  const transfer = await transferCoin(address);
  if (!transfer.success) {
    return res.status(400).json({ message: transfer.message });
  }

  // Store cooldowns
  const cooldownHours = parseInt(process.env.COOLDOWN_HOURS as string);
  await redis.set(address, Math.floor(Date.now() / 1000));
  await redis.set(ipKey, "1", "EX", cooldownHours * 60 * 60);

  return res.status(200).json({ message: transfer.message });
}
