import SideNav from "@/components/layout/side-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow m-1 md:overflow-y-auto px-1 py-3 md:2 border-2 border-black">
        {children}
      </div>
    </main>
  );
}
