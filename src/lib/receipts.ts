import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_RECEIPT_BYTES, RECEIPT_TYPES } from "@/lib/receipt-limits";

// shortcut: receipts live on local disk, so this needs object storage before
// the app runs on a read-only/serverless host (Vercel, containers without a volume).
// Kept outside public/ so the only way to read a receipt is the authorized
// /api/payments/[id]/receipt route.
export const RECEIPT_DIRECTORY = path.join(process.cwd(), ".data", "receipts");

const RECEIPT_URL = /^\/uploads\/receipts\/([0-9a-f-]{36}\.(jpg|png|pdf))$/i;

export function receiptFilenameFromUrl(url: string | null): string | null {
  if (!url) return null;
  return RECEIPT_URL.exec(url)?.[1] ?? null;
}

export async function saveReceipt(
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "Choose a receipt to upload." };
  if (file.size > MAX_RECEIPT_BYTES) {
    return { error: "The receipt must be 2 MB or smaller." };
  }

  const extension = RECEIPT_TYPES[file.type];
  if (!extension) return { error: "Upload a JPG, PNG or PDF file." };

  const filename = `${randomUUID()}.${extension}`;

  await mkdir(RECEIPT_DIRECTORY, { recursive: true });
  await writeFile(
    path.join(RECEIPT_DIRECTORY, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return { url: `/uploads/receipts/${filename}` };
}
