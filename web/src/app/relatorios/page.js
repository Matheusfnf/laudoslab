'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Search, Filter, FileText, Factory, Package, Loader2, BarChart2, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Relatorios() {
    const [isLoading, setIsLoading] = useState(false)
    const [batches, setBatches] = useState([])
    const [clients, setClients] = useState([])

    // Filtros
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [selectedClient, setSelectedClient] = useState('')

    // Resumo
    const [totalProduced, setTotalProduced] = useState(0)
    const [totalBatches, setTotalBatches] = useState(0)

    useEffect(() => {
        fetchClients()
        handleSearch()
    }, [])

    // Carrega lista única de clientes baseada nos pedidos
    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('production_orders')
                .select('client')

            if (error) throw error

            const uniqueClients = [...new Set(data.map(order => order.client))].filter(Boolean).sort()
            setClients(uniqueClients)
        } catch (error) {
            console.error('Erro ao buscar clientes:', error)
        }
    }

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            // Começamos a query buscando da produção de lotes concluídos
            let query = supabase
                .from('production_batches')
                .select(`
          id,
          batch_number,
          quantity_produced,
          manufacture_date,
          status,
          production_orders!inner (
            id,
            order_number,
            client
          ),
          production_order_items!inner (
            id,
            product_name,
            unit
          )
        `)
                .eq('status', 'done')
                .order('manufacture_date', { ascending: false })

            if (dateFrom) {
                query = query.gte('manufacture_date', dateFrom)
            }

            if (dateTo) {
                query = query.lte('manufacture_date', dateTo)
            }

            if (selectedClient) {
                // Filtro em tabela relacional no supabase precisa usar a sintaxe da relação
                query = query.eq('production_orders.client', selectedClient)
            }

            const { data, error } = await query

            if (error) throw error

            // Mapeamento dos dados para padronizar e facilitar a renderização na tabela
            const formattedData = data.map(item => ({
                id: item.id,
                batchNumber: item.batch_number,
                quantity: item.quantity_produced,
                manufactureDate: item.manufacture_date,
                client: item.production_orders.client,
                orderNumber: item.production_orders.order_number,
                productName: item.production_order_items.product_name,
                unit: item.production_order_items.unit,
            }))

            setBatches(formattedData)

            // Calcula totais
            setTotalBatches(formattedData.length)
            const sumProduced = formattedData.reduce((acc, curr) => acc + Number(curr.quantity), 0)
            setTotalProduced(sumProduced)

        } catch (error) {
            console.error('Erro ao buscar relatórios:', error)
            alert('Erro ao buscar os dados do relatório.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDateLabel = (dateString) => {
        if (!dateString) return '-'
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
    }

    const handlePrintReport = () => {
        if (batches.length === 0) {
            alert('Não há dados para imprimir. Faça uma pesquisa primeiro.')
            return
        }

        const printWindow = window.open('', '', 'width=1000,height=800')
        if (!printWindow) {
            alert('Por favor, permita pop-ups para imprimir o relatório.')
            return
        }

        const periodText = dateFrom || dateTo
            ? `Período: ${dateFrom ? formatDateLabel(dateFrom) : 'Início'} até ${dateTo ? formatDateLabel(dateTo) : 'Hoje'}`
            : 'Período: Todo o histórico'

        const clientText = selectedClient ? `Cliente: ${selectedClient}` : 'Cliente: Todos'

        const rowsHtml = batches.map(batch => `
            <tr>
                <td>${formatDateLabel(batch.manufactureDate)}</td>
                <td>${batch.client}</td>
                <td>${batch.productName}</td>
                <td>${batch.batchNumber}</td>
                <td>${batch.quantity} ${batch.unit}</td>
                <td>#${batch.orderNumber}</td>
            </tr>
        `).join('')

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Produção</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                        padding: 20px;
                        margin: 0;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .logo-container {
                        width: 150px;
                        margin-right: 20px;
                    }
                    .logo-container img {
                        width: 100%;
                        height: auto;
                        object-fit: contain;
                    }
                    .header-info h1 {
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    }
                    .header-info p {
                        margin: 5px 0;
                        font-size: 14px;
                    }
                    .summary-container {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .summary-box {
                        border: 1px solid #ccc;
                        padding: 15px;
                        border-radius: 8px;
                        flex: 1;
                        background: #f9f9f9;
                    }
                    .summary-box h3 {
                        margin: 0 0 10px 0;
                        font-size: 14px;
                        color: #666;
                    }
                    .summary-box .value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #000;
                        margin: 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .summary-box {
                            background: transparent;
                        }
                        th {
                            background-color: #f2f2f2 !important;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-container">
                        <img src="${window.location.origin}/logos/Proativa logo colorida svg.svg" alt="Proativa Lab Logo" onerror="this.src='${window.location.origin}/logos/Proativa logo colorida.png'" />
                    </div>
                    <div class="header-info">
                        <h1>Relatório da Produção</h1>
                        <p>${periodText}</p>
                        <p>${clientText}</p>
                        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>

                <div class="summary-container">
                    <div class="summary-box">
                        <h3>Lotes Produzidos</h3>
                        <p class="value">${totalBatches}</p>
                    </div>
                    <div class="summary-box">
                        <h3>Total de Unidades Produzidas</h3>
                        <p class="value">${totalProduced}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Data Fab.</th>
                            <th>Cliente</th>
                            <th>Produto</th>
                            <th>Lote</th>
                            <th>Qtd Prod.</th>
                            <th>Pedido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <script>
                    // Add slight delay to ensure logo image loads before printing
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            // Optional: window.close() after print if desired by user, 
                            // but usually it's better to let them preview/save first.
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `

        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()
    }

    return (
        <div className="fade-in" style={{ padding: '0 10px 40px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={24} color="var(--primary-color)" />
                    Relatórios de Produção
                </h1>

                <button
                    onClick={handlePrintReport}
                    className="btn btn-secondary"
                    style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#475569' }}
                    disabled={batches.length === 0}
                >
                    <Printer size={16} />
                    Imprimir / Salvar PDF
                </button>
            </div>

            {/* Seção Filtros */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} /> Filtros de Pesquisa
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Data de Fabricação (De)
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Data de Fabricação (Até)
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Factory size={14} /> Cliente
                        </label>
                        <select
                            className="form-input"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="">Todos os Clientes</option>
                            {clients.map(client => (
                                <option key={client} value={client}>{client}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <button
                            onClick={handleSearch}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '42px', width: '100%' }}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            Pesquisar
                        </button>
                    </div>
                </div>
            </div>

            {/* Seção Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '50%' }}>
                        <Package size={28} color="#3b82f6" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Lotes Produzidos</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{totalBatches}</h2>
                    </div>
                </div>

                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '50%' }}>
                        <FileText size={28} color="#10b981" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Total de Unidades Produzidas</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{totalProduced}</h2>
                    </div>
                </div>
            </div>

            {/* Tabela de Resultados */}
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Resultados da Pesquisa</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Data Fab.</th>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Cliente</th>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Produto</th>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Lote</th>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Qtd Prod.</th>
                                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Pedido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        Nenhum resultado encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                batches.map(batch => (
                                    <tr key={batch.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>{formatDateLabel(batch.manufactureDate)}</td>
                                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>{batch.client}</td>
                                        <td style={{ padding: '12px 16px', color: '#334155' }}>{batch.productName}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>
                                                {batch.batchNumber}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>
                                            {batch.quantity} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{batch.unit}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>#{batch.orderNumber}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
