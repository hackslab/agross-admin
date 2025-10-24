import React, { useState, useMemo, useEffect } from "react";
import type { Log } from "../../types";
import {
  Plus,
  Edit,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Minus,
} from "lucide-react";

interface ActivityFeedProps {
  logs: Log[];
}

const ITEMS_PER_PAGE = 10;

const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const getActionIcon = (action: Log["actionType"]) => {
    switch (action) {
      case "created":
        return Plus;
      case "updated":
        return Edit;
      case "deleted":
        return Minus;
      default:
        return User;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return "Invalid Date";
      }

      return date.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return "Error";
    }
  };

  const getActionColorClasses = (action: Log["actionType"]) => {
    switch (action) {
      case "created":
        return "bg-green-500/15 border border-green-500/30 text-green-700";
      case "updated":
        return "bg-blue-500/15 border border-blue-500/30 text-blue-700";
      case "deleted":
        return "bg-red-500/15 border border-red-500/30 text-red-700";
      default:
        return "bg-gray-500/15 border border-gray-500/30 text-gray-700";
    }
  };

  const getActionText = (action: Log["actionType"]) => {
    switch (action) {
      case "created":
        return "yaratdi";
      case "updated":
        return "yangiladi";
      case "deleted":
        return "o'chirdi";
      default:
        return action;
    }
  };

  const getEntityText = (entity: Log["entityType"]) => {
    switch (entity) {
      case "Product":
        return "Mahsulot";
      case "Category":
        return "Kategoriya";
      case "Subcategory":
        return "Subkategoriya";
      case "Admin":
        return "Admin";
      case "User":
        return "Foydalanuvchi";
      case "Offer":
        return "Taklif";
      default:
        return entity;
    }
  };

  const getEntityName = (log: Log): string => {
    try {
      // Prefer newData for created/updated, oldData for deleted
      const dataToUse =
        log.actionType === "deleted" && log.oldData
          ? log.oldData
          : log.newData || log.oldData;

      if (!dataToUse) return "N/A";

      const data = JSON.parse(dataToUse);

      // Try to extract meaningful name based on entity type
      switch (log.entityType) {
        case "Product":
          return data.name_uz || data.name_en || data.name || "Mahsulot";
        case "Category":
        case "Subcategory":
          return data.name_uz || data.name_en || data.name || "Kategoriya";
        case "Admin":
        case "User":
          return data.username || data.name || "Foydalanuvchi";
        default:
          return data.name || data.username || data.title || "N/A";
      }
    } catch (error) {
      console.error("Error parsing entity data:", error);
      return "N/A";
    }
  };

  const getUpdatedFields = (log: Log): string[] => {
    if (log.actionType !== "updated" || !log.oldData || !log.newData) {
      return [];
    }

    try {
      const oldData = JSON.parse(log.oldData);
      const newData = JSON.parse(log.newData);
      const updatedFields: string[] = [];

      // Compare all fields
      Object.keys(newData).forEach((key) => {
        if (oldData[key] !== newData[key]) {
          // Skip technical fields
          if (!["id", "createdAt", "updatedAt", "adminId"].includes(key)) {
            updatedFields.push(key);
          }
        }
      });

      return updatedFields;
    } catch (error) {
      console.error("Error parsing update data:", error);
      return [];
    }
  };

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: { [key: string]: string } = {
      name_uz: "Nomi (UZ)",
      name_en: "Nomi (EN)",
      name_ru: "Nomi (RU)",
      name_kz: "Nomi (KZ)",
      description_uz: "Tavsifi (UZ)",
      description_en: "Tavsifi (EN)",
      description_ru: "Tavsifi (RU)",
      description_kz: "Tavsifi (KZ)",
      price: "Narxi",
      quantity: "Miqdori",
      username: "Foydalanuvchi nomi",
      email: "Email",
      password: "Parol",
      isActive: "Faollik holati",
      isSuperadmin: "Super admin",
      categoryId: "Kategoriya",
      subcategoryId: "Subkategoriya",
      countryId: "Davlat",
      unitId: "Birlik",
      structure_uz: "Tarkibi (UZ)",
      structure_en: "Tarkibi (EN)",
      structure_ru: "Tarkibi (RU)",
      structure_kz: "Tarkibi (KZ)",
    };

    return fieldMap[fieldName] || fieldName;
  };

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((log) => {
        const adminName = log.admin?.username || log.admin?.name || "";
        const entityName = getEntityName(log);
        const entityType = log.entityType.toLowerCase();

        return (
          adminName.toLowerCase().includes(searchLower) ||
          entityName.toLowerCase().includes(searchLower) ||
          entityType.includes(searchLower)
        );
      });
    }

    // Apply entity type filter
    if (filterEntity !== "all") {
      filtered = filtered.filter(
        (log) => log.entityType.toLowerCase() === filterEntity.toLowerCase()
      );
    }

    // Sort logs
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [logs, searchTerm, filterEntity, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = filteredAndSortedLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEntity, sortBy]);

  if (logs.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-xl md:text-2xl text-gray-800">
            So'nggi harakatlar
          </h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            0 harakatlar
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
          <div className="p-12 text-center text-gray-600">
            <p className="text-base m-0">Hali hech qanday harakat yo'q</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6 max-md:flex-col max-md:items-start max-md:gap-4">
        <h2 className="m-0 text-xl md:text-2xl text-gray-800">
          So'nggi harakatlar
        </h2>
        <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
          {filteredAndSortedLogs.length} / {logs.length} loglar
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
          </div>

          {/* Action Filter */}

          {/* Entity Filter */}
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 min-w-[150px]"
          >
            <option value="all">Barcha turlar</option>
            <option value="product">Mahsulot</option>
            <option value="category">Kategoriya</option>
            <option value="subcategory">Subkategoriya</option>
            <option value="admin">Admin</option>
            <option value="user">Foydalanuvchi</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 cursor-pointer transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 min-w-[150px]"
          >
            <option value="newest">Eng yangi</option>
            <option value="oldest">Eng eski</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
        {filteredAndSortedLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <p className="text-base m-0">Hech qanday log topilmadi</p>
          </div>
        ) : (
          <>
            {paginatedLogs.map((log) => {
              const ActionIcon = getActionIcon(log.actionType);
              const entityName = getEntityName(log);
              const adminName = log.admin?.username || log.admin?.name || "N/A";
              const updatedFields = getUpdatedFields(log);

              return (
                <div
                  key={log.id}
                  className="flex items-start px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 transition-colors duration-200 gap-3 md:gap-4 last:border-b-0 hover:bg-gray-50 max-md:flex-col"
                >
                  {/* Action Icon */}
                  <div className="shrink-0 mt-1">
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${getActionColorClasses(
                        log.actionType
                      )}`}
                    >
                      <ActionIcon className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-gray-800 text-sm md:text-base">
                        {adminName}
                      </span>
                      <span className="text-gray-500 text-xs md:text-sm">
                        {getEntityText(log.entityType)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${getActionColorClasses(
                          log.actionType
                        )}`}
                      >
                        {getActionText(log.actionType).toLowerCase()}
                      </span>
                    </div>

                    {/* Entity Name */}
                    {entityName !== "N/A" && (
                      <div className="font-semibold text-gray-900 text-base md:text-lg mb-1">
                        "{entityName}"
                      </div>
                    )}

                    {/* Updated Fields */}
                    {updatedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-600 mr-1">
                          Yangilangan maydonlar:
                        </span>
                        {updatedFields.map((field, index) => (
                          <span
                            key={field}
                            className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                          >
                            {getFieldDisplayName(field)}
                            {index < updatedFields.length - 1 && ","}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap mt-1 max-md:self-start max-md:mt-0">
                    {formatTimestamp(log.createdAt)}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {startIndex + 1}-
                  {Math.min(endIndex, filteredAndSortedLogs.length)} /{" "}
                  {filteredAndSortedLogs.length} loglar
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700 px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
