import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-2000 animate-[fadeIn_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-4 md:p-8 max-w-[450px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-center animate-[slideUp_0.3s_ease] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 mx-auto text-red-600 animate-[bounce_0.5s_ease]" />
        <h2 className="m-0 mb-3 md:mb-4 text-gray-800 text-xl md:text-2xl font-semibold">
          {title}
        </h2>
        <p className="m-0 mb-6 md:mb-8 text-gray-600 text-sm md:text-base leading-relaxed">
          {message}
        </p>
        <div className="flex gap-4 justify-center md:flex-row max-md:flex-col">
          <button
            className="px-8 py-3.5 rounded-lg border-none cursor-pointer font-semibold text-base transition-all duration-200 min-w-[120px] bg-gray-600 text-white hover:bg-gray-700 hover:-translate-y-0.5 max-md:w-full"
            onClick={onCancel}
          >
            {cancelText || "Bekor qilish"}
          </button>
          <button
            className="px-8 py-3.5 rounded-lg border-none cursor-pointer font-semibold text-base transition-all duration-200 min-w-[120px] bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(220,53,69,0.4)] max-md:w-full"
            onClick={onConfirm}
          >
            {confirmText || "Oʻchirish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
