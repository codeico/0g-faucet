import redis from "./redis";

type CanRecieve = {
  success: boolean;
  message: string;
};

export default async function canRecieve(address: string): Promise<CanRecieve> {
  const lastRecieve = await redis.get(address);
  if (lastRecieve === null) return { success: true, message: "✅ Eligible to receive." };

  const now = Math.floor(Date.now() / 1000);
  const cooldown = parseInt(process.env.COOLDOWN_HOURS as string) * 60 * 60;

  if (now >= parseInt(lastRecieve) + cooldown) {
    return { success: true, message: "✅ Eligible to receive." };
  }

  const timeLeft = Math.ceil((parseInt(lastRecieve) + cooldown - now) / 60 / 60);
  return {
    success: false,
    message: `Please wait ${timeLeft} hours before requesting again.`,
  };
}
