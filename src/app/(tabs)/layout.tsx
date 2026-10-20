import { AppGate } from "@/components/AppGate";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <AppGate>
      <TopBar />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </AppGate>
  );
}
