'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Microscope, FileText, Factory, LogOut, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginScreen from '@/components/LoginScreen'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    // Check for saved user session on mount
    const savedUser = localStorage.getItem('proativa_auth_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsAuthChecking(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('proativa_auth_user')
    setUser(null)
  }

  // Function to determine if a route is active and apply specific styles
  const getLinkStyle = (path) => {
    // Home is exact match. '/laudos' is active for itself and /create, /edit, /report, /clients
    let isActive = false;

    if (path === '/') {
      isActive = pathname === '/';
    } else if (path === '/laudos') {
      isActive = pathname === '/laudos' || pathname?.startsWith('/report') || pathname?.startsWith('/edit') || pathname?.startsWith('/create') || pathname?.startsWith('/clients');
    } else {
      isActive = pathname === path || pathname?.startsWith(path);
    }

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
        {isAuthChecking ? (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando...</p>
          </div>
        ) : !user ? (
          <LoginScreen onLogin={(userData) => setUser(userData)} />
        ) : (
          <>
            {/* Navigation Bar */}
            <nav className="navbar">
              <Link href="/" className="nav-brand">
                <Microscope size={28} />
                <span>Proativa Lab</span>
              </Link>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <Link href="/" className="nav-link" style={getLinkStyle('/')}>
                    <Home size={18} /> Início
                  </Link>
                  <Link href="/laudos" className="nav-link" style={getLinkStyle('/laudos')}>
                    <FileText size={18} /> Laudos
                  </Link>
                  <Link href="/producao" className="nav-link" style={getLinkStyle('/producao')}>
                    <Factory size={18} /> Produção
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                  Olá, <strong style={{ color: '#0f172a' }}>{user.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent' }}
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </nav>

            {/* Main Content Area */}
            <div className="main-wrapper">
              <div className="container">
                <main>{children}</main>
              </div>
            </div>
          </>
        )}
      </body>
    </html>
  )
}
