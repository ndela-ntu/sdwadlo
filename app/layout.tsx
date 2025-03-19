import ErrorBoundary from "@/components/layout/error-boundary";
import "./globals.css";
import { Montserrat } from "next/font/google";

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
    <html lang="en" className={`${montserrat.className}`} suppressHydrationWarning>
      <body className="bg-white text-black">
        <ErrorBoundary>
          <main className="h-full">{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
