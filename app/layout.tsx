import ErrorBoundary from "@/components/layout/error-boundary";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { LowStockProvider } from "@/context/low-stock-contex";
import { Toaster } from "@/components/ui/toaster";
import { MissingMediaProvider } from "@/context/missing-media-context";
import { PendingOrdersProvider } from "@/context/pending-orders-context";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "SDWADLO Admin",
  description: "Sdwadlo admin portal",
};

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.className}`}
      suppressHydrationWarning
    >
      <body className="bg-white text-black">
        <ErrorBoundary>
          <PendingOrdersProvider>
            <MissingMediaProvider>
              <LowStockProvider>
                <main className="h-full">{children}</main>
                <Toaster />
              </LowStockProvider>
            </MissingMediaProvider>
          </PendingOrdersProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
