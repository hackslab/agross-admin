import React, { useState, useEffect } from "react";
import {
  getDashboardSummary,
  getCurrency,
  getAllLogs,
} from "../../services/api";
import type { DashboardStats, Currency, Log } from "../../types";
import ActivityFeed from "../dashboard/ActivityFeed";
import { AlertTriangle, Package, Folder, Eye, DollarSign } from "lucide-react";

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardData, currencyData, logsData] = await Promise.all([
          getDashboardSummary(),
          getCurrency().catch(() => null), // Don't fail if currency API is unavailable
          getAllLogs().catch(() => []), // Don't fail if logs API is unavailable
        ]);

        setStats(dashboardData.stats);
        setCurrency(currencyData);
        setLogs(logsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Boshqaruv paneli ma'lumotlarini yuklashda xatolik."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <h1 className="m-0 text-2xl md:text-3xl">Boshqaruv paneli</h1>
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 mt-4 md:mt-8">
          <div className="border-4 border-teal-700/10 border-l-teal-700 rounded-full w-[50px] h-[50px] animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base m-0">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <h1 className="m-0 text-2xl md:text-3xl">Boshqaruv paneli</h1>
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 mt-4 md:mt-8 text-center">
          <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-80 text-red-600" />
          <h2 className="text-red-600 my-2 text-xl md:text-2xl">
            Xatolik yuz berdi
          </h2>
          <p className="text-gray-600 text-sm md:text-base my-4 mx-0 max-w-[500px]">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-teal-700 text-white hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)]"
          >
            {" "}
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <h1 className="m-0 text-2xl md:text-3xl">Boshqaruv paneli</h1>
        <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 mt-4 md:mt-8 text-center">
          <p className="text-gray-600 text-sm md:text-base m-0">
            Ma'lumotlar yo'q
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <h1 className="m-0 text-2xl md:text-3xl">Boshqaruv paneli</h1>
        {currency && (
          <div className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 px-4 md:px-6 py-2.5 md:py-3 rounded-xl border border-green-200 shadow-sm">
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-700" />
            <div>
              <p className="m-0 text-xs text-gray-600 font-medium">USD kursi</p>
              <p className="m-0 text-sm md:text-base font-bold text-gray-800">
                Olish:{" "}
                {currency.buy.toLocaleString("uz-UZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                so'm
              </p>
              <p className="m-0 text-sm md:text-base font-bold text-gray-800">
                Sotish:{" "}
                {currency.sell.toLocaleString("uz-UZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                so'm
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-3 md:gap-4 border border-gray-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <Package className="w-10 h-10 md:w-12 md:h-12 text-teal-700 flex-shrink-0" />
          <div>
            <h3 className="m-0 text-xs md:text-sm text-gray-600 font-medium">
              Jami mahsulotlar
            </h3>
            <p className="my-1 md:my-2 mx-0 text-2xl md:text-3xl font-bold text-gray-800">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-3 md:gap-4 border border-gray-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-200">
          <Folder className="w-10 h-10 md:w-12 md:h-12 text-teal-700 flex-shrink-0" />
          <div>
            <h3 className="m-0 text-xs md:text-sm text-gray-600 font-medium">
              Jami kategoriyalar
            </h3>
            <p className="my-1 md:my-2 mx-0 text-2xl md:text-3xl font-bold text-gray-800">
              {stats.totalCategories}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-3 md:gap-4 border border-gray-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-200">
          <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-orange-600 flex-shrink-0" />
          <div>
            <h3 className="m-0 text-xs md:text-sm text-gray-600 font-medium">
              Omborda kam qolgan
            </h3>
            <p className="my-1 md:my-2 mx-0 text-2xl md:text-3xl font-bold text-gray-800">
              {stats.lowStockProducts}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-3 md:gap-4 border border-gray-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-200">
          <Eye className="w-10 h-10 md:w-12 md:h-12 text-teal-700 flex-shrink-0" />
          <div>
            <h3 className="m-0 text-xs md:text-sm text-gray-600 font-medium">
              Jami ko'rishlar
            </h3>
            <p className="my-1 md:my-2 mx-0 text-2xl md:text-3xl font-bold text-gray-800">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <ActivityFeed logs={logs} />
    </div>
  );
};

export default Home;
