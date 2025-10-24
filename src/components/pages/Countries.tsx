import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Country } from "../../types";
import CountryModal from "../modals/CountryModal";
import ConfirmDialog from "../ConfirmDialog";
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "../../services/api";

const Countries: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | undefined>();

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCountries();
      setCountries(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Davlatlarni yuklashda xatolik.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCountry = async (name: string) => {
    try {
      if (editingCountry) {
        const updated = await updateCountry(editingCountry.id, name);
        setCountries(
          countries.map((c) => (c.id === editingCountry.id ? updated : c))
        );
        toast.success("Davlat muvaffaqiyatli yangilandi.");
      } else {
        const newCountry = await createCountry(name);
        setCountries([...countries, newCountry]);
        toast.success("Davlat muvaffaqiyatli yaratildi.");
      }
      setIsModalOpen(false);
      setEditingCountry(undefined);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Davlatni saqlashda xatolik.";
      toast.error(errorMessage);
      throw err; // Re-throw to be caught by modal
    }
  };

  const handleDeleteCountry = (country: Country) => {
    setConfirmDialog({
      isOpen: true,
      title: "Davlatni o'chirish",
      message: `Haqiqatan ham "${country.name}" davlatini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        try {
          await deleteCountry(country.id);
          setCountries(countries.filter((c) => c.id !== country.id));
          toast.success("Davlat muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Davlatni o'chirishda xatolik.";
          toast.error(errorMessage);
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="border-4 border-teal-700/10 border-l-teal-700 rounded-full w-[50px] h-[50px] animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base m-0">
            Davlatlar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:items-start max-md:gap-4">
        <h1 className="m-0 text-3xl text-gray-800">Davlatlar</h1>
        <button
          className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold max-md:w-full"
          onClick={() => {
            setEditingCountry(undefined);
            setIsModalOpen(true);
          }}
        >
          Davlat qo'shish
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-100 text-red-700 rounded text-sm md:text-base">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800">
                  Nomi
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800">
                  Harakatlar
                </th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country) => (
                <tr
                  key={country.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    {country.name}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                    <div className="flex gap-2 whitespace-nowrap">
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-teal-700 text-white text-xs md:text-sm font-semibold transition-all duration-200 hover:bg-teal-800"
                        onClick={() => {
                          setEditingCountry(country);
                          setIsModalOpen(true);
                        }}
                      >
                        Tahrirlash
                      </button>
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-red-600 text-white text-xs md:text-sm font-semibold transition-all duration-200 hover:bg-red-700"
                        onClick={() => handleDeleteCountry(country)}
                      >
                        Oʻchirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CountryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCountry}
        country={editingCountry}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Countries;
