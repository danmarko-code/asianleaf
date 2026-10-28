import { HomeownerShell } from "@/components/homeowner/homeowner-shell";
import { requireRole } from "@/lib/auth";

export default async function HomeownerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("HOMEOWNER");

  return (
    <HomeownerShell
      user={{
        email: user.email,
        name: user.member?.firstName ?? "Homeowner",
        unit: user.household?.unitAddress ?? null,
      }}
    >
      {children}
    </HomeownerShell>
  );
}
