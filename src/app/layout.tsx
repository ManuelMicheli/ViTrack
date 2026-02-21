import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViTrack - Tracker Calorie e Allenamenti",
  description:
    "Monitora calorie, macronutrienti e allenamenti tramite Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" data-theme="dark">
      <body className="font-body antialiased bg-background text-text-primary">
        {/* Inline loading screen — visible immediately before JS hydrates */}
        <div id="vt-preloader" suppressHydrationWarning style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", transition: "opacity 0.2s", pointerEvents: "none" }}>
          <svg width="96" height="48" viewBox="0 0 96 48" fill="none">
            <style>{`
              @keyframes vt-draw-v { from { stroke-dashoffset: 80 } to { stroke-dashoffset: 0 } }
              @keyframes vt-draw-tbar { from { stroke-dashoffset: 45 } to { stroke-dashoffset: 0 } }
              @keyframes vt-draw-tstem { from { stroke-dashoffset: 35 } to { stroke-dashoffset: 0 } }
              #vt-v { stroke-dasharray: 80; stroke-dashoffset: 80; animation: vt-draw-v 0.4s ease-out 0.1s forwards }
              #vt-tbar { stroke-dasharray: 45; stroke-dashoffset: 45; animation: vt-draw-tbar 0.25s ease-out 0.3s forwards }
              #vt-tstem { stroke-dasharray: 35; stroke-dashoffset: 35; animation: vt-draw-tstem 0.25s ease-out 0.4s forwards }
            `}</style>
            <path id="vt-v" d="M 4 8 L 24 40 L 44 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path id="vt-tbar" d="M 52 8 L 92 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path id="vt-tstem" d="M 72 8 L 72 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
          (function(){
            var done = false;
            function hide() {
              if (done) return;
              done = true;
              var el = document.getElementById('vt-preloader');
              if (el) { el.style.opacity = '0'; }
            }
            window.addEventListener('load', function(){ setTimeout(hide, 600) });
            setTimeout(hide, 3000);
          })();
        `}} />
        {children}
      </body>
    </html>
  );
}
