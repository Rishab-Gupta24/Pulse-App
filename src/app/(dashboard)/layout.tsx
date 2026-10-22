import DataSync from "@/components/layout/DataSync";
import LiquidGlassBar from "@/components/layout/LiquidGlassBar";

// Responsive shell: tab bar on iPhone, sidebar on Laptop (design.md §5).
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DataSync />
      <LiquidGlassBar />
      <div className="md:pl-60">
        {/* viewport-fit=cover lets content reach under the status bar; pad by the safe area. */}
        <main className="mx-auto max-w-[880px] px-4 pt-[env(safe-area-inset-top)] pb-[calc(112px+env(safe-area-inset-bottom))] md:px-8 md:pb-12">
          {children}
        </main>
      </div>
    </>
  );
}
