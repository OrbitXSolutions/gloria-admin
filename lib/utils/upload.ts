import { createClient } from "@/lib/supabase/client";
import { SupabaseStorageBuckets } from "@/lib/constants/supabase-storage";

/**
 * Upload a single file to Supabase storage
 * @param file - The file to upload
 * @param folder - The folder within the products bucket
 * @param fileName - Optional custom filename
 * @returns Only the filename (not the full path) for database storage
 */
export async function uploadFile(
  file: File,
  folder: "products" | "categories" | "users" = "products",
  fileName?: string
): Promise<string> {
  const supabase = createClient();

  // Generate a unique filename if not provided
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const finalFileName =
    fileName ||
    `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

  // Map folder parameter to storage folder path
  const folderMappings = {
    products: SupabaseStorageBuckets.IMAGES.folders.PRODUCTS,
    categories: SupabaseStorageBuckets.IMAGES.folders.CATEGORIES,
    users: SupabaseStorageBuckets.IMAGES.folders.USERS,
  };

  const folderPath = folderMappings[folder];
  const filePath = folderPath
    ? `${folderPath}/${finalFileName}`
    : finalFileName;

  const { data, error } = await supabase.storage
    .from(SupabaseStorageBuckets.IMAGES.name)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true, // Allow overwriting if file exists
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Return only the filename, not the full path
  return finalFileName;
}

/**
 * Upload multiple files to Supabase storage
 * @param files - Array of files to upload
 * @param folder - The folder within the products bucket
 * @returns Array of uploaded filenames (not full paths)
 */
export async function uploadFiles(
  files: File[],
  folder: "products" | "categories" | "users" = "products"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase storage
 * @param fileName - The filename to delete (from database)
 * @param folder - The folder where the file is stored
 * @returns Promise that resolves when file is deleted
 */
export async function deleteFile(
  fileName: string,
  folder: "products" | "categories" | "users" = "products"
): Promise<void> {
  const supabase = createClient();

  // Map folder parameter to storage folder path
  const folderMappings = {
    products: SupabaseStorageBuckets.IMAGES.folders.PRODUCTS,
    categories: SupabaseStorageBuckets.IMAGES.folders.CATEGORIES,
    users: SupabaseStorageBuckets.IMAGES.folders.USERS,
  };

  const folderPath = folderMappings[folder];
  const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(SupabaseStorageBuckets.IMAGES.name)
    .remove([fullPath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase storage
 * @param fileNames - Array of filenames to delete (from database)
 * @param folder - The folder where the files are stored
 * @returns Promise that resolves when all files are deleted
 */
export async function deleteFiles(
  fileNames: string[],
  folder: "products" | "categories" | "users" = "products"
): Promise<void> {
  const supabase = createClient();

  // Map folder parameter to storage folder path
  const folderMappings = {
    products: SupabaseStorageBuckets.IMAGES.folders.PRODUCTS,
    categories: SupabaseStorageBuckets.IMAGES.folders.CATEGORIES,
    users: SupabaseStorageBuckets.IMAGES.folders.USERS,
  };

  const folderPath = folderMappings[folder];
  const fullPaths = fileNames.map((fileName) =>
    folderPath ? `${folderPath}/${fileName}` : fileName
  );

  const { error } = await supabase.storage
    .from(SupabaseStorageBuckets.IMAGES.name)
    .remove(fullPaths);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
