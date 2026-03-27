'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Calendar, User, Microscope, ChevronRight, ChevronLeft, SlidersHorizontal, X, Search } from 'lucide-react'

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export default function Home() {
  const [reports, setReports] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('user')

  // Month navigation state (0-indexed month)
  const [navDate, setNavDate] = useState(getCurrentYearMonth)

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // When any filter is active, we fetch ALL months
  const hasActiveFilters = !!(filterName || filterClient || filterType || filterDateFrom || filterDateTo)

  useEffect(() => {
    const savedUser = localStorage.getItem('proativa_auth_user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUserRole(parsedUser.role || 'user')
    }
    fetchClients()
  }, [])

  // Re-fetch whenever month OR filter state changes
  useEffect(() => {
    fetchReports()
  }, [navDate, hasActiveFilters, filterClient, filterType, filterDateFrom, filterDateTo])

  async function fetchClients() {
    try {
      const { data } = await supabase.from('clients').select('id, name')
      if (data) setClients(data)
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  async function fetchReports() {
    try {
      setLoading(true)
      let query = supabase
        .from('reports')
        .select('*')
        .neq('is_modified', true)
        .order('issue_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (hasActiveFilters) {
        // Global search: no month restriction, apply server-side filters
        if (filterClient) query = query.eq('client_id', filterClient)
        if (filterType) query = query.eq('report_type', filterType)
        if (filterDateFrom) query = query.gte('issue_date', filterDateFrom)
        if (filterDateTo) query = query.lte('issue_date', filterDateTo)
        // filterName is applied client-side below
      } else {
        // Month-restricted browse
        const start = `${navDate.year}-${String(navDate.month + 1).padStart(2, '0')}-01`
        const end = new Date(navDate.year, navDate.month + 1, 0).toISOString().split('T')[0]
        query = query.gte('issue_date', start).lte('issue_date', end)
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

  function prevMonth() {
    setNavDate(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })
  }
  function nextMonth() {
    setNavDate(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })
  }

  const { year: curYear, month: curMonth } = getCurrentYearMonth()
  const isCurrentMonth = navDate.year === curYear && navDate.month === curMonth

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

  // Client-side name filter
  const filtered = useMemo(() => {
    if (!filterName) return sortedReports
    return sortedReports.filter(r => (r.name || '').toString().toLowerCase().includes(filterName.toLowerCase()))
  }, [sortedReports, filterName])

  function clearFilters() {
    setFilterName('')
    setFilterClient('')
    setFilterType('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const badgeStyle = (type) => ({
    alignSelf: 'flex-start',
    background: type === 'sementes' ? '#f0fdf4' : type === 'solos' ? '#fff7ed' : type === 'raizes' ? '#ecfeff' : '#eff6ff',
    color: type === 'sementes' ? '#166534' : type === 'solos' ? '#c2410c' : type === 'raizes' ? '#0891b2' : '#1d4ed8',
    fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600
  })

  const typeLabel = (type) => {
    if (type === 'sementes') return 'Laudo de Sementes'
    if (type === 'solos') return 'Laudo de Solos'
    if (type === 'raizes') return 'Laudo de Raízes'
    return 'Laudo Microbiológico'
  }

  return (
    <div>
      {/* Page header */}
      <div className="header-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="title-main">Dashboard de Laudos</h1>
            <p className="title-sub">Gerencie e visualize todas as análises microbiológicas concluídas.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link href="/create" passHref>
                <button className="btn btn-primary" style={{ flex: '1 1 auto' }}>Novo Laudo</button>
              </Link>
              <Link href="/clients" passHref>
                <button className="btn btn-secondary" style={{ flex: '1 1 auto' }}>
                  <User size={18} style={{ marginRight: '6px' }} /> Meus Clientes
                </button>
              </Link>
              {userRole === 'diretoria' && (
                <Link href="/laudos/modificados" passHref>
                  <button className="btn btn-secondary" style={{ flex: '1 1 auto', borderColor: 'var(--primary-color)', color: 'var(--primary-color)', background: '#e0f2fe' }}>
                    <FileText size={18} style={{ marginRight: '6px' }} /> Modificados
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Month navigation + filter toggle bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ marginBottom: 0 }}>
            <FileText size={22} color="var(--primary-color)" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Laudos Emitidos
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Month navigator — faded when global search is active */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: hasActiveFilters ? '#f1f5f9' : '#f1f5f9',
              borderRadius: '10px', padding: '0.35rem 0.75rem',
              opacity: hasActiveFilters ? 0.4 : 1,
              pointerEvents: hasActiveFilters ? 'none' : 'auto',
              transition: 'opacity 0.2s'
            }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary-color)', padding: '0.15rem' }} title="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', minWidth: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {MONTH_NAMES[navDate.month]} {navDate.year}
                {isCurrentMonth && !hasActiveFilters && (
                  <span style={{ background: 'var(--primary-color)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '999px', padding: '0.1rem 0.45rem', marginLeft: '0.4rem', verticalAlign: 'middle' }}>Atual</span>
                )}
              </span>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary-color)', padding: '0.15rem' }} title="Próximo mês">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: showFilters || hasActiveFilters ? 'var(--primary-color)' : '#f1f5f9',
                color: showFilters || hasActiveFilters ? '#fff' : 'var(--text-main)',
                border: 'none', borderRadius: '10px', padding: '0.5rem 1rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s'
              }}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {hasActiveFilters && (
                <span style={{ background: '#fff', color: 'var(--primary-color)', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, padding: '0.05rem 0.4rem', minWidth: '18px', textAlign: 'center' }}>
                  {[filterName, filterClient, filterType].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global search hint banner */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1d4ed8' }}>
            <Search size={15} />
            <span><strong>Busca global ativa</strong> — exibindo resultados de <strong>todos os meses</strong>. Limpe os filtros para voltar à navegação por mês.</span>
            <button onClick={clearFilters} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <X size={13} /> Limpar
            </button>
          </div>
        )}

        {/* Advanced filters panel */}
        {showFilters && (
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Buscar por número / nome
                {filterName && <span style={{ color: 'var(--primary-color)', marginLeft: '0.4rem' }}>→ todos os meses</span>}
              </label>
              <input
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="Ex: 001, LAB-2025..."
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', background: '#fff' }}
              />
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Cliente
                {filterClient && <span style={{ color: 'var(--primary-color)', marginLeft: '0.4rem' }}>→ todos os meses</span>}
              </label>
              <select
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="">Todos os Clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tipo de Laudo</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="">Todos os Tipos</option>
                <option value="micro">Microbiológico</option>
                <option value="sementes">Sementes</option>
                <option value="solos">Solos</option>
                <option value="raizes">Raízes</option>
              </select>
            </div>
            {/* Date range */}
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Data de emissão — De</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', background: '#fff' }}
              />
            </div>
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Até</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', background: '#fff' }}
              />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', height: '40px' }}>
                <X size={15} /> Limpar
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {hasActiveFilters
              ? `${filtered.length} laudo${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''} em todos os meses`
              : `${filtered.length} laudo${filtered.length !== 1 ? 's' : ''} em ${MONTH_NAMES[navDate.month]} ${navDate.year}`}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando laudos...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
            <Microscope size={48} style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {hasActiveFilters ? 'Nenhum laudo corresponde aos filtros' : `Nenhum laudo em ${MONTH_NAMES[navDate.month]} ${navDate.year}`}
            </h3>
            <p style={{ fontSize: '0.95rem' }}>
              {hasActiveFilters
                ? <span style={{ cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600 }} onClick={clearFilters}>Limpar filtros</span>
                : 'Use as setas para navegar para outro mês.'}
            </p>
            {!hasActiveFilters && (
              <Link href="/create" passHref>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Criar Laudo</button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map(report => {
              const client = clients.find(c => c.id === report.client_id)
              const clientName = client ? client.name : (report.requester || 'Cliente não vinculado')

              return (
                <Link href={`/report/${report.id}`} key={report.id} className="card interactive-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.3 }}>{report.name}</h3>
                      <span className="badge" style={badgeStyle(report.report_type)}>{typeLabel(report.report_type)}</span>
                    </div>
                    <ChevronRight size={20} color="var(--primary-color)" style={{ opacity: 0.5, marginTop: '0.2rem', flexShrink: 0 }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <div style={{ background: '#e5f1ff', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary-color)', flexShrink: 0 }}><User size={16} /></div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{report.requester ? `Solicitante: ${report.requester}` : 'Cliente / Fazenda'}</span>
                        {clientName}{report.property ? ` — ${report.property}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <div style={{ background: '#e5f1ff', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary-color)', flexShrink: 0 }}><Calendar size={16} /></div>
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
