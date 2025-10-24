# Agross Admin API Documentation

This document provides a comprehensive guide for developers and administrators on how to use the authenticated, management-focused endpoints of the Agross backend API. All endpoints listed here require a valid JSON Web Token (JWT) for authentication.

The base URL for all API endpoints is `http://localhost:3000`.

## File Upload Policy

**Important Security Notice**: All media assets (images, videos) must be uploaded as files via their respective `multipart/form-data` endpoints. The system does not support and will reject requests that attempt to associate media by passing direct URLs in JSON payloads. This approach enhances security by preventing Server-Side Request Forgery (SSRF) vulnerabilities and ensures all media is stored in the application's designated storage.

For products, files are managed through separate endpoints after product creation:

- Create product first using JSON payload (without files)
- Add files using the dedicated `POST /products/:id/files` endpoint

## Authentication

To access the protected admin endpoints, you must first obtain a JWT Bearer token by authenticating against the login endpoint.

### Admin Login

- **Method**: `POST`
- **Endpoint**: `/admin/login`
- **Description**: Authenticates an admin user and returns a JWT access token.
- **Authentication**: `Public`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `username` (`string`): The admin's username (required).
- `password` (`string`): The admin's password (required, min length 8).

**Example (`application/json`):**

```json
{
  "username": "superadmin",
  "password": "password123"
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Invalid credentials provided.

---

Once you have the `accessToken`, include it in the `Authorization` header for all subsequent requests to protected endpoints:

`Authorization: Bearer <your_access_token>`

---

## Currency

Endpoint for retrieving the current USD exchange rate.

### Get Current USD Exchange Rate

- **Method**: `GET`
- **Endpoint**: `/currency`
- **Description**: Retrieves the current buy and sell rates for USD.
- **Authentication**: `Public`

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "buy": 12060.0,
    "sell": 12180.0
  }
  ```

---

## Admin Management

Endpoints for managing admin and superadmin accounts. All endpoints in this section require superadmin privileges.

### Create New Admin

