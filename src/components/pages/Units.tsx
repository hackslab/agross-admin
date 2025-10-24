import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Unit } from "../../types";
import UnitModal from "../modals/UnitModal";
import ConfirmDialog from "../ConfirmDialog";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../../services/api";

const Units: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>();

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
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Birliklarni yuklashda xatolik.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUnit = async (unitData: Partial<Unit>) => {
    try {
      if (editingUnit) {
        const updated = await updateUnit(editingUnit.id, {
          name: unitData.name!,
        });
        setUnits(units.map((u) => (u.id === editingUnit.id ? updated : u)));
        toast.success("Birlik muvaffaqiyatli yangilandi.");
      } else {
        const newUnit = await createUnit({ name: unitData.name! });
        setUnits([...units, newUnit]);
        toast.success("Birlik muvaffaqiyatli yaratildi.");
      }
      setIsModalOpen(false);
      setEditingUnit(undefined);
      return; // Return void to satisfy onSave prop type
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Birlikni saqlashda xatolik.";
      toast.error(errorMessage);
      throw err; // Re-throw to be caught by modal
    }
  };

  const handleDeleteUnit = (unit: Unit) => {
    setConfirmDialog({
      isOpen: true,
      title: "Birlikni o'chirish",
      message: `Haqiqatan ham "${unit.name}" birligini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        try {
          await deleteUnit(unit.id);
          setUnits(units.filter((u) => u.id !== unit.id));
          toast.success("Birlik muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Birlikni o'chirishda xatolik.";
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
            Birliklar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:items-start max-md:gap-4">
        <h1 className="m-0 text-3xl text-gray-800">O'lchov birliklari</h1>
        <button
          className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold max-md:w-full"
          onClick={() => {
            setEditingUnit(undefined);
            setIsModalOpen(true);
          }}
        >
          Birlik qo'shish
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
              {units.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    {unit.name}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                    <div className="flex gap-2 whitespace-nowrap">
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-teal-700 text-white text-xs md:text-sm font-semibold transition-all duration-200 hover:bg-teal-800"
                        onClick={() => {
                          setEditingUnit(unit);
                          setIsModalOpen(true);
                        }}
                      >
                        Tahrirlash
                      </button>
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-red-600 text-white text-xs md:text-sm font-semibold transition-all duration-200 hover:bg-red-700"
                        onClick={() => handleDeleteUnit(unit)}
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

      <UnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUnit}
        unit={editingUnit}
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

export default Units;
