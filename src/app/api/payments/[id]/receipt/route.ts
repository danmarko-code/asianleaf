import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RECEIPT_DIRECTORY, receiptFilenameFromUrl } from "@/lib/receipts";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { householdId: true, receiptUrl: true },
  });
  if (!payment) return new Response("Payment not found", { status: 404 });

  // Admins review every payment; a homeowner may only open their own receipt.
  const authorized =
    user.role === "ADMIN" ||
    (user.role === "HOMEOWNER" && user.householdId === payment.householdId);
  if (!authorized) return new Response("Forbidden", { status: 403 });

  const filename = receiptFilenameFromUrl(payment.receiptUrl);
  if (!filename) return new Response("No receipt attached", { status: 404 });

  // The filename is validated by receiptFilenameFromUrl, so it cannot escape
  // the private receipts directory.
  let contents: Buffer;
  try {
    contents = await readFile(path.join(RECEIPT_DIRECTORY, filename));
  } catch {
    return new Response("Receipt not found", { status: 404 });
  }

  const extension = filename.split(".").pop() ?? "";
  return new Response(new Uint8Array(contents), {
    headers: {
      "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="receipt.${extension}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
