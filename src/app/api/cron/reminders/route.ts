import { runDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a secret the endpoint is only usable in development. Production
  // deployments must set CRON_SECRET.
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("secret") ?? "";

  return bearer === secret || query === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDueReminders();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Reminder job failed", error);
    return Response.json(
      { ok: false, error: "Reminder job failed" },
      { status: 500 },
    );
  }
}
