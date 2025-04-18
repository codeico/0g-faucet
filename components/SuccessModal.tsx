import { useEffect, useState } from "react";

type Props = {
  message: string;
};

export default function SuccessModal(props: Props) {
  const { message } = props;
  const [show, setShow] = useState(!!message);

  useEffect(() => {
    setShow(!!message);
  }, [message]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e1e2f] rounded-2xl shadow-xl p-6 w-[360px] text-center relative">
        {/* Checkmark icon */}
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-green-600/10">
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Text content */}
        <h3 className="text-white text-lg font-semibold mb-2">
          Transaction Successful
        </h3>

        {/* Transaction Hash */}
        <div className="mt-3">
          <p className="text-sm text-gray-300 break-words">Transaction Hash:</p>
          <p className="mt-1 text-xs font-mono text-[#8FD1C8] break-all bg-[#232836] p-3 rounded-lg">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={() => setShow(false)}
            type="button"
            className="inline-flex w-full justify-center rounded-lg border border-transparent bg-[#5170FF] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#4060EE] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/50 transition-all duration-200 ease-in-out sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
