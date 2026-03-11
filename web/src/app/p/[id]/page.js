'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, User, MapPin, Microscope, Download, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import ReportPDFTemplate from '@/components/ReportPDFTemplate'
import SeedReportPDFTemplate from '@/components/SeedReportPDFTemplate'
import SoilReportPDFTemplate from '@/components/SoilReportPDFTemplate'
import RootReportPDFTemplate from '@/components/RootReportPDFTemplate'

export default function PublicReportView() {
    const { id } = useParams()
    const router = useRouter()

    const [report, setReport] = useState(null)
    const [micros, setMicros] = useState([])
    const [loading, setLoading] = useState(true)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const pdfRef = useRef(null)

    useEffect(() => {
        if (id) {
            fetchReportDetails()
        }
    }, [id])

    async function fetchReportDetails() {
        try {
            setLoading(true)

            let query = supabase.from('reports').select('*, clients(*)')
            
            // Verifica se o ID passado na URL é um UUID válido, se for busca pelo ID, se não busca pelo name
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(id)) {
                 query = query.eq('id', id)
            } else {
                 // Decode in case spaces are URL encoded
                 query = query.eq('name', decodeURIComponent(id))
            }

            const { data: reportData, error: reportError } = await query.single()

            if (reportError) throw reportError

            setReport(reportData)

            // Fetch microorganisms using the actual report ID from data (in case we searched by name)
            const actualReportId = reportData.id;

            const { data: microsData, error: microsError } = await supabase
                .from('microorganisms')
                .select('*')
                .eq('report_id', actualReportId)

            if (microsError) throw microsError
            setMicros(microsData || [])

        } catch (error) {
            console.error('Error fetching report:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true)
        try {
            const html2pdf = (await import('html2pdf.js')).default

            // Temporary show to avoid html2canvas capturing blank space due to `display: none` or bounds
            const element = pdfRef.current;

            const opt = {
                margin: 0,
                filename: `Laudo_${report.name.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }

            await html2pdf().set(opt).from(element).save()
        } catch (err) {
            console.error('Error generating PDF:', err)
            alert('Erro ao gerar o PDF. Revise o console do navegador.')
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando laudo...</p>
            </div>
        )
    }

    if (!report) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2>Laudo não encontrado</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>O laudo que você está tentando acessar não existe ou foi removido.</p>
            </div>
        )
    }

    return (
        <div style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header / Logo for Public View */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <img src="/logos/Proativa logo colorida svg.svg" alt="Proativa Lab" style={{ height: '60px', objectFit: 'contain' }} />
            </div>

            {report.is_modified && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                    <AlertTriangle size={20} />
                    <span>ESTE É UM LAUDO MODIFICADO (Cópia da versão enviada ao cliente).</span>
                </div>
            )}

            <div className="header-actions" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                    <h1 className="title-main" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{report.name}</h1>
                    <p className="title-sub">Detalhes e análises deste laudo microbiológico.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', 
                        backgroundColor: '#00b0f0', borderColor: '#00b0f0', color: '#fff', fontSize: '1.1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 176, 240, 0.2), 0 2px 4px -1px rgba(0, 176, 240, 0.1)'
                    }}
                >
                    {isGeneratingPDF ? <span className="spinner" style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <Download size={20} />}
                    {isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF do Laudo'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Dados Divididos em Dois Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    {/* Card 1: Cliente e Localidade */}
                    <div className="card" style={{ height: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={20} color="var(--primary-color)" /> Cliente e Localidade
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Solicitante
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.requester || '-'}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Cliente
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.clients?.name || '-'}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Propriedade
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.property}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Localidade
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {report.city ? `${report.city} - ${report.state}` : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Amostra e Relatório */}
                    <div className="card" style={{ height: '100%' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileIcon size={20} color="var(--primary-color)" /> Amostra e Laudo
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Data de Emissão (Laudo)
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--primary-color)' }}>{report.issue_date ? new Date(report.issue_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Entrada no Lab
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.entry_date ? new Date(report.entry_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Coletado por
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.collected_by}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Data da Coleta
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.collection_date ? new Date(report.collection_date).toLocaleDateString('pt-BR') : '-'}</p>
                            </div>

                            <div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                    Entregue por
                                </span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{report.delivered_by || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Microorganisms or Seeds Card */}
                {report.report_type === 'sementes' ? (
                    <div className="card">
                        <h2 style={{ marginBottom: '2rem' }}>
                            <Microscope size={24} color="#16a34a" /> Resultados da Análise de Sementes
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Suporte a novo formato (samples[]) e legado (objeto flat) */}
                            {(report.matrix_results?.samples || [report.matrix_results]).map((sample, sIndex) => (
                                <div key={sIndex} style={{ border: '1px solid #dcfce7', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    {/* Identificação */}
                                    {sample?.identification && (
                                        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #dcfce7', padding: '1rem 1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identificação</span>
                                                <div style={{ fontWeight: 600, color: '#15803d', marginTop: '0.2rem' }}>{sample.identification}</div>
                                            </div>
                                            {sample?.analytical_technique && (
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Técnica Analítica</span>
                                                    <div style={{ fontWeight: 500, color: '#1e293b', marginTop: '0.2rem' }}>{sample.analytical_technique}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {/* Patogênicos */}
                                        {sample?.pathogenic?.some(i => i.genus) && (
                                            <div style={{ borderLeft: '4px solid #16a34a', padding: '1rem 1.25rem', borderRadius: '8px', background: '#f0fdf4' }}>
                                                <h4 style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Gêneros Patogênicos</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {sample.pathogenic.filter(i => i.genus).map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: 500, color: '#1e293b', fontStyle: 'italic' }}>{item.genus}</span>
                                                            <span style={{ fontWeight: 600, color: '#15803d', background: '#bbf7d0', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem' }}>{item.percent}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Deteriorantes */}
                                        {sample?.deteriorating?.some(i => i.genus) && (
                                            <div style={{ borderLeft: '4px solid #4ade80', padding: '1rem 1.25rem', borderRadius: '8px', background: '#f0fdf4' }}>
                                                <h4 style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Deteriorante / Armazenamento</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {sample.deteriorating.filter(i => i.genus).map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: 500, color: '#1e293b', fontStyle: 'italic' }}>{item.genus}</span>
                                                            <span style={{ fontWeight: 600, color: '#15803d', background: '#bbf7d0', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem' }}>{item.percent}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Contaminantes */}
                                        {sample?.contaminating?.some(i => i.genus) && (
                                            <div style={{ borderLeft: '4px solid #86efac', padding: '1rem 1.25rem', borderRadius: '8px', background: '#f0fdf4' }}>
                                                <h4 style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contaminante</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {sample.contaminating.filter(i => i.genus).map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: 500, color: '#1e293b', fontStyle: 'italic' }}>{item.genus}</span>
                                                            <span style={{ fontWeight: 600, color: '#15803d', background: '#bbf7d0', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem' }}>{item.percent}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : report.report_type === 'solos' ? (
                    <div className="card">
                        <h2 style={{ marginBottom: '2rem' }}>
                            <Microscope size={24} color="var(--primary-color)" /> Análises de Solos
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {report.matrix_results?.samples?.map((sample, sIndex) => (
                                <div key={sIndex} style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CÓDIGO DA AMOSTRA</span>
                                            <div style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.2rem' }}>{sample.code}</div>
                                        </div>
                                        <div style={{ flex: 3 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IDENTIFICAÇÃO</span>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{sample.identification}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
                                        <div style={{
                                            borderLeft: '4px solid #ea580c',
                                            padding: '1.25rem',
                                            borderRadius: '8px',
                                            background: '#fff7ed'
                                        }}>
                                            <h4 style={{ color: '#c2410c', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>GÊNERO</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {sample.microorganisms?.map((micro, mIndex) => (
                                                    <div key={mIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{micro.genus}</span>
                                                        <span style={{ fontWeight: 600, color: '#c2410c', background: '#ffedd5', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem' }}>{micro.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : report.report_type === 'raizes' ? (
                    <div className="card">
                        <h2 style={{ marginBottom: '2rem' }}>
                            <Microscope size={24} color="#0891b2" /> Análises de Raízes
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {report.matrix_results?.samples?.map((sample, sIndex) => (
                                <div key={sIndex} style={{
                                    border: '1px solid #cffafe',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CÓDIGO DA AMOSTRA</span>
                                            <div style={{ color: '#0891b2', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.2rem' }}>{sample.code}</div>
                                        </div>
                                        <div style={{ flex: 3 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IDENTIFICAÇÃO</span>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{sample.identification}</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        borderLeft: '4px solid #0891b2',
                                        padding: '1.25rem',
                                        borderRadius: '8px',
                                        background: '#ecfeff'
                                    }}>
                                        <h4 style={{ color: '#0891b2', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>GÊNCEROS ENCONTRADOS</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {sample.microorganisms?.map((micro, mIndex) => (
                                                <div key={mIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                                                    <span style={{ fontWeight: 500, color: '#1e293b', fontStyle: 'italic' }}>{micro.genus}</span>
                                                    <span style={{ fontWeight: 700, color: '#0891b2', background: '#cffafe', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Presente</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <h2 style={{ marginBottom: '2rem' }}>
                            <Microscope size={24} color="var(--primary-color)" /> Análises Microbiológicas
                        </h2>

                        {micros.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Nenhum microorganismo registrado neste laudo.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {micros.map((micro) => (
                                    <div key={micro.id} style={{
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Código</span>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--primary-color)' }}>{micro.code || '-'}</strong>
                                        </div>

                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Microorganismo</span>
                                            <strong style={{ fontSize: '1.05rem' }}>{micro.name || '-'}</strong>
                                        </div>

                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>pH</span>
                                            <span style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{micro.ph || '-'}</span>
                                        </div>

                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Produto Comercial</span>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--primary-color)' }}>{micro.commercial_product || '-'}</strong>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'rgba(52, 199, 89, 0.05)', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid var(--success-color)', marginTop: '0.5rem' }}>
                                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Microrganismos Recuperados</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {(micro.recovered && micro.recovered.length > 0 ? micro.recovered : (micro.name || micro.cfu_per_ml ? [{ name: micro.name, cfu_per_ml: micro.cfu_per_ml }] : [])).map((rec, i, arr) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i !== arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', paddingBottom: i !== arr.length - 1 ? '0.5rem' : 0 }}>
                                                        <span style={{ fontWeight: 500 }}>{rec.name || '-'}</span>
                                                        <span className="badge" style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#2d8a43' }}>{rec.cfu_per_ml || '-'}</span>
                                                    </div>
                                                ))}
                                                {(!micro.recovered || micro.recovered.length === 0) && !micro.name && !micro.cfu_per_ml && (
                                                    <div style={{ color: 'var(--text-muted)' }}>Nenhum microrganismo recuperado informado.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Enterobactérias</span>
                                            <span style={{ color: 'var(--text-main)' }}>{micro.enterobacteria || '-'}</span>
                                        </div>

                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Bolor / Levedura</span>
                                            <span style={{ color: 'var(--text-main)' }}>{micro.mold_yeast || '-'}</span>
                                        </div>

                                        {micro.observations && (
                                            <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--border-color)', marginTop: '0.5rem' }}>
                                                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Observações da amostra</span>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{micro.observations}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Considerações do Laudo */}
            {report.observations && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileIcon size={20} color="var(--primary-color)" /> Considerações do Laudo
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {report.observations}
                    </p>
                </div>
            )}

            {/* Anexos Fotográficos */}
            {report.images && report.images.length > 0 && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={20} color="var(--primary-color)" /> Anexos Fotográficos
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                        {report.images.map((imgObj, idx) => {
                            const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                            const desc = typeof imgObj === 'string' ? '' : imgObj.description;
                            return (
                                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                                        <img src={url} alt={`Anexo ${idx + 1}`} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                                    </div>
                                    <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#e2e8f0', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                        Figura {idx + 1}
                                        {desc && <span style={{ display: 'block', fontWeight: 400, marginTop: '4px', fontStyle: 'italic', fontSize: '0.85rem' }}>{desc}</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    © {new Date().getFullYear()} Proativa Lab. Todos os direitos reservados.
                </p>
            </div>

            {/* Hidden PDF Template Container */}
            <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
                {report.report_type === 'sementes' ? (
                    <SeedReportPDFTemplate ref={pdfRef} report={report} />
                ) : report.report_type === 'solos' ? (
                    <SoilReportPDFTemplate ref={pdfRef} report={report} />
                ) : report.report_type === 'raizes' ? (
                    <RootReportPDFTemplate ref={pdfRef} report={report} />
                ) : (
                    <ReportPDFTemplate ref={pdfRef} report={report} micros={micros} />
                )}
            </div>

        </div>
    )
}

function FileIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    )
}
