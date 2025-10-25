import React, { useState, useEffect } from "react";
import type {
  Product,
  Category,
  Subcategory,
  Unit,
  Country,
} from "../../types";
import {
  ApiError,
  getUnits,
  getCountries,
  createUnit,
  createCountry,
  createCategory,
  createSubcategory,
  getCategories as apiGetCategories,
  getSubcategories as apiGetSubcategories,
} from "../../services/api";
import { toast } from "sonner";
import FileUpload from "../FileUpload";
import DraggableFileCards from "../DraggableFileCards";
import type { FileCardItem } from "../DraggableFileCards";
import AutocompleteSelect from "../common/AutocompleteSelect";
import CategoryModal from "./CategoryModal";
import SubcategoryModal from "./SubcategoryModal";
import CountryModal from "./CountryModal";
import UnitModal from "./UnitModal";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    product: Partial<Product>,
    newMediaFiles: File[],
    allOrderedFiles: FileCardItem[]
  ) => void;
  product?: Product;
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
  subcategories: Subcategory[];
  onSubcategoriesUpdate: (subcategories: Subcategory[]) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  onCategoriesUpdate,
  subcategories,
  onSubcategoriesUpdate,
}) => {
  const [formData, setFormData] = useState({
    name_uz: "",
    name_en: "",
    name_ru: "",
    name_kz: "",
    description_uz: "",
    description_en: "",
    description_ru: "",
    description_kz: "",
    price: 0,
    categoryId: "",
    subcategoryId: "",
    countryId: "",
    structure_uz: "",
    structure_en: "",
    structure_ru: "",
    structure_kz: "",
    quantity: 0,
    unitId: "",
  });

  const [activeLang, setActiveLang] = useState<"uz" | "en" | "ru" | "kz">("uz");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified state for all files (both existing and new)
  const [allFiles, setAllFiles] = useState<FileCardItem[]>([]);
  // Keep track of new File objects separately for submission
  const [newFileObjects, setNewFileObjects] = useState<Map<string, File>>(
    new Map()
  );

  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // State for "quick create" modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // State to hold the name for the new item being created
  const [newItemName, setNewItemName] = useState("");

  const [allCategories, setAllCategories] = useState<Category[]>(categories);

  // Fetch units and countries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsData, countriesData] = await Promise.all([
          getUnits(),
          getCountries(),
        ]);
        setUnits(unitsData);
        setCountries(countriesData);
      } catch (err) {
        console.error("Failed to fetch units/countries:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setAllCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name_uz: product.name_uz,
        name_en: product.name_en,
        name_ru: product.name_ru,
        name_kz: product.name_kz,
        description_uz: product.description_uz,
        description_en: product.description_en,
        description_ru: product.description_ru,
        description_kz: product.description_kz,
        price: product.price,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        countryId: product.countryId || "",
        structure_uz: product.structure_uz || "",
        structure_en: product.structure_en || "",
        structure_ru: product.structure_ru || "",
        structure_kz: product.structure_kz || "",
        quantity: product.quantity,
        unitId: product.unitId || "",
      });

      // Convert existing files to FileCardItem format
      const existingFileCards: FileCardItem[] = [];

      // Backend returns all files in a single 'files' array
      if (product.files && product.files.length > 0) {
        console.log("📁 Loading existing files from backend:", product.files);
        product.files.forEach((file) => {
          existingFileCards.push({
            id: file.id,
            url: file.url,
            name:
              file.url.split("/").pop() || (file.isVideo ? "Video" : "Image"),
            isVideo: file.isVideo,
            isExisting: true,
          });
        });
      }

      console.log("✅ Total existing files loaded:", existingFileCards.length);
      setAllFiles(existingFileCards);
    } else {
      setFormData({
        name_uz: "",
        name_en: "",
        name_ru: "",
        name_kz: "",
        description_uz: "",
        description_en: "",
        description_ru: "",
        description_kz: "",
        price: 0,
        categoryId: categories[0]?.id || "",
        subcategoryId: "",
        countryId: "",
        structure_uz: "",
        structure_en: "",
        structure_ru: "",
        structure_kz: "",
        quantity: 0,
        unitId: units[0]?.id || "",
      });
      setAllFiles([]);
    }
    setNewFileObjects(new Map());
    setValidationErrors([]);
    setActiveLang("uz");
  }, [product, isOpen, categories, units]);

  useEffect(() => {
    if (formData.categoryId) {
      const filtered = subcategories.filter(
        (sub) => sub.categoryId === formData.categoryId
      );
      setFilteredSubcategories(filtered);
      if (!filtered.find((sub) => sub.id === formData.subcategoryId)) {
        setFormData((prev) => ({
          ...prev,
          subcategoryId: filtered[0]?.id || "",
        }));
      }
    }
  }, [formData.categoryId, formData.subcategoryId, subcategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Extract only new files (not existing ones) in their order
      const newFilesToSubmit: File[] = [];
      allFiles.forEach((fileCard) => {
        if (!fileCard.isExisting) {
          const fileObj = newFileObjects.get(fileCard.id);
          if (fileObj) {
            newFilesToSubmit.push(fileObj);
          }
        }
      });

      await onSave(formData, newFilesToSubmit, allFiles);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError()) {
        setValidationErrors(err.getValidationErrors());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaFiles = (files: File[]) => {
    const newFileCards: FileCardItem[] = files.map((file) => {
      const fileId = `new-${Date.now()}-${Math.random()}`;
      return {
        id: fileId,
        url: URL.createObjectURL(file),
        name: file.name,
        isVideo: file.type.startsWith("video/"),
        isExisting: false,
      };
    });

    // Add new files to the map
    const newMap = new Map(newFileObjects);
    files.forEach((file, index) => {
      newMap.set(newFileCards[index].id, file);
    });

    setNewFileObjects(newMap);
    setAllFiles((prev) => [...prev, ...newFileCards]);
  };

  const handleFileReorder = (reorderedFiles: FileCardItem[]) => {
    setAllFiles(reorderedFiles);
  };

  const handleFileRemove = (fileId: string) => {
    setAllFiles((prev) => prev.filter((f) => f.id !== fileId));

    // If it's a new file, also remove from the map
    if (newFileObjects.has(fileId)) {
      const newMap = new Map(newFileObjects);
      newMap.delete(fileId);
      setNewFileObjects(newMap);
    }
  };

  // --- Handlers for "Quick Create" Modals ---

  const handleCreateCategory = async (
    categoryData: Partial<Category>,
    imageFile?: File
  ) => {
    const payload = new FormData();
    Object.entries(categoryData).forEach(([key, value]) => {
      if (
        key !== "image" &&
        key !== "id" &&
        value !== null &&
        value !== undefined
      ) {
        payload.append(key, String(value));
      }
    });
    if (!categoryData.name_uz && newItemName) {
      payload.set("name_uz", newItemName);
    }

    if (imageFile) {
      payload.append("image", imageFile);
    }

    const newCategory = await createCategory(payload);
    const updatedCategories = await apiGetCategories();
    onCategoriesUpdate(updatedCategories); // Update parent state
    setAllCategories(updatedCategories);
    setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
    setIsCategoryModalOpen(false);
  };

  const handleCreateSubcategory = async (
    subcategoryData: Partial<Subcategory>
  ) => {
    const name = subcategoryData.name_uz || newItemName;
    const payload = {
      name_uz: name,
      name_en: name,
      name_ru: name,
      name_kz: name,
      categoryId: subcategoryData.categoryId || formData.categoryId,
    };
    if (!payload.categoryId) {
      toast.error("Iltimos, avval asosiy kategoriyani tanlang.");
      return;
    }
    const newSubcategory = await createSubcategory(payload);
    const updatedSubcategories = await apiGetSubcategories();
    onSubcategoriesUpdate(updatedSubcategories); // Update parent state
    setFormData((prev) => ({ ...prev, subcategoryId: newSubcategory.id }));
    setIsSubcategoryModalOpen(false);
  };

  const handleCreateCountry = async (name: string) => {
    const newCountry = await createCountry(name);
    const updatedCountries = await getCountries();
    setCountries(updatedCountries);
    setFormData((prev) => ({ ...prev, countryId: newCountry.id }));
    setIsCountryModalOpen(false);
  };

  const handleCreateUnit = async (unitData: Partial<Unit>) => {
    const newUnit = await createUnit({ name: unitData.name! });
    const updatedUnits = await getUnits();
    setUnits(updatedUnits);
    setFormData((prev) => ({ ...prev, unitId: newUnit.id }));
    setIsUnitModalOpen(false);
    return newUnit;
  };

  const openModalForCreation = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    name: string
  ) => {
    setNewItemName(name);
    setter(true);
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10";

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1500] p-4"
      onClick={
        !isCategoryModalOpen &&
        !isSubcategoryModalOpen &&
        !isCountryModalOpen &&
        !isUnitModalOpen
          ? onClose
          : undefined
      }
    >
      <div
        className="bg-white rounded-xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside modal
      >
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="m-0 text-gray-800 text-xl md:text-2xl">
            {product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
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
          <div className="grid grid-cols-2 gap-4">
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
                className={inputClass}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Narxi *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Tavsifi ({activeLang.toUpperCase()})
            </label>
            <textarea
              value={formData[`description_${activeLang}`]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [`description_${activeLang}`]: e.target.value,
                })
              }
              rows={4}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 resize-y font-inherit focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Kategoriya *
              </label>
              <AutocompleteSelect
                items={allCategories.map((c) => ({
                  id: c.id,
                  name: c.name_uz,
                }))}
                value={formData.categoryId}
                onChange={(item) =>
                  setFormData({ ...formData, categoryId: item?.id || "" })
                }
                onCreateNew={(name) =>
                  openModalForCreation(setIsCategoryModalOpen, name)
                }
                placeholder={"Kategoriyani tanlang"}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Subkategoriya
              </label>
              <AutocompleteSelect
                items={filteredSubcategories.map((s) => ({
                  id: s.id,
                  name: s.name_uz,
                }))}
                value={formData.subcategoryId}
                onChange={(item) =>
                  setFormData({ ...formData, subcategoryId: item?.id || "" })
                }
                onCreateNew={(name) =>
                  openModalForCreation(setIsSubcategoryModalOpen, name)
                }
                placeholder={"Subkategoriyani tanlang"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Davlat
              </label>
              <AutocompleteSelect
                items={countries}
                value={formData.countryId}
                onChange={(item) =>
                  setFormData({ ...formData, countryId: item?.id || "" })
                }
                onCreateNew={(name) =>
                  openModalForCreation(setIsCountryModalOpen, name)
                }
                placeholder={"Davlatni tanlang"}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Birlik
              </label>
              <AutocompleteSelect
                items={units}
                value={formData.unitId}
                onChange={(item) =>
                  setFormData({ ...formData, unitId: item?.id || "" })
                }
                onCreateNew={(name) =>
                  openModalForCreation(setIsUnitModalOpen, name)
                }
                placeholder={"Birlikni tanlang"}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Tarkibi ({activeLang.toUpperCase()})
            </label>
            <textarea
              value={formData[`structure_${activeLang}`]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [`structure_${activeLang}`]: e.target.value,
                })
              }
              rows={2}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 resize-y font-inherit focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="mb-6">
              <label className="block mb-2 text-gray-800 font-medium">
                Miqdori
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value),
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Media (Rasm/Video)
            </label>

            {/* Debug: Show if editing but no files found */}
            {product && allFiles.length === 0 && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Ushbu mahsulotda hozircha media fayllar yo'q
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Yangi media fayllarni qo'shish uchun pastdagi upload
                  maydonidan foydalaning.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  API response: files=
                  {product.files ? `${product.files.length} ta` : "undefined"}
                </p>
              </div>
            )}

            {/* Show existing files count when editing */}
            {product && allFiles.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  📁 Mavjud fayllar:{" "}
                  {allFiles.filter((f) => f.isExisting).length} ta
                  {allFiles.filter((f) => !f.isExisting).length > 0 &&
                    ` • Yangi fayllar: ${
                      allFiles.filter((f) => !f.isExisting).length
                    } ta`}
                </p>
              </div>
            )}

            {/* Draggable File Cards - shows all files (existing + new) */}
            {allFiles.length > 0 && (
              <div className="mb-4">
                <DraggableFileCards
                  files={allFiles}
                  onReorder={handleFileReorder}
                  onRemove={handleFileRemove}
                />
              </div>
            )}

            {/* Drag and Drop Upload */}
            <FileUpload
              onFileSelect={handleMediaFiles}
              accept="image/*,video/*"
              multiple={true}
              maxFiles={15}
              label={"Fayllarni bu yerga tashlang yoki tanlash uchun bosing"}
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
                : product
                ? "Yangilash"
                : "Yaratish"}
            </button>
          </div>
        </form>
      </div>

      {/* --- Quick Create Modals --- */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleCreateCategory}
        category={{
          id: "",
          name_uz: newItemName,
          name_en: "",
          name_ru: "",
          name_kz: "",
          description_uz: "",
          description_en: "",
          description_ru: "",
          description_kz: "",
          image: "",
        }}
      />

      <SubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        onSave={handleCreateSubcategory}
        subcategory={{
          name_uz: newItemName,
          name_en: "",
          name_ru: "",
          name_kz: "",
          categoryId: formData.categoryId,
          id: "",
        }}
        categories={allCategories}
      />

      <CountryModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSave={handleCreateCountry}
        country={{ name: newItemName, id: "" }}
      />

      <UnitModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleCreateUnit}
        unit={{ name: newItemName, id: "" }}
      />
    </div>
  );
};

export default ProductModal;
