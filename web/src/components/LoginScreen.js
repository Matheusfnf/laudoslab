'use client'

import React, { useState } from 'react'
import { Microscope, LogIn, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginScreen({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (isRegistering && !displayName.trim()) {
            setError('Por favor, preencha como gostaria de ser chamado.')
            return
        }

        if (!email.trim() || !password.trim()) {
            setError('Por favor, preencha o e-mail e a senha.')
            return
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        setIsLoading(true)

        try {
            if (isRegistering) {
                // Fluxo de Cadastro
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password.trim(),
                    options: {
                        data: {
                            name: displayName.trim()
                        }
                    }
                })

                if (signUpError) {
                    // Trata o erro específico do nosso Trigger de Whitelist
                    if (signUpError.message && (signUpError.message.includes('Acesso Negado') || signUpError.message.includes('Database error'))) {
                        throw new Error('E-mail não autorizado para acesso. Solicite a liberação com a direção do laboratório.')
                    }
                    if (signUpError.message.includes('User already registered')) {
                        throw new Error('Este e-mail já está cadastrado.')
                    }
                    throw signUpError
                }

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    // Supabase retorna sso quando o usuario ja existe e tenta criar de novo caso as configs de email confirm ativem
                    throw new Error('Este e-mail já está cadastrado.')
                }

                // Se o Supabase Auth estiver configurado para confirmar e-mail,
                // data.session vai vir null. Aqui assumimos que ele já loga direto
                // (opção Confirm Email desativada lá no painel).
                if (data.session) {
                    const userData = { id: data.user.id, name: displayName.trim(), email: data.user.email }
                    localStorage.setItem('proativa_auth_user', JSON.stringify(userData))
                    onLogin(userData)
                } else {
                    // Cai aqui se precisar confirmar email usando link
                    setError('Cadastro realizado. Se configurado, verifique seu e-mail para confirmar a conta.')
                }

            } else {
                // Fluxo de Login (Já Existente)
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password.trim()
                })

                if (signInError) {
                    if (signInError.message.includes('Invalid login credentials')) {
                        throw new Error('E-mail ou senha incorretos.')
                    }
                    throw signInError
                }

                if (data.user) {
                    const userName = data.user.user_metadata?.name || data.user.email.split('@')[0]
                    const userData = { id: data.user.id, name: userName, email: data.user.email }
                    localStorage.setItem('proativa_auth_user', JSON.stringify(userData))
                    onLogin(userData)
                } else {
                    throw new Error('E-mail ou senha incorretos.')
                }
            }
        } catch (err) {
            console.error('Auth error:', err)
            setError(err.message || 'Erro de autenticação. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                padding: '3rem 2.5rem',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 20px -10px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '420px',
                animation: 'slideUp 0.5s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #0369a1 100%)',
                        color: 'white',
                        marginBottom: '1.5rem',
                        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
                    }}>
                        <Microscope size={36} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Proativa Lab</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>Gerenciamento de Laudos CQ</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        borderLeft: '4px solid #ef4444',
                        padding: '1rem',
                        borderRadius: '0 8px 8px 0',
                        color: '#b91c1c',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {isRegistering && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Como quer ser chamado?</label>
                            <input
                                type="text"
                                placeholder="Seu nome"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                style={{
                                    padding: '0.85rem 1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: '#1e293b',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>E-mail</label>
                        <input
                            type="email"
                            placeholder="Digite seu e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#1e293b',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Senha</label>
                        <input
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#1e293b',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            background: isLoading ? '#bae6fd' : 'linear-gradient(135deg, var(--primary-color) 0%, #0284c7 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            boxShadow: isLoading ? 'none' : '0 10px 20px -10px rgba(14, 165, 233, 0.5)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {isLoading ? (
                            isRegistering ? 'Cadastrando...' : 'Entrando...'
                        ) : (
                            <>
                                {isRegistering ? 'Criar Conta' : 'Entrar'} <LogIn size={20} />
                            </>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isRegistering ? 'Já tenho uma conta. Fazer login' : 'Primeiro acesso? Criar conta'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
