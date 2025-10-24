import React, { useState, useEffect } from "react";
import type { Unit } from "../../types";
import { ApiError } from "../../services/api";

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Partial<Unit>) => Promise<Unit | void>;
  unit?: Unit;
}

const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unit,
}) => {
  const [name, setName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(unit?.name || "");
      setValidationErrors([]);
    }
  }, [unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      await onSave({ name });
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError()) {
        setValidationErrors(err.getValidationErrors());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1600] p-4" // z-index higher than ProductModal
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[500px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="m-0 text-gray-800 text-xl md:text-2xl">
            {unit ? "Birlikni tahrirlash" : "Yangi birlik qo'shish"}
          </h2>
          <button
            className="bg-transparent border-none text-gray-600 text-3xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center transition-colors duration-200 hover:text-gray-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className="text-pink-600 text-sm mb-2 last:mb-0"
                >
                  {error}
                </div>
              ))}
            </div>
          )}
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Nomi *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={"Masalan: kg, dona, litr"}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-gray-700"
              onClick={onClose}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saqlanmoqda..."
                : unit
                ? "Yangilash"
                : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitModal;
