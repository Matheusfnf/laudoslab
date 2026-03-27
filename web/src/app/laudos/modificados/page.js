'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Calendar, User, Microscope, ChevronRight, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ModifiedReportsDashboard() {
    const [reports, setReports] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterMonth, setFilterMonth] = useState('')
    const [filterClient, setFilterClient] = useState('')
    const [userRole, setUserRole] = useState('user')
    const [isCheckingRole, setIsCheckingRole] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkRoleAndFetch = async () => {
            const savedUser = localStorage.getItem('proativa_auth_user')
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser)
                setUserRole(parsedUser.role || 'user')
                if (parsedUser.role !== 'diretoria') {
                    window.location.replace('/')
                    return
                }
            } else {
                window.location.replace('/')
                return
            }
            setIsCheckingRole(false)
            fetchClients()
            fetchReports(filterMonth, filterClient)
        }

        checkRoleAndFetch()
    }, [filterMonth, filterClient])

    async function fetchClients() {
        try {
            const { data } = await supabase.from('clients').select('id, name')
            if (data) setClients(data)
        } catch (err) {
            console.error('Error fetching clients:', err)
        }
    }

    async function fetchReports(month, clientId) {
        try {
            setLoading(true)
            let query = supabase
                .from('reports')
                .select('*')
                .eq('is_modified', true)
                .order('issue_date', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })

            if (month) {
                const startOfMonth = `${month}-01`
                const [year, m] = month.split('-')
                const endOfMonth = new Date(year, m, 0).toISOString().split('T')[0]

                query = query.gte('issue_date', startOfMonth).lte('issue_date', endOfMonth)
            }

            if (clientId) {
                query = query.eq('client_id', clientId)
            }

            const { data, error } = await query

            if (error) throw error
            
            setReports(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (isCheckingRole) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Verificando acessos...</div>
    }

    const sortedReports = useMemo(() => {
        return [...reports].sort((a, b) => {
            const strA = String(a.name || '');
            const strB = String(b.name || '');
            const numA = parseInt(strA.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(strB.match(/\d+/)?.[0] || '0', 10);
            if (numA !== numB) return numB - numA;
            
            const dateA = new Date(a.issue_date || a.created_at || 0).getTime();
            const dateB = new Date(b.issue_date || b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }, [reports]);

    return (
        <div>
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} />
                <div>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>Modo Diretoria</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Você está visualizando os laudos modificados. Estas alterações não refletem nos laudos originais dos clientes.</p>
                </div>
            </div>

            <div className="header-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="title-main">Laudos Modificados</h1>
                        <p className="title-sub">Área exclusiva para diretoria - laudos originais alterados.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <Link href="/laudos" passHref>
                                <button className="btn btn-secondary">
                                    Voltar para Normais
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por Cliente</label>
                            <select
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'transparent' }}
                                value={filterClient}
                                onChange={(e) => setFilterClient(e.target.value)}
                            >
                                <option value="">Todos os Clientes</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por Emissão (Mês/Ano)</label>
                            <input
                                type="month"
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'transparent' }}
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '2rem' }}>
                    <FileText size={24} color="#ef4444" />
                    Todos os Laudos Modificados
                </h2>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Carregando laudos...
                    </div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
                        <Microscope size={48} style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nenhum laudo modificado encontrado</h3>
                        <p style={{ fontSize: '0.95rem' }}>Para criar um, acesse um laudo normal e clique em "Criar Modificação".</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                        {sortedReports.map(report => {
                            const client = clients.find(c => c.id === report.client_id)
                            const clientName = client ? client.name : (report.requester || 'Cliente não vinculado')

                            return (
                                <Link href={`/report/${report.id}`} key={report.id} className="card interactive-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.3 }}>
                                            {report.name}
                                        </h3>
                                        <ChevronRight size={20} color="#ef4444" style={{ opacity: 0.5 }} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                            <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '6px', color: '#ef4444' }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {report.requester ? `Solicitante: ${report.requester}` : 'Cliente / Fazenda'}
                                                </span>
                                                {clientName} - {report.property}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                            <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '6px', color: '#ef4444' }}>
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Data de Emissão</span>
                                                {report.issue_date ? new Date(report.issue_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>Ver Modificado</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
