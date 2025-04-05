import redis from "./redis";

type CanRecieve = {
  success: boolean;
  message: string;
};

export default async function canRecieve(address: string): Promise<CanRecieve> {
  const lastRecieve = await redis.get(address);
  if (lastRecieve === null)
    return { success: true, message: "You can request!" };

  const now = Math.floor(Date.now() / 1000);
  const cooldown =
    parseInt(process.env.COOLDOWN_HOURS || "24") * 60 * 60;

  const remaining = parseInt(lastRecieve) + cooldown - now;

  if (remaining <= 0) return { success: true, message: "You can request!" };

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.ceil((remaining % 3600) / 60);

  const timeLeft =
    hours > 0
      ? `${hours} hour(s) and ${minutes} minute(s)`
      : `${minutes} minute(s)`;

  return {
    success: false,
    message: `Please wait ${timeLeft} before requesting again with this wallet address.`,
  };
}
