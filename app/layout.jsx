import "./globals.css";
import AnimatedBackground from "../components/Animatedbg"

export const metadata = {
  title: "Memory Voice Avatar",
  description: "Talk to AI versions of people you care about",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-[#08070f] text-white antialiased">

        {/* Global styles: shimmer heading animation */}
        <style>{`
          @keyframes shimmer-sweep {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          .heading-shimmer {
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.55) 0%,
              rgba(255,255,255,0.55) 30%,
              #f5c97a 38%,
              #e8a84a 43%,
              #c9986a 48%,
              #f5c97a 53%,
              rgba(255,255,255,0.55) 60%,
              rgba(255,255,255,0.55) 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer-sweep 3s linear infinite;
          }
        `}</style>

        {/* Animated canvas background — renders on every page */}
        <AnimatedBackground />

        {/* Page content sits above the background */}
        <div className="relative z-10">
          {children}
        </div>

      </body>
    </html>
  );
}