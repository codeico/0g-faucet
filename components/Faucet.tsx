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

  const handleVerificationSuccess = async (token: string, ekey: string) => {
    // set hcaptcha token
    setHcaptchaToken(token);
    // enable submit button
    setIsDisabled(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // disable submit button
    setIsDisabled(true);
    // send request to faucet
    const response = await fetch("/api/faucet", {
      method: "POST",
      body: JSON.stringify({ address: event.currentTarget.address.value, hcaptchaToken }),
    });
    // parse response
    const data = await response.json();
    // if error
    if (response.status != 200) return setErrorMessage(data.message);
    // success!
    setSuccessMessage(data.message);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#151923]">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-[#1c212e] rounded-xl shadow-2xl overflow-hidden mx-4">
            <div>
              <img className="mx-auto h-12 w-auto" src="0g.png" alt="BANGCODE 0G Testnet Faucet" />
              <h2 className="text-center text-3xl font-bold text-[#64B6AC]">BANGCODE 0G Testnet Faucet</h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Request tokens for the 0G testnet network
              </p>
            </div>
            <div className="bg-[#232836] p-4 mx-6 mb-6 rounded-lg border-l-4 border-[#FFB800]">
              <div className="flex"><div className="flex-shrink-0"><svg className="h-5 w-5 text-[#FFB800]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div>
                <div className="ml-3"><h3 className="text-sm font-medium text-[#FFB800]">
                  Faucet Limit</h3><div className="mt-1 text-xs text-gray-400">
                    You can request 1 0G token every 24 hours per address.</div>
                </div>
              </div>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="-space-y-px rounded-md shadow-sm">
                <div>
                  <input id="address" name="address" type="string" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="0xdD4c825203f97984e7867F11eeCc813A036089D1" />
                </div>
              </div>
              <div className="flex justify-center">
                <HCaptcha sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string} onVerify={(token, ekey) => handleVerificationSuccess(token, ekey)} />
              </div>
              <div>
                <button disabled={isDisabled} type="submit" className="group relative flex w-full justify-center rounded-lg border border-transparent bg-[#5170FF] py-3 px-4 text-sm font-semibold text-white hover:bg-[#4060EE] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/50 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed mb-2"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="h-5 w-5 text-[#B4C6FF] group-hover:text-[#D1DCFF]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path></svg></span>
                  Request Tokens
                </button>
              </div>
            </form>
          </div>
        </div>
      </div >
      <SuccessModal message={successMessage} />
      <ErrorModal message={errorMessage} />
    </>
  );
}
