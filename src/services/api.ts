/**
 * API Service Layer
 * Centralized service for all backend API calls
 */

import { API_CONFIG, getApiUrl } from "../config/api";
import type {
  ActivityLog,
  LoginRequest,
  LoginResponse,
  LoginApiResponse,
  JwtPayload,
  Admin,
  CreateAdminRequest,
  UpdateAdminRequest,
  Category,
  Subcategory,
  CreateSubcategoryRequest,
  Product,
  ProductFile,
  Country,
  UpdateFileOrderRequest,
  Unit,
  CarouselItem,
  GeneralSettings,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  Currency,
  Log,
} from "../types";

/**
 * Token management
 */
const TOKEN_KEY = "admin_access_token";

export const tokenManager = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

/**
 * JWT Utility: Decode JWT payload without external dependencies
 * This is safe for client-side use as the JWT payload is not sensitive
 * and we're only using it to extract the admin ID for subsequent API calls
 */
function decodeJwt(token: string): JwtPayload {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode the payload (base64url encoded)
    const payload = parts[1];

    // Base64url decode: replace URL-safe chars and pad if needed
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    // Decode base64 and parse JSON
    const jsonPayload = atob(paddedBase64);
    const decoded = JSON.parse(jsonPayload) as JwtPayload;

    // Validate required fields
    if (!decoded.id || !decoded.username) {
      throw new Error("Invalid JWT payload: missing required fields");
    }

    return decoded;
  } catch (error) {
    console.error("JWT decode error:", error);
    throw new Error("Autentifikatsiya tokenini dekodlashda xatolik");
  }
}

/**
 * API Response types
 */
export interface DashboardSummaryResponse {
  stats: {
    totalProducts: number;
    totalCategories: number;
    totalViews: number;
    lowStockProducts: number;
  };
  activities: ActivityLog[];
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;
  validationErrors?: string[];

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;

    // Extract validation errors if they exist in the expected format
    if (data && typeof data === "object" && "message" in data) {
      const messageField = data.message;
      if (Array.isArray(messageField)) {
        this.validationErrors = messageField;
      } else if (typeof messageField === "string") {
        this.validationErrors = [messageField];
      }
    }
  }

  /**
   * Get validation errors as a string array
   */
  getValidationErrors(): string[] {
    return this.validationErrors || [this.message];
  }

  /**
   * Check if this is a validation error (status 400)
   */
  isValidationError(): boolean {
    return this.status === 400 && this.validationErrors !== undefined;
  }
}

/**
 * Generic fetch wrapper with error handling and automatic JWT injection
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  // Automatically add JWT token if available
  const token = tokenManager.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Do not attach Authorization header for the login endpoint
  const isLoginRequest = endpoint === API_CONFIG.ENDPOINTS.ADMIN_LOGIN;

  if (token && !isLoginRequest) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        tokenManager.remove();
        // Clear user data from localStorage
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        // Trigger re-login by throwing a specific error
        throw new ApiError(
          401,
          errorData?.message || "Sessiya tugadi. Iltimos, qayta kiring.",
          errorData
        );
      }

      throw new ApiError(
        response.status,
        errorData?.message ||
          `HTTP Error ${response.status}: ${response.statusText}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiError(408, "So'rov vaqti tugadi");
      }
      throw new ApiError(0, `Tarmoq xatosi: ${error.message}`);
    }

    throw new ApiError(0, "Noma'lum xatolik yuz berdi");
  }
}

/**
 * Generic fetch wrapper for multipart/form-data
 */
