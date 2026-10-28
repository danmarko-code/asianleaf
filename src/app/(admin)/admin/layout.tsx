import { AdminShell } from "@/components/admin/admin-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("ADMIN");

  return (
    <AdminShell user={{ email: user.email, name: user.member?.firstName ?? "Administrator" }}>
      {children}
    </AdminShell>
  );
}
