'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Factory, ChevronRight, Microscope } from 'lucide-react'

export default function Home() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Busca o nome do usuário salvo pelo LoginScreen
    const savedUser = localStorage.getItem('proativa_auth_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setUserName(user.name)
      } catch (err) {
        console.error('Error parsing user data', err)
      }
    }
  }, [])

  return (
    <div style={{
      animation: 'fadeIn 0.5s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Welcome Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.8) 0%, rgba(3, 105, 161, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: 'white',
        padding: '3.5rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.25)'
      }}>
        {/* Decorative background circle */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '1rem',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <Microscope size={40} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Olá, {userName || 'Usuário'}
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: '0.5rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Bem-vindo ao <strong>Proativa Lab</strong>. Plataforma central para o gerenciamento premium de Produção e Controle de Qualidade microbiológico. Selecione o módulo desejado abaixo para iniciar.
            </p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        {/* Laudos Card */}
        <Link href="/laudos" className="card interactive-card" style={{
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          textDecoration: 'none',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '4px solid var(--primary-color)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
          borderRight: '1px solid rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#e0f2fe',
            color: 'var(--primary-color)',
            marginBottom: '1.5rem'
          }}>
            <FileText size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700 }}>
            Laudos Microbiológicos
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem' }}>
            Acesso ao sistema completo de certificados. Crie novos laudos a partir de análises, edite registros, associe fotos e gere PDFs profissionais customizados.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', fontWeight: 600, fontSize: '1.05rem', gap: '0.5rem' }}>
            Acessar Módulo <ChevronRight size={20} />
          </div>
        </Link>

        {/* Produção Card */}
        <Link href="/producao" className="card interactive-card" style={{
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          textDecoration: 'none',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '4px solid #10b981', // Green top border for production
          borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
          borderRight: '1px solid rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#d1fae5',
            color: '#10b981',
            marginBottom: '1.5rem'
          }}>
            <Factory size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700 }}>
            Acompanhamento de Produção
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem' }}>
            Quadro Kanban para visualização instantânea de pedidos. Mova lotes pelas etapas de incubação, finalização e acompanhe o fluxo da biofábrica em tempo real.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 600, fontSize: '1.05rem', gap: '0.5rem' }}>
            Acessar Módulo <ChevronRight size={20} />
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
