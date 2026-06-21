import { Outfit } from "next/font/google";
import "./globals.css";
import { UserProvider } from "../lib/UserContext";
import Navbar from "../components/Navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "CoRide - Smart & Sustainable Carpooling Platform",
  description: "Connect with drivers, split travel costs, earn government Nabogo subsidies, and claim campus parking rewards. Share the ride, save the planet.",
  keywords: "carpooling, ride sharing, sustainable transport, Nabogo subsidies, campus parking rewards, CoRide",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col bg-brand-dark text-white">
        <UserProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          
          {/* Footer */}
          <footer className="py-8 px-4 border-t border-white/5 bg-brand-dark/80 text-center text-xs text-brand-text-muted">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>&copy; {new Date().getFullYear()} CoRide Inc. All rights reserved.</p>
              <div className="flex gap-4">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                <span className="hover:text-white transition-colors cursor-pointer">Safety Guidelines</span>
              </div>
            </div>
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
