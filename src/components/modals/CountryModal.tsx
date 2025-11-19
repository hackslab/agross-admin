import React, { useState, useEffect, useRef } from "react";
import type { Country } from "../../types";
import { ApiError } from "../../services/api";
import { countries_uz } from "../../data/countries_uz";
import {
  hasFlag,
  findCountrySuggestion,
  isValidUzbekCountryName,
} from "../../utils/countryUtils";

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  country?: Country;
}

const CountryModal: React.FC<CountryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  country,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(country?.name || "");
      setValidationErrors([]);
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  }, [country, isOpen]);

  // Click outside handler to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setValidationErrors([]);

    if (value.trim()) {
      const lowercasedValue = value.trim().toLowerCase();
      const filtered = countries_uz
        .filter((c) => c.name_uz.toLowerCase().startsWith(lowercasedValue))
        .map((c) => `${c.flag} ${c.name_uz}`);
      setSuggestions(filtered);
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!hasFlag(inputValue)) {
      const suggestion = findCountrySuggestion(inputValue);
      const errorMessage = suggestion
        ? `Iltimos, davlat nomini bayroq bilan kiriting. Masalan: ${suggestion}`
        : "Iltimos, davlat nomini bayroq bilan kiriting.";
      setValidationErrors([errorMessage]);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    // Extract only the country name for validation, removing the flag and leading space.
    const firstSpaceIndex = inputValue.indexOf(" ");
    const countryNameOnly =
      firstSpaceIndex > -1
        ? inputValue.substring(firstSpaceIndex + 1)
        : inputValue;

    if (!isValidUzbekCountryName(countryNameOnly)) {
      setValidationErrors(["Noto'g'ri davlat nomi."]);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave(inputValue);
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
        className="bg-white rounded-xl w-full max-w-[500px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="m-0 text-gray-800 text-xl md:text-2xl">
            {country ? "Davlatni tahrirlash" : "Yangi davlat qo'shish"}
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
          <div className="mb-6 relative" ref={wrapperRef}>
            <label className="block mb-2 text-gray-800 font-medium">
              Davlat nomi *
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() =>
                inputValue.trim() &&
                suggestions.length > 0 &&
                setIsSuggestionsVisible(true)
              }
              required
              autoComplete="off"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
            {isSuggestionsVisible && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
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
                : country
                ? "Yangilash"
                : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CountryModal;
