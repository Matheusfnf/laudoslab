'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'

export default function LabelPrintView() {
    const { id } = useParams()
    const router = useRouter()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [qrUrl, setQrUrl] = useState('')

    useEffect(() => {
        if (id) {
            setQrUrl(`${window.location.origin}/p/${id}`)
            fetchReportDetails()
        }
    }, [id])

    async function fetchReportDetails() {
        try {
            setLoading(true)
            let query = supabase.from('reports').select('name')
            
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(id)) {
                 query = query.eq('id', id)
            } else {
                 query = query.eq('name', decodeURIComponent(id))
            }

            const { data: reportData, error: reportError } = await query.single()

            if (reportError) throw reportError

            setReport(reportData)
            
            // Wait a brief moment for layout to settle, then trigger print
            setTimeout(() => {
                window.print()
            }, 500)

        } catch (error) {
            console.error('Error fetching report:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da etiqueta...</div>
    }

    if (!report) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Laudo não encontrado.</div>
    }

    return (
        <div className="label-print-container">
            <style jsx global>{`
                @media print {
                    @page {
                        size: 60mm 40mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .navbar {
                        display: none !important;
                    }
                    .main-wrapper, .container {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: none !important;
                    }
                }
                .label-page {
                    width: 60mm;
                    height: 40mm;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-sizing: border-box;
                    padding: 2mm;
                    background: white;
                    overflow: hidden;
                    page-break-after: always;
                }
                .qr-section {
                    width: 48%; /* Slightly less than half to fit side by side with gap */
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .report-name {
                    font-size: 7pt;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 2mm;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }
            `}</style>

            <div className="label-page">
                {/* Etiqueta 1 */}
                <div className="qr-section">
                    <div className="report-name">{report.name}</div>
                    <QRCode
                        value={qrUrl}
                        size={65}
                        level="Q"
                    />
                </div>

                {/* Etiqueta 2 */}
                <div className="qr-section">
                    <div className="report-name">{report.name}</div>
                    <QRCode
                        value={qrUrl}
                        size={65}
                        level="Q"
                    />
                </div>
            </div>
        </div>
    )
}
