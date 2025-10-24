/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

export const API_CONFIG = {
  BASE_URL: "http://192.168.1.48:3000",
  ENDPOINTS: {
    // Admin Authentication
    ADMIN_LOGIN: "/admin/login",

    // Admin Management (SuperAdmin only)
    ADMIN_LIST: "/admin",
    ADMIN_CREATE: "/admin",
    ADMIN_GET: (id: string) => `/admin/${id}`,
    ADMIN_UPDATE: (id: string) => `/admin/${id}`,
    ADMIN_DELETE: (id: string) => `/admin/${id}`,
    ADMIN_CHANGE_PASSWORD: "/admin/change-password",

    // Categories
    CATEGORIES_LIST: "/categories",
    CATEGORIES_GET: (id: string) => `/categories/${id}`,
    CATEGORIES_CREATE: "/categories",
    CATEGORIES_UPDATE: (id: string) => `/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/categories/${id}`,

    // Subcategories
    SUBCATEGORIES_LIST: "/subcategories",
    SUBCATEGORIES_GET: (id: string) => `/subcategories/${id}`,
    SUBCATEGORIES_CREATE: "/subcategories",
    SUBCATEGORIES_UPDATE: (id: string) => `/subcategories/${id}`,
    SUBCATEGORIES_DELETE: (id: string) => `/subcategories/${id}`,

    // Products
    PRODUCTS_LIST: "/products",
    PRODUCTS_GET: (id: string) => `/products/${id}`,
    PRODUCTS_BY_CATEGORY: (categoryId: string) =>
      `/products/category/${categoryId}`,
    PRODUCTS_CREATE: "/products",
    PRODUCTS_UPDATE: (id: string) => `/products/${id}`,
    PRODUCTS_DELETE: (id: string) => `/products/${id}`,
    PRODUCTS_ADD_FILE: (id: string, isVideo: boolean) =>
      `/products/${id}/files?isVideo=${isVideo}`,
    PRODUCTS_REMOVE_FILE: (productId: string, fileId: string) =>
      `/products/${productId}/files/${fileId}`,
    PRODUCTS_UPDATE_FILE_ORDER: (productId: string) =>
      `/products/${productId}/files/order`,

    // Units
    UNITS_LIST: "/units",
    UNITS_CREATE: "/units",
    UNITS_UPDATE: (id: string) => `/units/${id}`,
    UNITS_DELETE: (id: string) => `/units/${id}`,

    // Countries
    COUNTRIES_LIST: "/countries",
    COUNTRIES_GET: (id: string) => `/countries/${id}`,
    COUNTRIES_CREATE: "/countries",
    COUNTRIES_UPDATE: (id: string) => `/countries/${id}`,
    COUNTRIES_DELETE: (id: string) => `/countries/${id}`,

    // Carousel
    CAROUSEL_LIST: "/carousel",
    CAROUSEL_GET: (id: string) => `/carousel/${id}`,
    CAROUSEL_CREATE: "/carousel",
    CAROUSEL_DELETE: (id: string) => `/carousel/${id}`,

    // Legacy/Custom endpoints (if needed by your backend)
    DASHBOARD_SUMMARY: "/dashboard/summary",
    ADMINS_ACTIVITY: "/admin/logs",
    ADMINS_ME_PROFILE: "/admins/me/profile",
    ADMINS_ME_PASSWORD: "/admins/me/password",
    SETTINGS_GENERAL: "/settings/general",

    // Currency
    CURRENCY: "/currency",
  },
  // Timeout configuration
  TIMEOUT: 10000,
};

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
