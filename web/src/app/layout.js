'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Microscope, FileText, PlusCircle } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
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
          <div className="nav-links">
            <Link href="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Laudos Concluídos
            </Link>
            <Link href="/create" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              <PlusCircle size={18} /> Criar Laudo
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
