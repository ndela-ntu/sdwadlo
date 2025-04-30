import SideNav from "@/components/layout/side-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      {/* Fixed SideNav - now using fixed positioning */}
      <SideNav />
      
      {/* Scrollable Main Content */}
      <div className="flex-grow md:ml-72 m-1 p-3 border-2 border-black md:overflow-y-auto">
        {children}
      </div>
    </main>
  );
}