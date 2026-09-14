import React from 'react';

// Relatório de acompanhamento de um Pedido de Produção, para enviar ao cliente.
// Mostra o que foi solicitado, o que já foi entregue e o que ainda falta,
// com o total agrupado por produto e a quantidade de cada lote individual.

const CATEGORY_LABELS = {
    cepa: { label: 'Cepas', color: '#0284c7' },
    metabolito: { label: 'Metabólitos', color: '#9333ea' },
    meio_cultura: { label: 'Meios de Cultura', color: '#d97706' }
};

const CATEGORY_ORDER = ['cepa', 'metabolito', 'meio_cultura'];

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

const formatQty = (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

// Só imagem pode ser rasterizada dentro do PDF; PDF e áudio viram referência.
const receiptKind = (url) => {
    const clean = String(url).split('?')[0].toLowerCase();
    if (/\.(mp3|wav|ogg|m4a|aac)$/.test(clean)) return 'audio';
    if (/\.pdf$/.test(clean)) return 'pdf';
    return 'image';
};

// Cores/rótulos de situação do lote. Só 'done' conta como entregue.
const batchStatus = (status) => status === 'done'
    ? { label: 'Entregue', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
    : { label: 'Em produção', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' };

const OrderReportPDFTemplate = React.forwardRef(({ order, batches }, ref) => {
    if (!order) return null;

    const orderBatches = batches || [];
    const receipts = (order.receiptImageUrls || []).filter(Boolean);

    // --- Agregação por produto -------------------------------------------
    const products = (order.items || []).map(item => {
        const itemBatches = orderBatches
            .filter(b => b.itemId === item.id)
            .sort((a, b) => String(a.batchNumber).localeCompare(String(b.batchNumber)));

        const delivered = itemBatches
            .filter(b => b.status === 'done')
            .reduce((sum, b) => sum + Number(b.quantityProduced || 0), 0);

        const inProduction = itemBatches
            .filter(b => b.status !== 'done')
            .reduce((sum, b) => sum + Number(b.quantityProduced || 0), 0);

        const requested = Number(item.quantityRequested || 0);
        const missing = Math.max(requested - delivered - inProduction, 0);
        const percent = requested > 0 ? Math.min(Math.round((delivered / requested) * 100), 100) : 0;

        return {
            ...item,
            batches: itemBatches,
            delivered,
            inProduction,
            requested,
            missing,
            percent,
            isComplete: delivered >= requested && requested > 0
        };
    });

    // --- Totais por unidade (somar UN com LT não faria sentido) -----------
    const totalsByUnit = {};
    products.forEach(p => {
        const unit = p.unit || 'UN';
        if (!totalsByUnit[unit]) totalsByUnit[unit] = { requested: 0, delivered: 0, inProduction: 0, missing: 0 };
        totalsByUnit[unit].requested += p.requested;
        totalsByUnit[unit].delivered += p.delivered;
        totalsByUnit[unit].inProduction += p.inProduction;
        totalsByUnit[unit].missing += p.missing;
    });

    const completedCount = products.filter(p => p.isComplete).length;
    const totalBatches = products.reduce((sum, p) => sum + p.batches.length, 0);

    // --- Estilos reutilizados --------------------------------------------
    const card = {
        background: '#fff', borderRadius: '12px', padding: '14px 18px',
        border: '1px solid #edf1f7', marginBottom: '12px',
        pageBreakInside: 'avoid', breakInside: 'avoid'
    };
    const sectionTitle = {
        fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0',
        color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px'
    };
    const fieldLabel = {
        fontSize: '9px', textTransform: 'uppercase', color: '#8a94a6',
        fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '2px'
    };
    const fieldValue = { fontSize: '12px', color: '#1a1a1a', fontWeight: 600 };
    const th = {
        textAlign: 'left', fontSize: '9px', textTransform: 'uppercase',
        color: '#8a94a6', fontWeight: 700, letterSpacing: '0.4px',
        padding: '0 8px 5px 8px', borderBottom: '1px solid #edf1f7'
    };
    const td = { fontSize: '11px', color: '#1a1a1a', padding: '6px 8px', borderBottom: '1px solid #f6f8fa' };

    return (
        <div ref={ref} style={{
            padding: '20px',
            backgroundColor: '#fbfcfe',
            background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.9) 0%, rgba(240, 250, 245, 0.9) 50%, rgba(230, 245, 240, 0.9) 100%)',
            color: '#1d1d1f',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            width: '210mm',
            boxSizing: 'border-box'
        }}>

            {/* ============ CABEÇALHO ============ */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '12px' }}>
                    <img src="/logos/logo.png" alt="Proativa Lab" style={{ height: '45px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', textTransform: 'uppercase' }}>
                            Relatório de Produção
                        </h1>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                            Acompanhamento do Pedido
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', borderLeft: '1px solid #eee', paddingLeft: '15px', minWidth: '90px' }}>
                        <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 'bold', fontSize: '11px' }}>Pedido N°</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#0284c7', fontWeight: 700 }}>{order.orderNumber}</p>
                    </div>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: '#fcfcfd', borderRadius: '10px', border: '1px solid #edf1f7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 8px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={fieldLabel}>Cliente</span>
                            <strong style={{ ...fieldValue, fontSize: '13px' }}>{order.client || '-'}</strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Solicitante</span>
                            <strong style={fieldValue}>{order.requesterName || '-'}</strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Situação</span>
                            <strong style={{ ...fieldValue, color: order.status === 'completed' ? '#059669' : '#d97706' }}>
                                {order.status === 'completed' ? 'Concluído' : 'Em andamento'}
                            </strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Data do Pedido</span>
                            <strong style={fieldValue}>{formatDate(order.orderDate)}</strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Previsão de Conclusão</span>
                            <strong style={fieldValue}>{formatDate(order.estimatedCompletionDate)}</strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Produtos no Pedido</span>
                            <strong style={fieldValue}>{products.length}</strong>
                        </div>
                        <div>
                            <span style={fieldLabel}>Lotes Produzidos</span>
                            <strong style={fieldValue}>{totalBatches}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ RESUMO ============ */}
            <div style={card}>
                <h2 style={sectionTitle}>Resumo Geral</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#4a5568' }}>
                        {/* Verde só quando há de fato produto concluído — zero em verde engana */}
                        <strong style={{ color: completedCount > 0 ? '#059669' : '#8a94a6', fontSize: '14px' }}>{completedCount}</strong>
                        {' '}de{' '}
                        <strong style={{ fontSize: '14px' }}>{products.length}</strong>
                        {' '}produtos entregues integralmente
                    </div>
                </div>

                {/* Totais separados por unidade — somar LT com UN não teria sentido */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={th}>Unidade</th>
                            <th style={{ ...th, textAlign: 'right' }}>Solicitado</th>
                            <th style={{ ...th, textAlign: 'right' }}>Entregue</th>
                            <th style={{ ...th, textAlign: 'right' }}>Em produção</th>
                            <th style={{ ...th, textAlign: 'right' }}>Falta produzir</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(totalsByUnit).map(([unit, t]) => (
                            <tr key={unit}>
                                <td style={{ ...td, fontWeight: 700 }}>{unit}</td>
                                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatQty(t.requested)}</td>
                                <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatQty(t.delivered)}</td>
                                <td style={{ ...td, textAlign: 'right', color: '#0369a1' }}>{formatQty(t.inProduction)}</td>
                                <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: t.missing > 0 ? '#d97706' : '#8a94a6' }}>{formatQty(t.missing)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ============ PAINEL SUCINTO: TODOS OS PRODUTOS DE UMA VEZ ============ */}
            <div style={card}>
                <h2 style={sectionTitle}>Solicitado x Entregue</h2>
                <p style={{ margin: '-4px 0 10px 0', fontSize: '10px', color: '#8a94a6' }}>
                    Visão geral de todos os produtos do pedido. O detalhamento de lotes vem na sequência.
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={th}>Produto</th>
                            <th style={{ ...th, textAlign: 'right' }}>Solicitado</th>
                            <th style={{ ...th, textAlign: 'right' }}>Entregue</th>
                            <th style={{ ...th, textAlign: 'right' }}>Falta</th>
                            <th style={{ ...th, textAlign: 'center', width: '64px' }}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            const cat = CATEGORY_LABELS[p.productCategory || 'cepa'] || CATEGORY_LABELS.cepa;
                            return (
                                <tr key={p.id}>
                                    <td style={td}>
                                        <span style={{
                                            display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                                            background: cat.color, marginRight: '7px', verticalAlign: 'middle'
                                        }} />
                                        <span style={{ fontWeight: 600 }}>{p.productName}</span>
                                    </td>
                                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatQty(p.requested)} {p.unit}</td>
                                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatQty(p.delivered)} {p.unit}</td>
                                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: p.missing > 0 ? '#d97706' : '#8a94a6' }}>{formatQty(p.missing)} {p.unit}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block', minWidth: '38px', borderRadius: '20px',
                                            padding: '1px 6px', fontSize: '10px', fontWeight: 700,
                                            background: p.isComplete ? '#ecfdf5' : '#fffbeb',
                                            color: p.isComplete ? '#059669' : '#d97706',
                                            border: `1px solid ${p.isComplete ? '#a7f3d0' : '#fde68a'}`
                                        }}>
                                            {p.percent}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ============ PRODUTOS, POR CLASSE ============ */}
            {CATEGORY_ORDER.map(catId => {
                const catProducts = products.filter(p => (p.productCategory || 'cepa') === catId);
                if (catProducts.length === 0) return null;
                const cat = CATEGORY_LABELS[catId];

                return (
                    <div key={catId}>
                        <div style={{
                            fontSize: '11px', fontWeight: 800, color: cat.color, textTransform: 'uppercase',
                            letterSpacing: '0.6px', margin: '14px 0 8px 4px', display: 'flex',
                            alignItems: 'center', gap: '8px', pageBreakAfter: 'avoid', breakAfter: 'avoid'
                        }}>
                            <span style={{ width: '18px', height: '2px', background: cat.color, display: 'inline-block' }} />
                            {cat.label} ({catProducts.length})
                        </div>

                        {catProducts.map(p => (
                            <div key={p.id} style={{ ...card, borderLeft: `3px solid ${cat.color}`, marginBottom: '10px' }}>

                                {/* Produto + total agrupado */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>{p.productName}</div>
                                        <div style={{ fontSize: '10px', color: '#8a94a6', marginTop: '2px' }}>
                                            {p.batches.length} {p.batches.length === 1 ? 'lote' : 'lotes'} registrado{p.batches.length === 1 ? '' : 's'}
                                        </div>
                                    </div>
                                    <div style={{
                                        flexShrink: 0, textAlign: 'right', background: p.isComplete ? '#ecfdf5' : '#fffbeb',
                                        border: `1px solid ${p.isComplete ? '#a7f3d0' : '#fde68a'}`, borderRadius: '8px', padding: '4px 10px'
                                    }}>
                                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#8a94a6', fontWeight: 700, letterSpacing: '0.4px' }}>
                                            {p.isComplete ? 'Entregue' : 'Progresso'}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: p.isComplete ? '#059669' : '#d97706' }}>
                                            {p.percent}%
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de progresso */}
                                <div style={{ height: '6px', background: '#eef2f7', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                                    <div style={{ width: `${p.percent}%`, height: '100%', background: p.isComplete ? '#10b981' : '#0ea5e9', borderRadius: '4px' }} />
                                </div>

                                {/* Números agrupados do produto */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: p.batches.length > 0 ? '12px' : '0' }}>
                                    <div style={{ background: '#fcfcfd', border: '1px solid #edf1f7', borderRadius: '8px', padding: '6px 10px' }}>
                                        <span style={fieldLabel}>Solicitado</span>
                                        <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatQty(p.requested)} {p.unit}</strong>
                                    </div>
                                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '6px 10px' }}>
                                        <span style={fieldLabel}>Entregue</span>
                                        <strong style={{ fontSize: '13px', color: '#059669' }}>{formatQty(p.delivered)} {p.unit}</strong>
                                    </div>
                                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '6px 10px' }}>
                                        <span style={fieldLabel}>Em produção</span>
                                        <strong style={{ fontSize: '13px', color: '#0369a1' }}>{formatQty(p.inProduction)} {p.unit}</strong>
                                    </div>
                                    <div style={{ background: p.missing > 0 ? '#fffbeb' : '#fcfcfd', border: `1px solid ${p.missing > 0 ? '#fde68a' : '#edf1f7'}`, borderRadius: '8px', padding: '6px 10px' }}>
                                        <span style={fieldLabel}>Falta produzir</span>
                                        <strong style={{ fontSize: '13px', color: p.missing > 0 ? '#d97706' : '#8a94a6' }}>{formatQty(p.missing)} {p.unit}</strong>
                                    </div>
                                </div>

                                {/* Lotes individuais deste produto */}
                                {p.batches.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={th}>Lote</th>
                                                <th style={{ ...th, textAlign: 'right' }}>Quantidade</th>
                                                <th style={{ ...th, textAlign: 'center' }}>Fabricação</th>
                                                <th style={{ ...th, textAlign: 'center' }}>Validade</th>
                                                <th style={{ ...th, textAlign: 'center' }}>Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {p.batches.map(b => {
                                                const st = batchStatus(b.status);
                                                return (
                                                    <tr key={b.id}>
                                                        <td style={{ ...td, fontWeight: 700, color: '#0284c7' }}>{b.batchNumber}</td>
                                                        <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{formatQty(b.quantityProduced)} {p.unit}</td>
                                                        <td style={{ ...td, textAlign: 'center', color: '#4a5568' }}>{formatDate(b.manufactureDate)}</td>
                                                        <td style={{ ...td, textAlign: 'center', color: '#4a5568' }}>{formatDate(b.expirationDate)}</td>
                                                        <td style={{ ...td, textAlign: 'center' }}>
                                                            <span style={{
                                                                display: 'inline-block', background: st.bg, color: st.color,
                                                                border: `1px solid ${st.border}`, borderRadius: '20px',
                                                                padding: '1px 8px', fontSize: '9px', fontWeight: 700
                                                            }}>
                                                                {st.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ fontSize: '10px', color: '#8a94a6', fontStyle: 'italic', paddingTop: '2px' }}>
                                        Nenhum lote iniciado até o momento.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* ============ ANEXO: COMPROVANTES DO PEDIDO ============ */}
            {receipts.length > 0 && (
                <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: '4px' }}>
                    <div style={card}>
                        <h2 style={sectionTitle}>Anexo — Comprovantes do Pedido</h2>
                        <p style={{ margin: '-4px 0 0 0', fontSize: '10px', color: '#8a94a6' }}>
                            {receipts.length} {receipts.length === 1 ? 'comprovante anexado' : 'comprovantes anexados'} no momento do registro do pedido.
                        </p>
                    </div>

                    {receipts.map((receipt, idx) => {
                        const url = receipt.url;
                        const kind = receiptKind(url);
                        const description = (receipt.description || '').trim();
                        return (
                            <div key={url} style={{ ...card, textAlign: 'center' }}>
                                <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                                    <div style={{
                                        fontSize: '10px', textTransform: 'uppercase', color: '#8a94a6',
                                        fontWeight: 700, letterSpacing: '0.5px'
                                    }}>
                                        Comprovante {idx + 1} de {receipts.length}
                                    </div>
                                    {description && (
                                        <div style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 600, marginTop: '2px' }}>
                                            {description}
                                        </div>
                                    )}
                                </div>

                                {kind === 'image' ? (
                                    <img
                                        src={url}
                                        crossOrigin="anonymous"
                                        alt={`Comprovante ${idx + 1}`}
                                        style={{
                                            maxWidth: '100%', maxHeight: '215mm', objectFit: 'contain',
                                            borderRadius: '8px', border: '1px solid #edf1f7', display: 'block', margin: '0 auto'
                                        }}
                                    />
                                ) : (
                                    // PDF e áudio não podem ser rasterizados dentro do relatório;
                                    // fica o registro do arquivo com o link para abrir.
                                    <div style={{
                                        background: '#fcfcfd', border: '1px dashed #cbd5e1', borderRadius: '8px',
                                        padding: '16px', textAlign: 'left'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                                            {kind === 'pdf' ? 'Documento PDF' : 'Arquivo de áudio'}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '6px' }}>
                                            Este tipo de arquivo não pode ser exibido dentro do relatório. Acesse pelo endereço abaixo.
                                        </div>
                                        <div style={{ fontSize: '8px', color: '#0284c7', wordBreak: 'break-all' }}>{url}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============ RODAPÉ ============ */}
            <div style={{
                margin: '12px 20px 0 20px', paddingTop: '8px', borderTop: '1px solid #e0e0e0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '8px', color: '#888'
            }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Proativa — Soluções Biológicas</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                    Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </p>
            </div>
        </div>
    );
});

OrderReportPDFTemplate.displayName = 'OrderReportPDFTemplate';

export default OrderReportPDFTemplate;
