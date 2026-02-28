'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, MapPin, Microscope, CheckCircle, Trash2, Download, Image as ImageIcon } from 'lucide-react'
import ReportPDFTemplate from '@/components/ReportPDFTemplate'

export default function ReportView() {
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

            // Fetch report header and related client
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .select('*, clients(*)')
                .eq('id', id)
                .single()

            if (reportError) throw reportError
            setReport(reportData)

            // Fetch microorganisms
            const { data: microsData, error: microsError } = await supabase
                .from('microorganisms')
                .select('*')
                .eq('report_id', id)

            if (microsError) throw microsError
            setMicros(microsData || [])

        } catch (error) {
            console.error('Error fetching report:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteReport = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este laudo? Esta ação não pode ser desfeita.')) {
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('Laudo excluído com sucesso!')
            router.push('/laudos')
        } catch (err) {
            console.error(err)
            alert('Erro ao excluir laudo.')
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
            <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando laudo...</div>
        )
    }

    if (!report) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
                <h2>Laudo não encontrado</h2>
                <Link href="/laudos">
                    <button className="btn btn-secondary" style={{ marginTop: '1rem' }}>Voltar ao Início</button>
                </Link>
            </div>
        )
    }

    return (
        <div style={{ paddingBottom: '3rem', maxWidth: '900px', margin: '0 auto' }}>
            <div className="header-actions">
                <div>
                    <button className="btn btn-secondary" onClick={() => router.push('/laudos')} style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <h1 className="title-main">{report.name}</h1>
                    <p className="title-sub">Detalhes e análises deste laudo microbiológico.</p>
                </div>
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#00b0f0', borderColor: '#00b0f0', color: '#fff' }}
                    >
                        {isGeneratingPDF ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : <Download size={18} />}
                        {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleDeleteReport}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', color: '#c62828', borderColor: '#ffcdd2', background: '#ffebee' }}
                    >
                        <Trash2 size={18} />
                        Excluir
                    </button>
                    <Link href={`/edit/${report.id}`}>
                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#fff' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Editar Laudo
                        </button>
                    </Link>
                </div>
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

                {/* Microorganisms Card */}
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
                <div className="card">
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

            {/* Hidden PDF Template Container */}
            <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
                <ReportPDFTemplate ref={pdfRef} report={report} micros={micros} />
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
