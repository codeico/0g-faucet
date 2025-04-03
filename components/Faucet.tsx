import { useState } from "react";
import { FormEvent } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import { motion } from "framer-motion";
import { FaEthereum } from "react-icons/fa";

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
      body: JSON.stringify({ address: event.currentTarget.address.value, hcaptchaToken }),
    });
    
    const data = await response.json();
    if (response.status !== 200) return setErrorMessage(data.message);
    setSuccessMessage(data.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <motion.div 
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <FaEthereum className="mx-auto text-blue-600" size={50} />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Testnet Faucet</h2>
          <p className="mt-2 text-sm text-gray-600">
            <a
              href="https://github.com/orgs/0xDeploy/repositories"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Open Source
            </a>
          </p>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              id="address"
              name="address"
              type="text"
              required
              className="block w-full rounded-xl border border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="0xdD4c825203f97984e7867F11eeCc813A036089D1"
            />
          </div>
          <div className="flex justify-center">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string}
              onVerify={(token, ekey) => handleVerificationSuccess(token, ekey)}
            />
          </div>
          <motion.button
            disabled={isDisabled}
            type="submit"
            className="w-full rounded-xl bg-blue-600 p-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            whileHover={{ scale: isDisabled ? 1 : 1.05 }}
          >
            Request Funds
          </motion.button>
        </form>
      </motion.div>
      <SuccessModal message={successMessage} />
      <ErrorModal message={errorMessage} />
    </div>
  );
}
