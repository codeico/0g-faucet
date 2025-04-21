import redis from "./redis";

type CanRecieve = {
  success: boolean;
  message: string;
};

export default async function canRecieve(address: string): Promise<CanRecieve> {
  const lastRecieve = await redis.get(address);
  if (lastRecieve === null) return { success: true, message: "🚢" };

  const now = Math.floor(Date.now() / 1000);

  // ✅ Fallback default ke 24 jam kalau ENV tidak tersedia
  const cooldownSeconds = (parseInt(process.env.COOLDOWN_HOURS || "24") || 24) * 3600;

  const timePassed = now - parseInt(lastRecieve);
  const timeLeft = cooldownSeconds - timePassed;

  if (timeLeft <= 0) return { success: true, message: "🚢" };

  // ⏱️ Friendly time left display
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.ceil((timeLeft % 3600) / 60);

  const timeMsg =
    hours > 0
      ? `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`
      : `${minutes} minute${minutes !== 1 ? "s" : ""}`;

  return {
    success: false,
    message: `Please wait ${timeMsg} before requesting again.`,
  };
}
