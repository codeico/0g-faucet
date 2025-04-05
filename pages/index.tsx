import Head from "next/head";
import Faucet from "../components/Faucet";

export default function Home() {
  return (
    <>
      <Head>
        <title>BANGCODE | 0G Testnet Faucet</title>
        <meta name="description" content="BANGCODE | 0G Testnet Faucet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/0g.png" />
      </Head>
      <main>
        <Faucet />
      </main>
    </>
  );
}
