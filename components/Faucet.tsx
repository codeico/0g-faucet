import { useState } from "react";
import { FormEvent } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

export default function Faucet() {
  const [isDisabled, setIsDisabled] = useState(true);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerificationSuccess = async (token: string) => {
    setHcaptchaToken(token);
    setIsDisabled(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDisabled(true);

    const form = event.currentTarget;
    const address = form.address.value.trim();
    const honey = form.honey.value; // honeypot field

    // Honeypot check (bot biasanya mengisi ini)
    if (honey) {
      setErrorMessage("Bot detected.");
      return;
    }

    // Simple client-side validation
    if (!address.startsWith("0x") || address.length !== 42) {
      setErrorMessage("Invalid wallet address.");
      return;
    }

    try {
      const response = await fetch("/api/proxy-faucet", {
        method: "POST",
        body: JSON.stringify({
          address,
          hcaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.status !== 200) {
        setErrorMessage(data.message);
      } else {
        setSuccessMessage(data.message);
      }
    } catch (err) {
      setErrorMessage("Network error. Try again later.");
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-[#1c212e] rounded-2xl shadow-lg overflow-hidden">
            <div className="pt-10 pb-6 px-6 text-center">
              <img
                className="h-14 mx-auto mb-3"
                src="0g.png"
                alt="BANGCODE | 0G Testnet Faucet"
              />
              <h2 className="text-2xl font-bold text-[#64B6AC]">
                BANGCODE | 0G Testnet Faucet
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Request tokens for the 0G testnet
              </p>
            </div>

            <div className="bg-[#232836] mx-5 mb-5 p-3 rounded-lg border-l-4 border-[#FFB800] text-sm text-gray-300">
              <p>⚠️ You can request 0.5 0G token every 12 hours per address.</p>
            </div>

            <form className="px-6 pb-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                  Wallet Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  placeholder="0xf317cD3dEf951c197678E4596561B1C4c3F049B3"
                  className="w-full rounded-md border border-gray-600 bg-[#232836] px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-[#64B6AC] focus:ring-1 focus:ring-[#64B6AC] outline-none text-sm"
                />
                {/* Honeypot field (invisible for real users) */}
                <input
                  type="text"
                  name="honey"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="flex justify-center bg-[#232836] p-3 rounded-md">
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
                  onVerify={handleVerificationSuccess}
                />
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full bg-[#5170FF] text-white text-sm font-semibold py-2 rounded-md hover:bg-[#4060EE] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  🚀 Request Tokens
                </button>

                <a
                  href="https://0g.exploreme.pro/validators/0gvaloper145v6t9jkq2xgj56jt85g9d3ur36a6cse7a6fxn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-block text-center bg-green-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-green-700 transition"
                >
                  🔗 Staking A0GI
                </a>
                <a
                  href="https://test.zer0.exchange/swap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-block text-center bg-pink-500 text-white text-sm font-semibold py-2 rounded-md hover:bg-pink-600 transition"
                >
                  🔄 Swap
                </a>
              </div>
            </form>
          </div>

          <p className="text-center text-lg font-bold text-black">
            One request per address every 24 hours
          </p>
        </div>
      </div>

      <SuccessModal message={successMessage} />
      <ErrorModal message={errorMessage} />
    </>
  );
}
