import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Pathfinder — Data Integration Hub',
  description: 'Pathfinder: MSS Import Integration Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