async function apiFetchFormData<T>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST"
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  const token = tokenManager.get();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(getApiUrl(endpoint), {
      method,
      signal: controller.signal,
      headers,
      body: formData,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 401) {
        tokenManager.remove();
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        throw new ApiError(
          401,
          errorData?.message || "Sessiya tugadi. Iltimos, qayta kiring.",
          errorData
        );
      }
      throw new ApiError(
        response.status,
        errorData?.message ||
          `HTTP Error ${response.status}: ${response.statusText}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiError(408, "So'rov vaqti tugadi");
      }
      throw new ApiError(0, `Tarmoq xatosi: ${error.message}`);
    }
    throw new ApiError(0, "Noma'lum xatolik yuz berdi");
  }
}

/**
 * Get dashboard summary data (statistics + recent activities)
 */
export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>(
    API_CONFIG.ENDPOINTS.DASHBOARD_SUMMARY
  );
}

/**
 * ===========================
 * ADMIN AUTHENTICATION API
 * ===========================
 */

/**
 * Login admin user
 *
 * This function orchestrates the complete authentication flow:
 * 1. Calls POST /admin/login to get access token
 * 2. Decodes JWT to extract admin information
 * 3. Returns a complete authenticated session object
 */
export async function loginAdmin(
  credentials: LoginRequest
): Promise<LoginResponse> {
  // Step 1: Get access token from login endpoint
  const loginResponse = await apiFetch<LoginApiResponse>(
    API_CONFIG.ENDPOINTS.ADMIN_LOGIN,
    {
      method: "POST",
      body: JSON.stringify(credentials),
    }
  );

  const { accessToken } = loginResponse;

  // Step 2: Store token in localStorage for subsequent authorized requests
  tokenManager.set(accessToken);

  // Step 3: Decode JWT to extract admin information
  // The JWT payload contains all necessary user information (id, username, isSuperadmin)
  // No need to make an additional API call to /admin/:id which requires superadmin privileges
  const jwtPayload = decodeJwt(accessToken);

  // Step 4: Return complete authenticated session
  return {
    accessToken,
    admin: {
      id: jwtPayload.id,
      username: jwtPayload.username,
      isSuperadmin: jwtPayload.isSuperadmin,
    },
  };
}

/**
 * Get current admin profile (for session validation)
 *
 * This function validates the stored session token and returns
 * the current admin's profile from the decoded JWT payload.
 */
export async function getAdminProfile(): Promise<Admin> {
  // Get stored token
  const token = tokenManager.get();

  if (!token) {
    throw new Error("No authentication token found");
  }

  // Decode JWT to get admin information
  // The JWT payload contains all necessary user information
  const jwtPayload = decodeJwt(token);

  // Return admin profile from JWT payload
  // Note: We don't need to call /admin/:id which requires superadmin privileges
  return {
    id: jwtPayload.id,
    name: jwtPayload.username, // JWT doesn't include name, so use username
    username: jwtPayload.username,
    isSuperadmin: jwtPayload.isSuperadmin,
  };
}

/**
 * Logout admin user
 */
export function logoutAdmin(): void {
  tokenManager.remove();
  // Note: App.tsx handles clearing username, userId, and userRole from localStorage
}

/**
 * ===========================
 * ADMIN MANAGEMENT API (SuperAdmin only)
 * ===========================
 */

/**
 * Get all admin users (Superadmin only)
 */
export async function getAllAdmins(): Promise<Admin[]> {
  return apiFetch<Admin[]>(API_CONFIG.ENDPOINTS.ADMIN_LIST);
}

/**
 * Get admin by ID (Superadmin only)
 */
export async function getAdminById(id: string): Promise<Admin> {
  return apiFetch<Admin>(API_CONFIG.ENDPOINTS.ADMIN_GET(id));
}

/**
 * Create new admin user (Superadmin only)
 */
export async function createAdmin(data: CreateAdminRequest): Promise<Admin> {
  return apiFetch<Admin>(API_CONFIG.ENDPOINTS.ADMIN_CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update admin user (Superadmin only)
 */
export async function updateAdmin(
  id: string,
  data: UpdateAdminRequest
): Promise<Admin> {
  return apiFetch<Admin>(API_CONFIG.ENDPOINTS.ADMIN_UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete admin user (Superadmin only)
 */
export async function deleteAdmin(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.ADMIN_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * Change another admin's password (Superadmin only)
 */
export async function changeAdminPassword(
  adminId: string,
  newPassword: string
): Promise<Admin> {
  return apiFetch<Admin>(API_CONFIG.ENDPOINTS.ADMIN_CHANGE_PASSWORD, {
    method: "PATCH",
    body: JSON.stringify({ adminId, newPassword }),
  });
}

/**
 * Get all logs from backend
 */
export async function getAllLogs(): Promise<Log[]> {
  return apiFetch<Log[]>(API_CONFIG.ENDPOINTS.ADMINS_ACTIVITY);
}

/**
 * ===========================
 * ADMIN SELF-SERVICE API
 * ===========================
 */

/**
 * Update own profile (username/email)
 */
export async function updateMyProfile(
  data: UpdateProfileRequest
): Promise<Admin> {
  return apiFetch<Admin>(API_CONFIG.ENDPOINTS.ADMINS_ME_PROFILE, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Update own password
 */
export async function updateMyPassword(
  data: UpdatePasswordRequest
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    API_CONFIG.ENDPOINTS.ADMINS_ME_PASSWORD,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * ===========================
 * SETTINGS API
 * ===========================
 */

/**
 * Get general settings (SuperAdmin only)
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
  return apiFetch<GeneralSettings>(API_CONFIG.ENDPOINTS.SETTINGS_GENERAL);
}

/**
 * Update general settings (SuperAdmin only)
 */
export async function updateGeneralSettings(
  data: Partial<GeneralSettings>
): Promise<GeneralSettings> {
  return apiFetch<GeneralSettings>(API_CONFIG.ENDPOINTS.SETTINGS_GENERAL, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * ===========================
 * SECTIONS API
 * ===========================
 */

/**
 * ===========================
 * LOGS API
 * ===========================
 */

/**
 * ===========================
 * CATEGORIES API
 * ===========================
 */

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>(API_CONFIG.ENDPOINTS.CATEGORIES_LIST);
}

/**
 * Create new category
 */
export async function createCategory(data: FormData): Promise<Category> {
  return apiFetchFormData<Category>(
    API_CONFIG.ENDPOINTS.CATEGORIES_CREATE,
    data,
    "POST"
  );
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  data: FormData
): Promise<Category> {
  return apiFetchFormData<Category>(
    API_CONFIG.ENDPOINTS.CATEGORIES_UPDATE(id),
    data,
    "PATCH"
  );
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.CATEGORIES_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * ===========================
 * SUBCATEGORIES API
 * ===========================
 */

/**
 * Get all subcategories
 */
export async function getSubcategories(): Promise<Subcategory[]> {
  return apiFetch<Subcategory[]>(API_CONFIG.ENDPOINTS.SUBCATEGORIES_LIST);
}

/**
 * Create new subcategory
 */
export async function createSubcategory(
  data: Partial<CreateSubcategoryRequest>
): Promise<Subcategory> {
  return apiFetch<Subcategory>(API_CONFIG.ENDPOINTS.SUBCATEGORIES_CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update subcategory
 */
export async function updateSubcategory(
  id: string,
  data: Partial<Subcategory>
): Promise<Subcategory> {
  return apiFetch<Subcategory>(API_CONFIG.ENDPOINTS.SUBCATEGORIES_UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete subcategory
 */
export async function deleteSubcategory(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.SUBCATEGORIES_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * ===========================
 * PRODUCTS API
 * ===========================
 */

/**
 * Get all products
 */
export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>(API_CONFIG.ENDPOINTS.PRODUCTS_LIST);
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  return apiFetch<Product>(API_CONFIG.ENDPOINTS.PRODUCTS_GET(id));
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  return apiFetch<Product[]>(
    API_CONFIG.ENDPOINTS.PRODUCTS_BY_CATEGORY(categoryId)
  );
}

/**
 * Create new product
 */
export async function createProduct(data: Partial<Product>): Promise<Product> {
  console.log("Creating product with data:", data);
  return apiFetch<Product>(API_CONFIG.ENDPOINTS.PRODUCTS_CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update product
 */
export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<Product> {
  return apiFetch<Product>(API_CONFIG.ENDPOINTS.PRODUCTS_UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.PRODUCTS_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * Add file (image/video) to product
 */
export async function addProductFile(
  productId: string,
  file: File,
  isVideo: boolean
): Promise<ProductFile> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetchFormData<ProductFile>(
    API_CONFIG.ENDPOINTS.PRODUCTS_ADD_FILE(productId, isVideo),
    formData,
    "POST"
  );
}

/**
 * Remove file from product
 */
export async function removeProductFile(
  productId: string,
  fileId: string
): Promise<void> {
  await apiFetch<void>(
    API_CONFIG.ENDPOINTS.PRODUCTS_REMOVE_FILE(productId, fileId),
    {
      method: "DELETE",
    }
  );
}

/**
 * Update the display order of files for a product
 */
export async function updateProductFileOrder(
  productId: string,
  data: UpdateFileOrderRequest
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    API_CONFIG.ENDPOINTS.PRODUCTS_UPDATE_FILE_ORDER(productId),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * ===========================
 * UNITS API
 * ===========================
 */

/**
 * Get all units
 */
export async function getUnits(): Promise<Unit[]> {
  return apiFetch<Unit[]>(API_CONFIG.ENDPOINTS.UNITS_LIST);
}

/**
 * Create new unit
 */
export async function createUnit(data: { name: string }): Promise<Unit> {
  return apiFetch<Unit>(API_CONFIG.ENDPOINTS.UNITS_CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update unit
 */
export async function updateUnit(
  id: string,
  data: { name: string }
): Promise<Unit> {
  return apiFetch<Unit>(API_CONFIG.ENDPOINTS.UNITS_UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete unit
 */
export async function deleteUnit(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.UNITS_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * ===========================
 * COUNTRIES API
 * ===========================
 */

/**
 * Get all countries
 */
export async function getCountries(): Promise<Country[]> {
  return apiFetch<Country[]>(API_CONFIG.ENDPOINTS.COUNTRIES_LIST);
}

/**
 * Create new country
 */
export async function createCountry(name: string): Promise<Country> {
  return apiFetch<Country>(API_CONFIG.ENDPOINTS.COUNTRIES_CREATE, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

/**
 * Update country
 */
export async function updateCountry(
  id: string,
  name: string
): Promise<Country> {
  return apiFetch<Country>(API_CONFIG.ENDPOINTS.COUNTRIES_UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

/**
 * Delete country
 */
export async function deleteCountry(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.COUNTRIES_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * ===========================
 * CAROUSEL API
 * ===========================
 */

/**
 * Get all carousel items
 */
export async function getCarouselItems(): Promise<CarouselItem[]> {
  return apiFetch<CarouselItem[]>(API_CONFIG.ENDPOINTS.CAROUSEL_LIST);
}

/**
 * Add carousel image
 */
export async function addCarouselImage(file: File): Promise<CarouselItem> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetchFormData<CarouselItem>(
    API_CONFIG.ENDPOINTS.CAROUSEL_CREATE,
    formData,
    "POST"
  );
}

/**
 * Delete carousel image
 */
export async function deleteCarouselItem(id: string): Promise<void> {
  await apiFetch<void>(API_CONFIG.ENDPOINTS.CAROUSEL_DELETE(id), {
    method: "DELETE",
  });
}

/**
 * ===========================
 * CURRENCY API
 * ===========================
 */

/**
 * Get current USD exchange rate
 */
export async function getCurrency(): Promise<Currency> {
  return apiFetch<Currency>(API_CONFIG.ENDPOINTS.CURRENCY);
}

/**
 * API service object for easy imports
 */
export const apiService = {
  // Dashboard
  getDashboardSummary,
  // Admin Authentication
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  // Admin Management (SuperAdmin only)
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  changeAdminPassword,
  getAllLogs,
  // Admin Self-Service
  updateMyProfile,
  updateMyPassword,
  // Settings
  getGeneralSettings,
  updateGeneralSettings,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Subcategories
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  // Products
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductFile,
  removeProductFile,
  updateProductFileOrder,
  // Units
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  // Countries
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  // Carousel
  getCarouselItems,
  addCarouselImage,
  deleteCarouselItem,
  // Currency
  getCurrency,
};
