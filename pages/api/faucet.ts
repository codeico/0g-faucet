// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { verify } from "hcaptcha";
import canRecieve from "../../src/canRecieve";
import transferCoin from "../../src/transferCoin";
import redis from "../../src/redis";

type Message = {
  message: string;
};

// IP cooldown time in seconds (default 24 jam)
const IP_COOLDOWN_SECONDS = parseInt(process.env.IP_COOLDOWN_SECONDS || "86400");

export default async function handler(req: NextApiRequest, res: NextApiResponse<Message>) {
  const { address, hcaptchaToken } = JSON.parse(req.body);

  // ✅ Ambil IP address dari request
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;

  if (!ip) {
    return res.status(400).json({ message: "Gagal membaca IP address" });
  }

  const ipKey = `cooldown_ip_${ip}`;
  const ipCooldown = await redis.get(ipKey);
  if (ipCooldown) {
    return res.status(429).json({
      message: "Alamat IP ini sudah melakukan klaim. Harap tunggu sebelum mencoba lagi.",
    });
  }

  // ✅ Validasi alamat wallet
  const isAddress = ethers.utils.isAddress(address);
  if (!isAddress) return res.status(400).json({ message: "Invalid Address" });

  // ✅ Verifikasi captcha
  const verified = await verify(process.env.HCAPTCHA_SECRET as string, hcaptchaToken);
  if (!verified.success) return res.status(401).json({ message: "Invalid Captcha" });

  // ✅ Cek cooldown berdasarkan wallet
  const recieved = await canRecieve(address);
  if (!recieved.success) return res.status(400).json({ message: recieved.message });

  // ✅ Lakukan transfer
  const transfer = await transferCoin(address);
  if (!transfer.success) return res.status(400).json({ message: transfer.message });

  // ✅ Simpan waktu klaim berdasarkan address & IP
  await redis.set(address, Math.floor(Date.now() / 1000));
  await redis.set(ipKey, "1", "EX", IP_COOLDOWN_SECONDS);

  return res.status(200).json({ message: transfer.message });
}
