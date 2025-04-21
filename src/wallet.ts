import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ✅ Validasi ENV penting
if (!RPC_URL) {
  throw new Error("❌ RPC_URL is not set in environment variables.");
}

if (!PRIVATE_KEY) {
  throw new Error("❌ PRIVATE_KEY is not set in environment variables.");
}

// ✅ Inisialisasi provider dan wallet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`🔑 Faucet wallet initialized: ${wallet.address}`);

export default wallet;
