import { ethers } from "ethers";
import wallet from "./wallet";

type TransferCoin = {
  success: boolean;
  message: string;
};

export default async function transferCoin(address: string): Promise<TransferCoin> {
  try {
    const amount = process.env.VALUE || "0.1"; // default fallback
    const provider = wallet.provider;

    // ✅ Ambil nonce terbaru dari provider
    const nonce = await provider.getTransactionCount(wallet.address, "pending");

    // ✅ Kirim tx manual dengan nonce dan gas limit
    const tx = {
      to: address,
      value: ethers.utils.parseEther(amount),
      nonce, // gunakan nonce yang tepat
      gasLimit: 21000, // default tx ETH
    };

    const transaction = await wallet.sendTransaction(tx);

    return {
      success: true,
      message: transaction.hash,
    };
  } catch (error: any) {
    console.error("Faucet error:", error);
    return {
      success: false,
      message: error.message || "Unable to Send Transaction",
    };
  }
}
