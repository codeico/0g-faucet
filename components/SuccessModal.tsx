import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
        {/* Close icon (optional) */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

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
        <p className="text-gray-400 text-sm mb-2">Transaction Hash:</p>
        <p className="text-teal-300 text-sm break-words font-mono mb-6">
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={() => setShow(false)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-5 py-2 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
