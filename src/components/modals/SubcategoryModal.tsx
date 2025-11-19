import React, { useState, useEffect } from "react";
import type { Subcategory, Category } from "../../types";
import { ApiError } from "../../services/api";

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subcategory: Partial<Subcategory>) => void;
  subcategory?: Subcategory;
  categories: Category[];
}

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subcategory,
  categories,
}) => {
  const [formData, setFormData] = useState({
    categoryId: "",
    name_uz: "",
    name_en: "",
    name_ru: "",
    name_kz: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLang, setActiveLang] = useState<"uz" | "en" | "ru" | "kz">("uz");

  useEffect(() => {
    if (subcategory) {
      setFormData({
        categoryId: subcategory.categoryId,
        name_uz: subcategory.name_uz || "",
        name_en: subcategory.name_en || "",
        name_ru: subcategory.name_ru || "",
        name_kz: subcategory.name_kz || "",
      });
    } else {
      setFormData({
        categoryId: categories[0]?.id || "",
        name_uz: "",
        name_en: "",
        name_ru: "",
        name_kz: "",
      });
    }
    setValidationErrors([]);
    setActiveLang("uz");
  }, [subcategory, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      await onSave(formData);
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
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1600] p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="m-0 text-gray-800 text-xl md:text-2xl">
            {subcategory
              ? "Subkategoriyani tahrirlash"
              : "Yangi subkategoriya qo'shish"}
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
              Asosiy kategoriya *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_uz}
                </option>
              ))}
            </select>
          </div>
          <div className="flex border-b border-gray-200 mb-6">
            {(["uz", "en", "ru", "kz"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                className={`px-4 py-2 -mb-px border-b-2 font-semibold text-sm transition-colors duration-200 ${
                  activeLang === lang
                    ? "border-teal-700 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveLang(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Nomi ({activeLang.toUpperCase()}) *
            </label>
            <input
              type="text"
              value={formData[`name_${activeLang}`]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [`name_${activeLang}`]: e.target.value,
                })
              }
              required
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
              className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saqlanmoqda..."
                : subcategory
                ? "Yangilash"
                : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcategoryModal;
