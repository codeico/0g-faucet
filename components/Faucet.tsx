import { useState, FormEvent } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

export default function Faucet() {
  const [isDisabled, setIsDisabled] = useState(true);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerificationSuccess = async (token: string, ekey: string) => {
    setHcaptchaToken(token);
    setIsDisabled(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDisabled(true);

    const response = await fetch("/api/faucet", {
      method: "POST",
      body: JSON.stringify({
        address: event.currentTarget.address.value,
        hcaptchaToken,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) return setErrorMessage(data.message);
    setSuccessMessage(data.message);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#151923] px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="bg-[#1c212e] rounded-xl shadow-2xl overflow-hidden">
            <div className="pt-10 pb-6 px-8 text-center">
              <img
                className="h-16 mx-auto mb-4"
                src="0g.png"
                alt="BANGCODE | 0G Testnet Faucet"
              />
              <h2 className="text-3xl font-bold text-[#64B6AC]">
                BANGCODE | 0G Testnet Faucet
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Request tokens for the 0G testnet network
              </p>
            </div>

            <div className="bg-[#232836] mx-6 mb-6 p-4 rounded-lg border-l-4 border-[#FFB800]">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-[#FFB800] mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3 text-sm">
                  <h3 className="font-medium text-[#FFB800]">Faucet Limit</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    You can request 1 0G token every 24 hours per address.
                  </p>
                </div>
              </div>
            </div>

            <form className="px-6 pb-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Wallet Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  placeholder="0xdD4c825203f97984e7867F11eeCc813A036089D1"
                  className="w-full rounded-lg border border-gray-600 bg-[#232836] px-4 py-3 text-gray-200 placeholder-gray-500 focus:border-[#64B6AC] focus:outline-none focus:ring-2 focus:ring-[#64B6AC]/30 sm:text-sm"
                />
              </div>

              <div className="bg-[#232836] p-4 rounded-lg">
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
                  onVerify={handleVerificationSuccess}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#5170FF] py-3 px-4 text-sm font-semibold text-white hover:bg-[#4060EE] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/50 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5 text-[#B4C6FF] group-hover:text-[#D1DCFF]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Request Tokens
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500">
            Each address can request tokens once every 24 hours
          </p>
        </div>
      </div>

      <SuccessModal message={successMessage} />
      <ErrorModal message={errorMessage} />
    </>
  );
}
