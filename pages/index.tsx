import Head from "next/head";
import Faucet from "../components/Faucet";

export default function Home() {
  return (
    <>
      <Head>
        <title>BANGCODE | 0G Testnet Faucet</title>
        <meta name="title" content="BANGCODE | 0G Testnet Faucet" />
        <meta name="description" content="Discover how to utilize the 0G Newton Testnet A0GI Faucet to earn free coins and become part of the 0G Newton Testnet network. Explore the functionality of this faucet and initiate a risk-free environment for experimentation and learning." />
        <meta name="keywords" content="0G Newton Testnet A0GI Faucet, A0GI, 0G Newton Testnet network, testnet, crypto, faucet, get tokens, free faucet, web3" />
        <meta name="robots" content="index, follow" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="1 days" />
        <meta name="author" content="BANGCODE" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/0g.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body className="bg-[#151923] text-white font-sans">
        <main>
          <Faucet />
        </main>
      </body>
    </>
  );
}
