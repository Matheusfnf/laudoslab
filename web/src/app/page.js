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
      animation: 'fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      position: 'relative'
    }}>
      {/* Pastel Mesh Abstract Background (Position Fixed to fill the whole screen behind the content) */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -10,
        background: '#fcfcfc',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(255, 230, 204, 0.8) 0%, rgba(255, 230, 204, 0) 70%)',
          filter: 'blur(80px)', animation: 'drift 20s infinite alternate ease-in-out'
        }} />
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(212, 224, 255, 0.8) 0%, rgba(212, 224, 255, 0) 70%)',
          filter: 'blur(80px)', animation: 'drift 25s infinite alternate-reverse ease-in-out'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '20%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(255, 204, 224, 0.7) 0%, rgba(255, 204, 224, 0) 70%)',
          filter: 'blur(100px)', animation: 'drift 30s infinite alternate ease-in-out'
        }} />
      </div>

      {/* Hero Welcome Header (Frosted Glass Panel like the reference) */}
      <div className="pastel-glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        padding: '3.5rem 3rem',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#0a58ca',
          padding: '1.25rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px -6px rgba(10, 88, 202, 0.4)'
        }}>
          <Microscope size={40} color="white" strokeWidth={1.5} />
        </div>
        <div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1a1f36',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Olá, {userName || 'Usuário'}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#4f566b',
            marginTop: '0.5rem',
            maxWidth: '650px',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Plataforma central para o gerenciamento premium de Produção e Controle de Qualidade microbiológico. Selecione o módulo desejado abaixo para iniciar.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '2.5rem'
      }}>
        {/* Laudos Module */}
        <Link href="/laudos" className="pastel-glass-panel group" style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '3rem 2.5rem',
          borderRadius: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#e0ecff',
            color: '#0a58ca',
            marginBottom: '1.75rem',
            transition: 'all 0.3s ease'
          }} className="icon-wrapper">
            <FileText size={32} strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#1a1f36', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '-0.3px' }}>
            Laudos Microbiológicos
          </h2>
          <p style={{ color: '#4f566b', fontSize: '0.95rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem', fontWeight: 400 }}>
            Emita novos laudos, anexe documentação fotográfica das placas e exporte relatórios técnicos em PDF.
          </p>

          <div className="solid-hover-btn" style={{ background: '#0a58ca' }}>
            Acessar Módulo
          </div>
        </Link>

        {/* Produção Module */}
        <Link href="/producao" className="pastel-glass-panel group" style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '3rem 2.5rem',
          borderRadius: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#dcfce7',
            color: '#16a34a',
            marginBottom: '1.75rem',
            transition: 'all 0.3s ease'
          }} className="icon-wrapper">
            <Factory size={32} strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#1a1f36', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '-0.3px' }}>
            Kanban de Produção
          </h2>
          <p style={{ color: '#4f566b', fontSize: '0.95rem', lineHeight: 1.6, flexGrow: 1, marginBottom: '2rem', fontWeight: 400 }}>
            Movimente lotes entre etapas de incubação, controle prazos de maturação e otimize o fluxo de entrega.
          </p>

          <div className="solid-hover-btn" style={{ background: '#16a34a' }}>
            Acessar Módulo
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); filter: blur(5px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes drift {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(50px, -50px) scale(1.05); }
        }
        
        .pastel-glass-panel {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 1);
            box-shadow: 0 10px 40px -10px rgba(31, 38, 135, 0.05);
            transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pastel-glass-panel:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.85);
            box-shadow: 0 20px 40px -10px rgba(31, 38, 135, 0.08), 0 0 0 1px rgba(255,255,255,0.5) inset;
        }

        .pastel-glass-panel:hover .icon-wrapper {
            transform: scale(1.05);
        }

        .solid-hover-btn {
            display: inline-flex;
            align-items: center;
            justifyContent: center;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.95rem;
            width: fit-content;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .pastel-glass-panel:hover .solid-hover-btn {
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
