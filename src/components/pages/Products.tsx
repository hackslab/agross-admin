import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type {
  Product,
  Category as CategoryType,
  Subcategory,
} from "../../types";
import ProductModal from "../modals/ProductModal";
import ConfirmDialog from "../ConfirmDialog";
import type { FileCardItem } from "../DraggableFileCards";
import { Search } from "lucide-react";
import {
  getProducts,
  getProductById,
  getCategories,
  getSubcategories,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductFile,
  updateProductFileOrder,
  getCurrency,
  ApiError,
} from "../../services/api";
import type { Currency } from "../../types";

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
      const [productsData, categoriesData, subcategoriesData, currencyData] =
        await Promise.all([
          getProducts(),
          getCategories(),
          getSubcategories(),
          getCurrency().catch(() => null),
        ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setCurrency(currencyData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Mahsulotlarni yuklashda xatolik.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (
    productData: Partial<Product>,
    newMediaFiles: File[],
    allOrderedFiles: FileCardItem[]
  ) => {
    try {
      // Step 1: Create or update the product metadata
      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await updateProduct(editingProduct.id, productData);
      } else {
        savedProduct = await createProduct(productData);
      }

      const tempIdToServerId = new Map<string, string>();

      // Step 2: Upload new files if any, and map their new IDs
      if (newMediaFiles.length > 0) {
        toast.info(`${newMediaFiles.length} ta fayl yuklanmoqda...`);

        const newFileItems = allOrderedFiles.filter((f) => !f.isExisting);

        const uploadPromises = newMediaFiles.map((file) =>
          addProductFile(savedProduct.id, file, file.type.startsWith("video/"))
        );

        const uploadedFiles = await Promise.all(uploadPromises);

        // Create a map from temporary client-side ID to the new server-side ID
        newFileItems.forEach((item, index) => {
          tempIdToServerId.set(item.id, uploadedFiles[index].id);
        });
      }

      // Step 3: Update file order if there are files to order
      if (allOrderedFiles.length > 0) {
        const fileOrderPayload = {
          files: allOrderedFiles
            .map((item, index) => {
              const fileId = item.isExisting
                ? item.id
                : tempIdToServerId.get(item.id)!;
              return { fileId, order: index };
            })
            .filter((f) => f.fileId),
        };

        if (fileOrderPayload.files.length > 0) {
          await updateProductFileOrder(savedProduct.id, fileOrderPayload);
        }
      }

      const successMessage = editingProduct
        ? "Mahsulot muvaffaqiyatli yangilandi."
        : "Mahsulot muvaffaqiyatli yaratildi.";
      toast.success(successMessage);

      // Step 4: Refresh all data to reflect changes
      await fetchData();

      setEditingProduct(undefined);
      setIsModalOpen(false);
    } catch (err) {
      console.error("An error occurred during product save:", err);
      if (err instanceof ApiError && err.isValidationError()) {
        // Validation errors will be handled by the modal
        throw err;
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Mahsulotni saqlashda xatolik.";
        toast.error(errorMessage);
        throw err;
      }
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Mahsulotni o'chirish",
      message: `Haqiqatan ham "${productName}" mahsulotini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        try {
          await deleteProduct(productId);
          setProducts(products.filter((prod) => prod.id !== productId));
          toast.success("Mahsulot muvaffaqiyatli o'chirildi.");
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Mahsulotni o'chirishda xatolik.";
          toast.error(errorMessage);
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const getCategoryName = useCallback(
    (categoryId: string) => {
      return (
        categories.find((cat) => cat.id === categoryId)?.name_uz || "Unknown"
      );
    },
    [categories]
  );

  const getSubcategoryName = useCallback(
    (subcategoryId: string) => {
      return (
        subcategories.find((sub) => sub.id === subcategoryId)?.name_uz || "-"
      );
    },
    [subcategories]
  );

  // Filter, search, and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((prod) => prod.categoryId === filterCategory);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name_uz &&
            product.name_uz.toLowerCase().includes(searchLower)) ||
          (product.name_en &&
            product.name_en.toLowerCase().includes(searchLower)) ||
          (product.name_ru &&
            product.name_ru.toLowerCase().includes(searchLower)) ||
          (product.name_kz &&
            product.name_kz.toLowerCase().includes(searchLower)) ||
          getCategoryName(product.categoryId)
            .toLowerCase()
            .includes(searchLower) ||
          getSubcategoryName(product.subcategoryId)
            .toLowerCase()
            .includes(searchLower)
      );
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name_uz.localeCompare(b.name_uz);
      } else if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [
    products,
    filterCategory,
    searchTerm,
    sortBy,
    sortOrder,
    getCategoryName,
    getSubcategoryName,
  ]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="border-4 border-teal-700/10 border-l-teal-700 rounded-full w-[50px] h-[50px] animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base m-0">
            Mahsulotlar yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 md:mb-8 gap-4">
        <h1 className="m-0 text-2xl md:text-3xl text-gray-800">Mahsulotlar</h1>
        <div className="flex flex-col gap-3 w-full md:w-auto md:flex-row">
          <button
            className="bg-gray-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-none cursor-pointer font-semibold text-sm md:text-base transition-all duration-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : "Yangilash"}
          </button>
          <button
            className="bg-teal-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-none cursor-pointer font-semibold text-sm md:text-base transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)] w-full md:w-auto"
            onClick={() => {
              setEditingProduct(undefined);
              setIsModalOpen(true);
            }}
          >
            Mahsulot qo'shish
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 mb-6 space-y-3 md:space-y-4">
        {/* Search Input - Full width on mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Qidiruv (nom, turi, kategoriya)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
          />
        </div>

        {/* Filters Row - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
          >
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_uz}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "price" | "quantity")
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
          >
            <option value="name">Nomi bo'yicha</option>
            <option value="price">Narxi bo'yicha</option>
            <option value="quantity">Ombor bo'yicha</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 sm:col-span-2 md:col-span-1"
          >
            <option value="asc">O'sish</option>
            <option value="desc">Kamayish</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-xs md:text-sm text-gray-600 pt-1">
          {filteredProducts.length} / {products.length} mahsulot topildi
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Mahsulot nomi
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Kategoriya
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Subkategoriya
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Narxi
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Omborda
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Birlik
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Davlat
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Holati
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-800 border-b border-gray-200">
                  Harakatlar
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50 last:border-b-0"
                >
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    <div
                      className="font-semibold max-w-[150px] md:max-w-[200px] truncate"
                      title={product.name_uz}
                    >
                      {product.name_uz}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                    {getSubcategoryName(product.subcategoryId)}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800 font-semibold">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-green-700 font-bold">
                        ${product.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      {currency && (
                        <div className="text-xs text-gray-500">
                          {(product.price * currency.sell).toLocaleString(
                            "uz-UZ",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}{" "}
                          so'm
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    <span
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold ${
                        product.quantity === 0
                          ? "bg-red-100 text-red-800"
                          : product.quantity < 10
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                    {product.unit?.name || "N/A"}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                    {product.country?.name || "N/A"}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    <span
                      className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        !product.isDeleted
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {!product.isDeleted ? "Faol" : "Faol emas"}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">
                    <div className="flex gap-2 whitespace-nowrap">
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-teal-700 text-white hover:bg-teal-800 hover:-translate-y-0.5 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loadingProductId === product.id}
                        onClick={async () => {
                          try {
                            setLoadingProductId(product.id);
                            // Fetch full product data including images and videos
                            const fullProduct = await getProductById(
                              product.id
                            );
                            console.log(
                              "🔍 Fetched product data:",
                              fullProduct
                            );
                            console.log("📁 Files:", fullProduct.files);
                            setEditingProduct(fullProduct);
                            setIsModalOpen(true);
                          } catch (err) {
                            const errorMessage =
                              err instanceof Error
                                ? err.message
                                : "Mahsulotni yuklashda xatolik.";
                            toast.error(errorMessage);
                          } finally {
                            setLoadingProductId(null);
                          }
                        }}
                      >
                        {loadingProductId === product.id
                          ? "Yuklanmoqda..."
                          : "Tahrirlash"}
                      </button>
                      <button
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 text-xs md:text-sm"
                        onClick={() =>
                          handleDeleteProduct(product.id, product.name_uz)
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        onCategoriesUpdate={setCategories}
        subcategories={subcategories}
        onSubcategoriesUpdate={setSubcategories}
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

export default Products;
