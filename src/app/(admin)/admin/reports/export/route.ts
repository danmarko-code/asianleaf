import { getSessionUser } from "@/lib/auth";
import { buildReport, isReportKey, toCsv } from "@/lib/reports";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "unpaid";
  if (!isReportKey(report)) {
    return new Response("Unknown report", { status: 400 });
  }

  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const table = await buildReport(report, from, to);

  return new Response(toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asianleaf-${report}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
