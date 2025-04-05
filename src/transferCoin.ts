import { ethers } from "ethers";
import wallet from "./wallet";

type TransferCoin = {
  success: boolean;
  message: string;
};

export default async function transferCoin(address: string): Promise<TransferCoin> {
  try {
    const amount = process.env.VALUE || "0.1";

    const transaction = await wallet.sendTransaction({
      to: address,
      value: ethers.utils.parseEther(amount),
    });

    return {
      success: true,
      message: transaction.hash,
    };
  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      message: error.message || "Unable to send transaction",
    };
  }
}
