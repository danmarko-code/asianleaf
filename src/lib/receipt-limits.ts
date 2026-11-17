// Shared by the upload action (server) and the file input (client), so it must
// stay free of Node imports.
export const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;

export const RECEIPT_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

export const RECEIPT_HINT = "JPG, PNG or PDF, up to 2 MB.";

export const RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};
