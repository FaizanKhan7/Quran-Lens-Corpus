import type { Metadata } from "next";
import { TokenShowcase } from "@/components/ui/TokenShowcase";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Design Tokens",
};

export default function DesignTokensPage() {
  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <TokenShowcase />
      </main>
      <BottomNav />
    </>
  );
}
