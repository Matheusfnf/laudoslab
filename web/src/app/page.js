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
      {/* Premium Ambient Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: -1,
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: -1,
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />

      {/* Hero Welcome Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '28px',
        color: 'white',
        padding: '4rem 3rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -15px rgba(2, 132, 199, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
      }}>
        {/* Subtle interior glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
          opacity: 0.5
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
            padding: '1.25rem',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <Microscope size={48} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-1px',
              background: 'linear-gradient(to right, #ffffff, #e0f2fe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              Olá, {userName || 'Usuário'}
            </h1>
            <p style={{
              fontSize: '1.15rem',
              color: 'rgba(255, 255, 255, 0.85)',
              marginTop: '0.75rem',
              maxWidth: '650px',
              lineHeight: 1.6,
              fontWeight: 400
            }}>
              Bem-vindo ao centro de comando do <strong>Proativa Lab</strong>. Acesse os módulos abaixo para gerenciar a produção da biofábrica e o controle de qualidade com máxima eficiência.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Glassmorphic Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '2.5rem',
        perspective: '1000px'
      }}>
        {/* Laudos Module */}
        <Link href="/laudos" className="premium-glass-card group" style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Card Top Accent Glow */}
          <div className="card-glow-accent" style={{ background: 'var(--primary-color)' }} />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
            color: 'var(--primary-color)',
            marginBottom: '1.75rem',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            transition: 'all 0.4s ease'
          }} className="icon-wrapper">
            <FileText size={36} strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Laudos Microbiológicos
          </h2>
          <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, flexGrow: 1, marginBottom: '2.5rem', fontWeight: 400 }}>
            Gerencie o ciclo completo de certificação. Emita novos laudos, anexe documentação fotográfica das placas e exporte relatórios técnicos em PDF com assinatura digital.
          </p>

          <div className="card-action-btn" style={{ color: 'var(--primary-color)' }}>
            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Acessar Módulo</span>
            <ChevronRight size={22} className="chevron-icon" />
          </div>
        </Link>

        {/* Produção Module */}
        <Link href="/producao" className="premium-glass-card group" style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Card Top Accent Glow */}
          <div className="card-glow-accent" style={{ background: '#10b981' }} />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            color: '#10b981',
            marginBottom: '1.75rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            transition: 'all 0.4s ease'
          }} className="icon-wrapper">
            <Factory size={36} strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Kanban de Produção
          </h2>
          <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, flexGrow: 1, marginBottom: '2.5rem', fontWeight: 400 }}>
            Acompanhe o piso de fábrica em tempo real. Movimente lotes entre etapas de incubação, controle prazos de maturação e otimize o fluxo de entrega da biofábrica.
          </p>

          <div className="card-action-btn" style={{ color: '#10b981' }}>
            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Acessar Módulo</span>
            <ChevronRight size={22} className="chevron-icon" />
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        
        .premium-glass-card {
            padding: 3rem 2.5rem;
            background: rgba(255, 255, 255, 0.15); /* Transparency increased here */
            backdrop-filter: blur(24px) saturate(120%);
            -webkit-backdrop-filter: blur(24px) saturate(120%);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-top: 1px solid rgba(255, 255, 255, 0.6);
            border-left: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 28px;
            box-shadow: 
                0 20px 40px -15px rgba(0,0,0,0.05),
                0 0 0 1px rgba(255,255,255,0.1) inset;
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
            overflow: hidden;
            transform: translateZ(0); /* Hardware acceleration */
        }

        .premium-glass-card:hover {
            transform: translateY(-8px);
            background: rgba(255, 255, 255, 0.25); /* Slight lightening on hover */
            box-shadow: 
                0 30px 60px -15px rgba(0,0,0,0.1),
                0 0 0 1px rgba(255,255,255,0.2) inset;
        }

        .card-glow-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            opacity: 0.8;
            transition: height 0.3s ease, opacity 0.3s ease;
        }

        .premium-glass-card:hover .card-glow-accent {
            height: 6px;
            opacity: 1;
        }

        .premium-glass-card:hover .icon-wrapper {
            transform: scale(1.05) rotate(-2deg);
        }

        .card-action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .chevron-icon {
            transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .premium-glass-card:hover .card-action-btn {
            padding-left: 0.5rem;
        }

        .premium-glass-card:hover .chevron-icon {
            transform: translateX(4px);
        }
      `}</style>
    </div>
  )
}
