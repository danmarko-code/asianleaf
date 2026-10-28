import { HomeownerShell } from "@/components/homeowner/homeowner-shell";

export default function HomeownerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <HomeownerShell>{children}</HomeownerShell>;
}