- **Method**: `POST`
- **Endpoint**: `/admin`
- **Description**: Creates a new admin or superadmin account.
- **Authentication**: `Required (Superadmin)`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name` (`string`): The full name of the admin (required).
- `username` (`string`): The unique username for logging in (required).
- `password` (`string`): The admin's password (required, min length 8).
- `isSuperadmin` (`boolean`): Set to `true` to create a superadmin. Defaults to `false` (optional).

**Example (`application/json`):**

```json
{
  "name": "New Admin",
  "username": "newadmin",
  "password": "password123",
  "isSuperadmin": false
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name": "New Admin",
    "username": "newadmin",
    "isSuperadmin": false
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User is not a superadmin.

### Get All Admins

- **Method**: `GET`
- **Endpoint**: `/admin`
- **Description**: Retrieves a list of all admin accounts.
- **Authentication**: `Required (Superadmin)`

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  [
    {
      "id": "uuid-string-goes-here",
      "name": "Superadmin",
      "username": "superadmin",
      "isSuperadmin": true
    },
    {
      "id": "another-uuid-string",
      "name": "New Admin",
      "username": "newadmin",
      "isSuperadmin": false
    }
  ]
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User is not a superadmin.

### Get Admin by ID

- **Method**: `GET`
- **Endpoint**: `/admin/:id`
- **Description**: Retrieves a single admin account by its unique identifier.
- **Authentication**: `Required (Superadmin)`

#### Parameters

| Name | Type   | In   | Description                         |
| ---- | ------ | ---- | ----------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the admin. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name": "New Admin",
    "username": "newadmin",
    "isSuperadmin": false
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User is not a superadmin.
  - `404 Not Found`: The requested admin does not exist.

### Update Admin

- **Method**: `PATCH`
- **Endpoint**: `/admin/:id`
- **Description**: Updates an existing admin's details.
- **Authentication**: `Required (Superadmin)`

#### Parameters

| Name | Type   | In   | Description                                   |
| ---- | ------ | ---- | --------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the admin to update. |

#### Request Body

This endpoint accepts an `application/json` payload with any of the fields from the "Create New Admin" request, except `password`. To change passwords, use the "Change Admin Password" endpoint.

**Example (`application/json`):**

```json
{
  "name": "Updated Admin Name",
  "isSuperadmin": true
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name": "Updated Admin Name",
    "username": "newadmin",
    "isSuperadmin": true
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User is not a superadmin, or is trying to demote the last superadmin.
  - `404 Not Found`: The requested admin does not exist.

### Change Admin Password

- **Method**: `PATCH`
- **Endpoint**: `/admin/change-password`
- **Description**: Changes an admin user's password.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts an `application/json` payload. There are two scenarios:

1. Superadmin changes another admin's password:
   - `adminId` (`UUID`): The ID of the admin whose password should be changed (required for this scenario).
   - `newPassword` (`string`): The new password (required, min length 8).

   Example (`application/json`):

   ```json
   {
     "adminId": "uuid-of-target-admin",
     "newPassword": "a-very-strong-password"
   }
   ```

2. Admin changes their own password:
   - `oldPassword` (`string`): The current password (required).
   - `newPassword` (`string`): The new password (required, min length 8).

   Example (`application/json`):

   ```json
   {
     "oldPassword": "my_current_password",
     "newPassword": "my_new_strong_password"
   }
   ```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**

  ```json
  {
    "id": "uuid-string-goes-here",
    "name": "Admin Name",
    "username": "adminusername",
    "isSuperadmin": false
  }
  ```

- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: Old password missing/invalid when changing own password.
  - `404 Not Found`: `adminId` does not exist (when provided).

### Delete Admin

- **Method**: `DELETE`
- **Endpoint**: `/admin/:id`
- **Description**: Deletes an admin account.
- **Authentication**: `Required (Superadmin)`

#### Parameters

| Name | Type   | In   | Description                                   |
| ---- | ------ | ---- | --------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the admin to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name": "Updated Admin Name",
    "username": "newadmin",
    "isSuperadmin": true
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User is not a superadmin, or is trying to delete the last superadmin.
  - `404 Not Found`: The requested admin does not exist.

---

## Category Management

Endpoints for creating, updating, and deleting product categories.

### Create New Category

- **Method**: `POST`
- **Endpoint**: `/categories`
- **Description**: Creates a new product category and uploads an associated image. The image must be provided as a file upload via multipart/form-data.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts a `multipart/form-data` payload.

**Fields:**

- `name_ru` (`string`): The name of the category in Russian (required).
- `name_en` (`string`): The name of the category in English (required).
- `name_uz` (`string`): The name of the category in Uzbek (required).
- `name_kz` (`string`): The name of the category in Kazakh (required).
- `description_ru` (`string`): A description for the category in Russian (required).
- `description_en` (`string`): A description for the category in English (required).
- `description_uz` (`string`): A description for the category in Uzbek (required).
- `description_kz` (`string`): A description for the category in Kazakh (required).
- `image` (`File`): The image file for the category (required).

**Example (`multipart/form-data`):**

- `name_ru`: (Text) "Фрукты"
- `name_en`: (Text) "Fruits"
- `name_uz`: (Text) "Mevalar"
- `name_kz`: (Text) "Жемістер"
- `description_ru`: (Text) "Свежие и сочные фрукты."
- `description_en`: (Text) "Fresh and juicy fruits."
- `description_uz`: (Text) "Yangi va sersuv mevalar."
- `description_kz`: (Text) "Жаңа піскен және шырынды жемістер."
- `image`: (File) The file to be uploaded.

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Фрукты",
    "name_en": "Fruits",
    "name_uz": "Mevalar",
    "name_kz": "Жемістер",
    "description_ru": "Свежие и сочные фрукты.",
    "description_en": "Fresh and juicy fruits.",
    "description_uz": "Yangi va sersuv mevalar.",
    "description_kz": "Жаңа піскен және шырынды жемістер.",
    "image": "https://your-storage-url.com/categories/image.jpg"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Update Category

- **Method**: `PATCH`
- **Endpoint**: `/categories/:id`
- **Description**: Updates an existing category's details and optionally replaces its image. If updating the image, it must be provided as a file upload via multipart/form-data.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                      |
| ---- | ------ | ---- | ------------------------------------------------ |
| `id` | `UUID` | Path | The unique identifier of the category to update. |

#### Request Body

This endpoint accepts a `multipart/form-data` payload. All fields are optional.

**Fields:**

- `name_ru` (`string`): The new name of the category in Russian.
- `name_en` (`string`): The new name of the category in English.
- `name_uz` (`string`): The new name of the category in Uzbek.
- `name_kz` (`string`): The new name of the category in Kazakh.
- `description_ru` (`string`): The new description for the category in Russian.
- `description_en` (`string`): The new description for the category in English.
- `description_uz` (`string`): The new description for the category in Uzbek.
- `description_kz` (`string`): The new description for the category in Kazakh.
- `image` (`File`): A new image file to replace the existing one.

**Example (`multipart/form-data`):**

- `name_en`: (Text) "Organic Fruits"
- `description_en`: (Text) "Fresh and juicy organic fruits."
- `image`: (File) The new file to be uploaded.

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Фрукты",
    "name_en": "Organic Fruits",
    "name_uz": "Mevalar",
    "name_kz": "Жемістер",
    "description_ru": "Свежие и сочные фрукты.",
    "description_en": "Fresh and juicy organic fruits.",
    "description_uz": "Yangi va sersuv mevalar.",
    "description_kz": "Жаңа піскен және шырынды жемістер.",
    "image": "https://your-storage-url.com/categories/new-image.jpg"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested category does not exist.

### Delete Category

- **Method**: `DELETE`
- **Endpoint**: `/categories/:id`
- **Description**: Deletes a category and its associated image from storage.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                      |
| ---- | ------ | ---- | ------------------------------------------------ |
| `id` | `UUID` | Path | The unique identifier of the category to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Фрукты",
    "name_en": "Organic Fruits",
    "name_uz": "Mevalar",
    "name_kz": "Жемістер",
    "description_ru": "Свежие и сочные фрукты.",
    "description_en": "Fresh and juicy organic fruits.",
    "description_uz": "Yangi va sersuv mevalar.",
    "description_kz": "Жаңа піскен және шырынды жемістер.",
    "image": "https://your-storage-url.com/categories/new-image.jpg"
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested category does not exist.

---

## Subcategory Management

Endpoints for managing subcategories, which are nested under main categories.

### Create New Subcategory

- **Method**: `POST`
- **Endpoint**: `/subcategories`
- **Description**: Creates a new subcategory linked to a parent category.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name_ru` (`string`): The name of the subcategory in Russian (required).
- `name_en` (`string`): The name of the subcategory in English (required).
- `name_uz` (`string`): The name of the subcategory in Uzbek (required).
- `name_kz` (`string`): The name of the subcategory in Kazakh (required).
- `categoryId` (`UUID`): The ID of the parent category (required).

**Example (`application/json`):**

```json
{
  "name_ru": "Цитрусовые",
  "name_en": "Citrus",
  "name_uz": "Sitrus mevalar",
  "name_kz": "Цитрусты жемістер",
  "categoryId": "parent-category-uuid"
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Цитрусовые",
    "name_en": "Citrus",
    "name_uz": "Sitrus mevalar",
    "name_kz": "Цитрусты жемістер",
    "categoryId": "parent-category-uuid"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Update Subcategory

- **Method**: `PATCH`
- **Endpoint**: `/subcategories/:id`
- **Description**: Updates an existing subcategory's details.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                         |
| ---- | ------ | ---- | --------------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the subcategory to update. |

#### Request Body

This endpoint accepts an `application/json` payload. All fields are optional.

**Fields:**

- `name_ru` (`string`): The new name of the subcategory in Russian.
- `name_en` (`string`): The new name of the subcategory in English.
- `name_uz` (`string`): The new name of the subcategory in Uzbek.
- `name_kz` (`string`): The new name of the subcategory in Kazakh.
- `categoryId` (`UUID`): The new parent category ID.

**Example (`application/json`):**

```json
{
  "name_en": "Tropical Fruits"
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Цитрусовые",
    "name_en": "Tropical Fruits",
    "name_uz": "Sitrus mevalar",
    "name_kz": "Цитрусты жемістер",
    "categoryId": "parent-category-uuid"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested subcategory does not exist.

### Delete Subcategory

- **Method**: `DELETE`
- **Endpoint**: `/subcategories/:id`
- **Description**: Deletes a subcategory.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                         |
| ---- | ------ | ---- | --------------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the subcategory to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "uuid-string-goes-here",
    "name_ru": "Цитрусовые",
    "name_en": "Tropical Fruits",
    "name_uz": "Sitrus mevalar",
    "name_kz": "Цитрусты жемістер",
    "categoryId": "parent-category-uuid"
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested subcategory does not exist.

---

## Product Management

Endpoints for managing products.

### Create New Product

- **Method**: `POST`
- **Endpoint**: `/products`
- **Description**: Creates a new product without files. Product files (images/videos) must be added separately using the dedicated file upload endpoint (`POST /products/:id/files`) after product creation. This separation ensures security and proper file handling.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name_ru` (`string`): Product name in Russian (required).
- `name_en` (`string`): Product name in English (required).
- `name_uz` (`string`): Product name in Uzbek (required).
- `name_kz` (`string`): Product name in Kazakh (required).
- `description_ru` (`string`): Product description in Russian (required).
- `description_en` (`string`): Product description in English (required).
- `description_uz` (`string`): Product description in Uzbek (required).
- `description_kz` (`string`): Product description in Kazakh (required).
- `price` (`number`): Product price (required).
- `structure_ru` (`string`): Product structure details in Russian (required).
- `structure_en` (`string`): Product structure details in English (required).
- `structure_uz` (`string`): Product structure details in Uzbek (required).
- `structure_kz` (`string`): Product structure details in Kazakh (required).
- `quantity` (`integer`): Available quantity (required).
- `unitId` (`UUID`): Unit ID (required).
- `categoryId` (`UUID`): Parent category ID (required).
- `subcategoryId` (`UUID`): Parent subcategory ID (required).
- `countryId` (`UUID`): Country of origin ID (required).

**Example (`application/json`):**

```json
{
  "name_ru": "Органические яблоки",
  "name_en": "Organic Apples",
  "name_uz": "Organik olmalar",
  "name_kz": "Органикалық алмалар",
  "description_ru": "Хрустящие и вкусные органические яблоки.",
  "description_en": "Crisp and delicious organic apples.",
  "description_uz": "Qarsildoq va mazali organik olmalar.",
  "description_kz": "Қытырлақ және дәмді органикалық алмалар.",
  "price": 299.99,
  "structure_ru": "Белки, жиры, углеводы",
  "structure_en": "Proteins, fats, carbohydrates",
  "structure_uz": "Oqsillar, yog'lar, uglevodlar",
  "structure_kz": "Ақуыздар, майлар, көмірсулар",
  "quantity": 100,
  "unitId": "unit-uuid",
  "categoryId": "category-uuid",
  "subcategoryId": "subcategory-uuid",
  "countryId": "country-uuid"
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "product-uuid-goes-here",
    "name_ru": "Органические яблоки",
    "name_en": "Organic Apples",
    "name_uz": "Organik olmalar",
    "name_kz": "Органикалық алмалар",
    "description_ru": "Хрустящие и вкусные органические яблоки.",
    "description_en": "Crisp and delicious organic apples.",
    "description_uz": "Qarsildoq va mazali organik olmalar.",
    "description_kz": "Қытырлақ және дәмді органикалық алмалар.",
    "price": 299.99,
    "structure_ru": "Белки, жиры, углеводы",
    "structure_en": "Proteins, fats, carbohydrates",
    "structure_uz": "Oqsillar, yog'lar, uglevodlar",
    "structure_kz": "Ақуыздар, майлар, көмірсулар",
    "quantity": 100,
    "unitId": "unit-uuid",
    "viewCount": 0,
    "categoryId": "category-uuid",
    "subcategoryId": "subcategory-uuid",
    "countryId": "country-uuid"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Update Product

- **Method**: `PATCH`
- **Endpoint**: `/products/:id`
- **Description**: Updates an existing product's details.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                     |
| ---- | ------ | ---- | ----------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the product to update. |

#### Request Body

This endpoint accepts an `application/json` payload with any of the fields from the "Create New Product" request.

**Example (`application/json`):**

```json
{
  "price": 349.5,
  "quantity": 150
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "product-uuid-goes-here",
    "name_ru": "Органические яблоки",
    "name_en": "Organic Apples",
    "name_uz": "Organik olmalar",
    "name_kz": "Органикалық алмалар",
    "description_ru": "Хрустящие и вкусные органические яблоки.",
    "description_en": "Crisp and delicious organic apples.",
    "description_uz": "Qarsildoq va mazali organik olmalar.",
    "description_kz": "Қытырлақ және дәмді органикалық алмалар.",
    "price": 349.5,
    "quantity": 150,
    "...": "..."
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested product does not exist.

### Delete Product (Soft Delete)

- **Method**: `DELETE`
- **Endpoint**: `/products/:id`
- **Description**: Soft deletes a product by setting its `isDeleted` flag to `true`. The product is not permanently removed from the database.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                     |
| ---- | ------ | ---- | ----------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the product to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "product-uuid-goes-here",
    "isDeleted": true,
    "...": "..."
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested product does not exist.

### Add File to Product

- **Method**: `POST`
- **Endpoint**: `/products/:id/files`
- **Description**: Uploads an image or video and associates it with a product. Files are automatically assigned a sequential order number.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name      | Type      | In    | Description                                                 |
| --------- | --------- | ----- | ----------------------------------------------------------- |
| `id`      | `UUID`    | Path  | The unique identifier of the product.                       |
| `isVideo` | `boolean` | Query | Set to `true` if the file is a video, `false` for an image. |

#### Request Body

This endpoint accepts a `multipart/form-data` payload.

**Fields:**

- `file` (`File`): The image or video file to upload (required).

**Example (`multipart/form-data`):**

- `file`: (File) The file to be uploaded.

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "file-uuid-goes-here",
    "isVideo": false,
    "url": "https://your-storage-url.com/products/image.jpg",
    "order": 0,
    "productId": "product-uuid-goes-here"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The specified product does not exist.

### Remove File from Product

- **Method**: `DELETE`
- **Endpoint**: `/products/:productId/files/:fileId`
- **Description**: Deletes a file associated with a product and removes it from storage. Remaining files are automatically re-sequenced to maintain consecutive order numbers.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name        | Type   | In   | Description                                  |
| ----------- | ------ | ---- | -------------------------------------------- |
| `productId` | `UUID` | Path | The unique identifier of the product.        |
| `fileId`    | `UUID` | Path | The unique identifier of the file to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "message": "File removed and order updated successfully."
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The specified product or file does not exist.

### Update Product File Order

- **Method**: `PATCH`
- **Endpoint**: `/products/:productId/files/order`
- **Description**: Updates the display order of files associated with a product. Allows reordering multiple files in a single request.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name        | Type   | In   | Description                           |
| ----------- | ------ | ---- | ------------------------------------- |
| `productId` | `UUID` | Path | The unique identifier of the product. |

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `files` (`Array<FileOrderDto>`): Array of file ordering objects (required).
  - `fileId` (`UUID`): The unique identifier of the file (required).
  - `order` (`integer`): The new order position for the file (required).

**Example (`application/json`):**

```json
{
  "files": [
    {
      "fileId": "file-uuid-1",
      "order": 0
    },
    {
      "fileId": "file-uuid-2",
      "order": 1
    },
    {
      "fileId": "file-uuid-3",
      "order": 2
    }
  ]
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "message": "File order updated successfully."
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The specified product or one of the files does not exist.

---

## Country Management

Endpoints for managing countries of origin for products.

### Create New Country

- **Method**: `POST`
- **Endpoint**: `/countries`
- **Description**: Creates a new country.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name` (`string`): The name of the country (required).

**Example (`application/json`):**

```json
{
  "name": "Brazil"
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "country-uuid-goes-here",
    "name": "Brazil"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Update Country

- **Method**: `PATCH`
- **Endpoint**: `/countries/:id`
- **Description**: Updates an existing country's name.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                     |
| ---- | ------ | ---- | ----------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the country to update. |

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name` (`string`): The new name for the country.

**Example (`application/json`):**

```json
{
  "name": "Federative Republic of Brazil"
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "country-uuid-goes-here",
    "name": "Federative Republic of Brazil"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested country does not exist.

### Delete Country

- **Method**: `DELETE`
- **Endpoint**: `/countries/:id`
- **Description**: Deletes a country.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                     |
| ---- | ------ | ---- | ----------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the country to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "country-uuid-goes-here",
    "name": "Federative Republic of Brazil"
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested country does not exist.

---

## Unit Management

Endpoints for managing product units (e.g., kg, piece, liter).

### Create New Unit

- **Method**: `POST`
- **Endpoint**: `/units`
- **Description**: Creates a new unit.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name` (`string`): The name of the unit (required).

**Example (`application/json`):**

```json
{
  "name": "Kilogram"
}
```

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "unit-uuid-goes-here",
    "name": "Kilogram"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Update Unit

- **Method**: `PATCH`
- **Endpoint**: `/units/:id`
- **Description**: Updates an existing unit's name.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                  |
| ---- | ------ | ---- | -------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the unit to update. |

#### Request Body

This endpoint accepts an `application/json` payload.

**Fields:**

- `name` (`string`): The new name for the unit.

**Example (`application/json`):**

```json
{
  "name": "kg"
}
```

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "unit-uuid-goes-here",
    "name": "kg"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested unit does not exist.

### Delete Unit

- **Method**: `DELETE`
- **Endpoint**: `/units/:id`
- **Description**: Deletes a unit.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                  |
| ---- | ------ | ---- | -------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the unit to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "unit-uuid-goes-here",
    "name": "kg"
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested unit does not exist.

---

## Carousel Management

Endpoints for managing the home page carousel images.

### Add Carousel Image

- **Method**: `POST`
- **Endpoint**: `/carousel`
- **Description**: Uploads an image to be displayed in the carousel.
- **Authentication**: `Required (Admin)`

#### Request Body

This endpoint accepts a `multipart/form-data` payload.

**Fields:**

- `file` (`File`): The image file to upload (required).

**Example (`multipart/form-data`):**

- `file`: (File) The file to be uploaded.

#### Responses

- **Success Response (`201 Created`)**
  **Example:**
  ```json
  {
    "id": "carousel-item-uuid",
    "file": "https://your-storage-url.com/carousel/image.jpg"
  }
  ```
- **Error Responses**
  - `400 Bad Request`: Invalid input data provided.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### Delete Carousel Image

- **Method**: `DELETE`
- **Endpoint**: `/carousel/:id`
- **Description**: Deletes a carousel image.
- **Authentication**: `Required (Admin)`

#### Parameters

| Name | Type   | In   | Description                                           |
| ---- | ------ | ---- | ----------------------------------------------------- |
| `id` | `UUID` | Path | The unique identifier of the carousel item to delete. |

#### Responses

- **Success Response (`200 OK`)**
  **Example:**
  ```json
  {
    "id": "carousel-item-uuid",
    "file": "https://your-storage-url.com/carousel/image.jpg"
  }
  ```
- **Error Responses**
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: The requested carousel item does not exist.
