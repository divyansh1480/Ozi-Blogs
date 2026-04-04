import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Navbar from '@/components/Navbar';
import AppSidebar from '@/components/AppSidebar';
import MainWrapper from '@/components/MainWrapper';
import QueryProvider from '@/components/QueryProvider';
import '../styles/globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BlogHub - Share Your Stories',
  description: 'A modern blog platform built with Next.js',
  keywords: ['blog', 'content', 'writing', 'stories'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <SidebarProvider>
              <Navbar />
              <AppSidebar />
              <MainWrapper>{children}</MainWrapper>
            </SidebarProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
