import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Category as CategoryType, Subcategory } from "../../types";
import CategoryModal from "../modals/CategoryModal";
import SubcategoryModal from "../modals/SubcategoryModal";
import ConfirmDialog from "../ConfirmDialog";
import { Folder, Search } from "lucide-react";
import {
  getCategories,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  ApiError,
} from "../../services/api";

const Category: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    CategoryType | undefined
  >();
  const [editingSubcategory, setEditingSubcategory] = useState<
    Subcategory | undefined
  >();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // Search and sort states
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categorySortBy, setCategorySortBy] = useState<"name" | "date">("name");
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState("");
  const [subcategorySortBy, setSubcategorySortBy] = useState<"name" | "date">(
    "name"
  );

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [categoriesData, subcategoriesData] = await Promise.all([
        getCategories(),
        getSubcategories(),
      ]);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Kategoriyalarni yuklashda xatolik.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (
    categoryData: Partial<CategoryType>,
    imageFile?: File
  ) => {
    const formData = new FormData();

    // Append all non-file fields from categoryData to formData
    Object.entries(categoryData).forEach(([key, value]) => {
      if (key !== "image" && value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editingCategory) {
        const updatedCategory = await updateCategory(
          editingCategory.id,
          formData
        );
        setCategories(
          categories.map((cat) =>
            cat.id === editingCategory.id ? updatedCategory : cat
          )
        );
        toast.success("Kategoriya muvaffaqiyatli yangilandi.");
      } else {
        const newCategory = await createCategory(formData);
        setCategories([...categories, newCategory]);
        toast.success("Kategoriya muvaffaqiyatli yaratildi.");
      }
      setEditingCategory(undefined);
      setIsCategoryModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError()) {
        // Validation errors will be handled by the modal
        throw err;
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Kategoriyani saqlashda xatolik.";
        toast.error(errorMessage);
        throw err;
      }
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Kategoriyani o'chirish",
      message: `Haqiqatan ham "${categoryName}" kategoriyasini o'chirmoqchimisiz? Bu kategoriya bilan bog'liq barcha subkategoriyalar ham o'chiriladi.`,
      onConfirm: async () => {
        try {
          await deleteCategory(categoryId);
          setCategories(categories.filter((cat) => cat.id !== categoryId));
          setSubcategories(
            subcategories.filter((sub) => sub.categoryId !== categoryId)
          );
          toast.success("Kategoriya muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Kategoriyani o'chirishda xatolik.";
          toast.error(errorMessage);
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleSaveSubcategory = async (
    subcategoryData: Partial<Subcategory>
  ) => {
    try {
      if (editingSubcategory) {
        const updatedSubcategory = await updateSubcategory(
          editingSubcategory.id,
          subcategoryData
        );
        setSubcategories(
          subcategories.map((sub) =>
            sub.id === editingSubcategory.id ? updatedSubcategory : sub
          )
        );
        toast.success("Subkategoriya muvaffaqiyatli yangilandi.");
      } else {
        const newSubcategory = await createSubcategory(subcategoryData);
        setSubcategories([...subcategories, newSubcategory]);
        toast.success("Subkategoriya muvaffaqiyatli yaratildi.");
      }
      setEditingSubcategory(undefined);
      setIsSubcategoryModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError()) {
        // Validation errors will be handled by the modal
        throw err;
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Subkategoriyani saqlashda xatolik.";
        toast.error(errorMessage);
        throw err;
      }
    }
  };

  const handleDeleteSubcategory = (
    subcategoryId: string,
    subcategoryName: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: "Subkategoriyani o'chirish",
      message: `Haqiqatan ham "${subcategoryName}" subkategoriyasini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        try {
          await deleteSubcategory(subcategoryId);
          setSubcategories(
            subcategories.filter((sub) => sub.id !== subcategoryId)
          );
          toast.success("Subkategoriya muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Subkategoriyani o'chirishda xatolik.";
          toast.error(errorMessage);
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((cat) => cat.id === categoryId)?.name_uz || "Unknown"
    );
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (categorySearchTerm) {
      const searchLower = categorySearchTerm.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.name_uz.toLowerCase().includes(searchLower) ||
          category.description_uz.toLowerCase().includes(searchLower)
      );
    }

    // Sort categories
    const sorted = [...filtered].sort((a, b) => {
      if (categorySortBy === "name") {
        return a.name_uz.localeCompare(b.name_uz);
      } else {
        // Sort by date (createdAt or updatedAt)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      }
    });

    return sorted;
  }, [categories, categorySearchTerm, categorySortBy]);

  // Filter and sort subcategories
  const filteredSubcategories = useMemo(() => {
    let filtered = subcategories;

    // Apply category filter
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(
        (sub) => sub.categoryId === selectedCategoryId
      );
    }

    // Apply search filter
    if (subcategorySearchTerm) {
      const searchLower = subcategorySearchTerm.toLowerCase();
      filtered = filtered.filter((subcategory) =>
        subcategory.name_uz.toLowerCase().includes(searchLower)
      );
    }

    // Sort subcategories
    const sorted = [...filtered].sort((a, b) => {
      if (subcategorySortBy === "name") {
        return a.name_uz.localeCompare(b.name_uz);
      } else {
        // Sort by date (createdAt or updatedAt)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      }
    });

    return sorted;
  }, [
    subcategories,
    selectedCategoryId,
    subcategorySearchTerm,
    subcategorySortBy,
  ]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="border-4 border-teal-700/10 border-l-teal-700 rounded-full w-[50px] h-[50px] animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base m-0">
            Kategoriyalar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px]">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 md:mb-8 gap-4">
        <h1 className="m-0 text-2xl md:text-3xl text-gray-800">
          Kategoriyalar
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            className="bg-gray-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-none cursor-pointer font-semibold text-sm md:text-base transition-all duration-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : "Yangilash"}
          </button>
          <button
            className="bg-teal-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-none cursor-pointer font-semibold text-sm md:text-base transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)]"
            onClick={() => {
              setEditingCategory(undefined);
              setIsCategoryModalOpen(true);
            }}
          >
            Kategoriya qo'shish
          </button>
          <button
            className="bg-teal-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-none cursor-pointer font-semibold text-sm md:text-base transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)]"
            onClick={() => {
              setEditingSubcategory(undefined);
              setIsSubcategoryModalOpen(true);
            }}
          >
            Subkategoriya qo'shish
          </button>
        </div>
      </div>

      <div className="mb-8 md:mb-12">
        <h2 className="m-0 mb-4 md:mb-6 text-xl md:text-2xl text-gray-800 font-semibold">
          Kategoriyalar
        </h2>

        {/* Category Search and Sort */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kategoriya qidiruv..."
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              />
            </div>

            {/* Sort */}
            <select
              value={categorySortBy}
              onChange={(e) =>
                setCategorySortBy(e.target.value as "name" | "date")
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 md:min-w-[150px]"
            >
              <option value="name">Nomi bo'yicha</option>
              <option value="date">Sanasi bo'yicha</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredCategories.length} / {categories.length} kategoriya topildi
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-4 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-200 border border-gray-200 text-center hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
            >
              {category.image && (
                <div className="w-full h-[150px] md:h-[180px] mb-3 md:mb-4 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name_uz}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Folder className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 text-teal-700 mx-auto" />
              <h3 className="m-0 mb-2 text-gray-800 text-lg md:text-xl font-semibold">
                {category.name_uz}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 leading-relaxed min-h-[40px] md:min-h-[60px]">
                {category.description_uz}
              </p>
              <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-200">
                <button
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-teal-700 text-white hover:bg-teal-800 hover:-translate-y-0.5"
                  onClick={() => {
                    setEditingCategory(category);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  Tahrirlash
                </button>
                <button
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5"
                  onClick={() =>
                    handleDeleteCategory(category.id, category.name_uz)
                  }
                >
                  Oʻchirish
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="m-0 mb-4 md:mb-6 text-xl md:text-2xl text-gray-800 font-semibold">
          Subkategoriyalar
        </h2>

        {/* Subcategory Search and Filters */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Subkategoriya qidiruv..."
                value={subcategorySearchTerm}
                onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 md:min-w-[200px]"
            >
              <option value="all">Barcha kategoriyalar</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_uz}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={subcategorySortBy}
              onChange={(e) =>
                setSubcategorySortBy(e.target.value as "name" | "date")
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 md:min-w-[150px]"
            >
              <option value="name">Nomi bo'yicha</option>
              <option value="date">Sanasi bo'yicha</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredSubcategories.length} / {subcategories.length}{" "}
            subkategoriya topildi
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Nomi
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Kategoriya
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                    Harakatlar
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubcategories.map((subcategory) => (
                  <tr
                    key={subcategory.id}
                    className="border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                      {subcategory.name_uz}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                      <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                        {getCategoryName(subcategory.categoryId)}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button
                          className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-teal-700 text-white hover:bg-teal-800 hover:-translate-y-0.5 text-xs md:text-sm"
                          onClick={() => {
                            setEditingSubcategory(subcategory);
                            setIsSubcategoryModalOpen(true);
                          }}
                        >
                          Tahrirlash
                        </button>
                        <button
                          className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 text-xs md:text-sm"
                          onClick={() =>
                            handleDeleteSubcategory(
                              subcategory.id,
                              subcategory.name_uz
                            )
                          }
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
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(undefined);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <SubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => {
          setIsSubcategoryModalOpen(false);
          setEditingSubcategory(undefined);
        }}
        onSave={handleSaveSubcategory}
        subcategory={editingSubcategory}
        categories={categories}
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

export default Category;
