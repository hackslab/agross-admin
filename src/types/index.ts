// ============================================================================
// CORE API TYPES (matching admin-api-docs.md exactly)
// ============================================================================

// Admin Types
export interface Admin {
  id: string;
  name: string;
  username: string;
  isSuperadmin: boolean;
  email?: string; // May be added for profile management
  isActive?: boolean; // May be added for admin management
  createdAt?: string;
  lastLogin?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// API Response from POST /admin/login (only returns token)
export interface LoginApiResponse {
  accessToken: string;
}

// JWT Token Payload Structure
export interface JwtPayload {
  id: string;
  username: string;
  isSuperadmin: boolean; // Backend sends isSuperadmin (camelCase)
  iat: number;
  exp: number;
}

// Complete authenticated session object (used by frontend)
export interface AuthenticatedAdminSession {
  accessToken: string;
  admin: {
    id: string;
    username: string;
    isSuperadmin: boolean;
  };
}

// Keep LoginResponse as alias for backward compatibility
export type LoginResponse = AuthenticatedAdminSession;

export interface CreateAdminRequest {
  name: string;
  username: string;
  password: string;
  isSuperadmin?: boolean; // Defaults to false
}

export interface UpdateAdminRequest {
  name?: string;
  username?: string;
  email?: string;
  isSuperadmin?: boolean;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  // Scenario 1: Superadmin changes another admin's password
  adminId?: string;
  // Scenario 2: Admin changes own password
  oldPassword?: string;
  currentPassword?: string; // Alias for oldPassword
  // Both scenarios
  newPassword: string;
}

// Category Types (API: id, name, description, image)
export interface Category {
  id: string;
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  description_uz: string;
  description_en: string;
  description_ru: string;
  description_kz: string;
  image: string; // URL to uploaded image
  createdAt?: string;
}

export interface CreateCategoryRequest {
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  description_uz: string;
  description_en: string;
  description_ru: string;
  description_kz: string;
  // image uploaded via multipart/form-data
}

export interface UpdateCategoryRequest {
  name_uz?: string;
  name_en?: string;
  name_ru?: string;
  name_kz?: string;
  description_uz?: string;
  description_en?: string;
  description_ru?: string;
  description_kz?: string;
  // image uploaded via multipart/form-data (optional)
}

// Subcategory Types (API: id, name, categoryId)
export interface Subcategory {
  id: string;
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  categoryId: string;
  createdAt?: string;
}

export interface CreateSubcategoryRequest {
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  categoryId: string;
}

export interface UpdateSubcategoryRequest {
  name_uz?: string;
  name_en?: string;
  name_ru?: string;
  name_kz?: string;
  categoryId?: string;
}

// Product Types (matching API docs and Prisma schema)
export interface Product {
  id: string;
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  description_uz: string;
  description_en: string;
  description_ru: string;
  description_kz: string;
  price: number;
  structure_uz: string;
  structure_en: string;
  structure_ru: string;
  structure_kz: string;
  quantity: number; // Available quantity (stock_quantity)
  unitId?: string; // Unit ID reference
  viewCount?: number;
  categoryId: string;
  subcategoryId: string;
  countryId?: string;
  isDeleted?: boolean; // Soft delete flag
  files?: ProductFile[];
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
  subcategory?: Subcategory;
  country?: Country;
  unit?: Unit;
}

export interface CreateProductRequest {
  name_uz: string;
  name_en: string;
  name_ru: string;
  name_kz: string;
  description_uz: string;
  description_en: string;
  description_ru: string;
  description_kz: string;
  price: number;
  structure_uz: string;
  structure_en: string;
  structure_ru: string;
  structure_kz: string;
  quantity: number;
  unitId?: string;
  categoryId: string;
  subcategoryId: string;
  countryId: string;
}

export interface UpdateProductRequest {
  name_uz?: string;
  name_en?: string;
  name_ru?: string;
  name_kz?: string;
  description_uz?: string;
  description_en?: string;
  description_ru?: string;
  description_kz?: string;
  price?: number;
  structure_uz?: string;
  structure_en?: string;
  structure_ru?: string;
  structure_kz?: string;
  quantity?: number;
  unitId?: string;
  categoryId?: string;
  subcategoryId?: string;
  countryId?: string;
}

// Product File (Image/Video) Type
export interface ProductFile {
  id: string;
  isVideo: boolean;
  url: string;
  productId: string;
}

// Product File Order Types
export interface FileOrderDto {
  fileId: string;
  order: number;
}

export interface UpdateFileOrderRequest {
  files: FileOrderDto[];
}

// Unit Type (API: id, name)
export interface Unit {
  id: string;
  name: string;
}

// Country Type (API: id, name)
export interface Country {
  id: string;
  name: string;
}

export interface CreateCountryRequest {
  name: string;
}

// Currency Type (Exchange Rate)
export interface Currency {
  buy: number;
  sell: number;
}

export interface UpdateCountryRequest {
  name: string;
}

// Carousel Type (API: id, file)
export interface CarouselItem {
  id: string;
  file: string; // URL to uploaded image
}

// ============================================================================
// DASHBOARD & ACTIVITY TYPES
// ============================================================================

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalViews: number;
  lowStockProducts: number;
}

export interface ActivityLog {
  id: string;
  adminUserName: string;
  actionType: "created" | "updated" | "deleted";
  entityType: "Product" | "Category" | "Subcategory" | "User" | "Offer";
  entityName: string;
  createdAt: string;
  details?: string | Record<string, unknown>;
}

// Backend Log model (from Prisma)
export interface Log {
  id: string;
  adminId: string;
  admin?: {
    id: string;
    name: string;
    username: string;
  };
  actionType: "created" | "updated" | "deleted";
  entityType:
    | "Product"
    | "Category"
    | "Subcategory"
    | "Admin"
    | "User"
    | "Offer";
  oldData: string | null;
  newData: string | null;
  createdAt: string;
}

// Legacy AdminActivityLog (for admin management logs)
export interface AdminActivityLog {
  id: string;
  timestamp: string;
  adminUserName: string; // Admin who performed the action
  targetUserName: string; // Admin who was affected
  action:
    | "created"
    | "updated"
    | "deleted"
    | "status_changed"
    | "password_changed";
  details: string;
}

// ============================================================================
// ORDER MANAGEMENT TYPES (User-facing orders)
// ============================================================================

export interface UserOrder {
  order_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  order_date: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  total_amount: number;
  payment_method: string;
  delivery_address: string;
  items: OrderItem[];
  notes?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ============================================================================
// SETTINGS & CONFIGURATION TYPES
// ============================================================================

export interface GeneralSettings {
  siteName: string;
  contactEmail: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type AdminRole = "superadmin" | "admin";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type ActivityAction = "created" | "updated" | "deleted";
export type EntityType =
  | "Product"
  | "Category"
  | "Subcategory"
  | "User"
  | "Offer"
  | "Admin";
