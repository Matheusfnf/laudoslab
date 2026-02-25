'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Microscope, FileText, Factory } from 'lucide-react'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const pathname = usePathname()

  // Function to determine if a route is active and apply specific styles
  const getLinkStyle = (path) => {
    // Para Home ('/'), vamos considerar ativo se estiver em qualquer lugar senão em /producao
    const isActive = path === '/'
      ? (pathname === '/' || pathname?.startsWith('/report') || pathname?.startsWith('/edit') || pathname?.startsWith('/create'))
      : pathname === path;

    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingBottom: '0.5rem',
      paddingTop: '0.5rem',
      position: 'relative',
      color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
      fontWeight: isActive ? 700 : 500,
      borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
      transition: 'all 0.2s ease-in-out',
      marginBottom: '-3px' // Offset to keep the alignment exact without shifting
    }
  }

  return (
    <html lang="pt-BR">
      <head>
        <title>Proativa Lab - Laudos</title>
      </head>
      <body className={inter.className}>
        {/* Navigation Bar */}
        <nav className="navbar">
          <Link href="/" className="nav-brand">
            <Microscope size={28} />
            <span>Proativa Lab</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" className="nav-link" style={getLinkStyle('/')}>
              <FileText size={18} /> Laudos
            </Link>
            <Link href="/producao" className="nav-link" style={getLinkStyle('/producao')}>
              <Factory size={18} /> Produção
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="main-wrapper">
          <div className="container">
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
