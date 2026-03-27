import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Navbar from '@/components/Navbar';
import AppSidebar from '@/components/AppSidebar';
import MainWrapper from '@/components/MainWrapper';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'BlogHub - Share Your Stories',
  description: 'A modern blog platform built with Next.js',
  keywords: ['blog', 'content', 'writing', 'stories'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SidebarProvider>
            <Navbar />
            <AppSidebar />
            <MainWrapper>{children}</MainWrapper>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
