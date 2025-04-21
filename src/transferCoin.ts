import { ethers } from "ethers";
import wallet from "./wallet";

type TransferCoin = {
  success: boolean;
  message: string;
};

export default async function transferCoin(address: string): Promise<TransferCoin> {
  try {
    const amount = process.env.VALUE || "0.1"; // fallback ke 0.1 ETH jika VALUE tidak di-set
    const provider = wallet.provider;

    // ✅ Ambil nonce terbaru dari jaringan (gunakan "pending" agar tidak bentrok)
    const nonce = await provider.getTransactionCount(wallet.address, "pending");

    // ✅ Ambil gasPrice dari jaringan
    const gasPrice = await provider.getGasPrice();

    // ✅ Estimasi gas limit (opsional, lebih aman)
    const estimatedGas = await provider.estimateGas({
      to: address,
      value: ethers.utils.parseEther(amount),
    });

    // ✅ Siapkan transaksi
    const tx = {
      to: address,
      value: ethers.utils.parseEther(amount),
      nonce,
      gasLimit: estimatedGas,
      gasPrice,
    };

    // ✅ Kirim transaksi
    const transaction = await wallet.sendTransaction(tx);

    console.log(`✅ Transaction sent! Hash: ${transaction.hash}`);

    return {
      success: true,
      message: transaction.hash,
    };
  } catch (error: any) {
    console.error("❌ Faucet error:", error);

    let message = "Unable to send transaction";
    if (error.code === "NONCE_EXPIRED" || error.message?.includes("nonce")) {
      message = "Transaction failed due to invalid nonce. Please try again shortly.";
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      message,
    };
  }
}
