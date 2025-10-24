import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CarouselItem } from "../../types";
import {
  getCarouselItems,
  addCarouselImage,
  deleteCarouselItem,
  ApiError,
} from "../../services/api";
import FileUpload from "../FileUpload";
import ConfirmDialog from "../ConfirmDialog";

const Carousel: React.FC = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const data = await getCarouselItems();
      setItems(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Karusel ma'lumotlarini yuklashda xatolik.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    try {
      const newItem = await addCarouselImage(file);
      setItems((prevItems) => [...prevItems, newItem]);
      toast.success("Rasm muvaffaqiyatli qo'shildi.");
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Rasmni yuklashda xatolik.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (itemId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Rasmni o'chirish",
      message: "Haqiqatan ham bu rasmni o'chirmoqchimisiz?",
      onConfirm: async () => {
        try {
          await deleteCarouselItem(itemId);
          setItems((prevItems) =>
            prevItems.filter((item) => item.id !== itemId)
          );
          toast.success("Rasm muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof ApiError
              ? err.message
              : "Rasmni o'chirishda xatolik.";
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
            Karusel rasmlari yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="m-0 text-2xl md:text-3xl text-gray-800">Karusel</h1>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 mb-6 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-xl md:text-2xl text-gray-800 font-semibold">
          Yangi rasm qo'shish
        </h2>
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          multiple={false}
          maxFiles={1}
          label={
            isUploading
              ? "Yuklanmoqda..."
              : "Rasmni bu yerga tashlang yoki tanlash uchun bosing"
          }
        />
        {isUploading && (
          <p className="mt-2 text-teal-700 text-sm md:text-base">
            Uploading, please wait...
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm md:text-base">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden group border border-gray-200"
          >
            <img
              src={item.file}
              alt="Carousel item"
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg border-none cursor-pointer font-semibold transition-transform duration-200 hover:scale-105"
              >
                Oʻchirish
              </button>
            </div>
          </div>
        ))}
      </div>

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

export default Carousel;
