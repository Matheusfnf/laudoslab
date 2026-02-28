'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Calendar, User, Microscope, ChevronRight } from 'lucide-react'

export default function Home() {
  const [reports, setReports] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterClient, setFilterClient] = useState('')

  useEffect(() => {
    fetchClients()
    fetchReports(filterMonth, filterClient)
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

  return (
    <div>
      <div className="header-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="title-main">Dashboard de Laudos</h1>
            <p className="title-sub">Gerencie e visualize todas as análises microbiológicas concluídas.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/create" passHref>
                <button className="btn btn-primary">
                  Novo Laudo
                </button>
              </Link>
              <Link href="/clients" passHref>
                <button className="btn btn-secondary">
                  <User size={18} style={{ marginRight: '6px' }} /> Meus Clientes
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
          <FileText size={24} color="var(--primary-color)" />
          Todos os Laudos
        </h2>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando laudos...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
            <Microscope size={48} style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nenhum laudo encontrado</h3>
            <p style={{ fontSize: '0.95rem' }}>Os laudos que você criar aparecerão aqui.</p>
            <Link href="/create" passHref>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Criar Primeiro Laudo</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {reports.map(report => {
              const client = clients.find(c => c.id === report.client_id)
              const clientName = client ? client.name : (report.requester || 'Cliente não vinculado')

              return (
                <Link href={`/report/${report.id}`} key={report.id} className="card interactive-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.3 }}>
                      {report.name}
                    </h3>
                    <ChevronRight size={20} color="var(--primary-color)" style={{ opacity: 0.5 }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <div style={{ background: '#e5f1ff', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary-color)' }}>
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
                      <div style={{ background: '#e5f1ff', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary-color)' }}>
                        <Calendar size={16} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Data de Emissão</span>
                        {report.issue_date ? new Date(report.issue_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <span className="badge">Visualizar Detalhes</span>
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
