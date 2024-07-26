import { initialProfile } from "@/lib/initial-profile";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await initialProfile();

  if (!profile) {
    redirect("/");
  }

  return <>{children}</>;
}
