import React from 'react';

const SoilReportPDFTemplate = React.forwardRef(({ report }, ref) => {
    if (!report || !report.matrix_results || !report.matrix_results.samples) return null;

    const samples = report.matrix_results.samples;

    // Formatting dates
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
            return new Date(dateString + 'T12:00:00Z').toLocaleDateString('pt-BR');
        } catch (e) {
            return dateString;
        }
    };

    const formatSuperscript = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\^0/g, '⁰').replace(/\^1/g, '¹').replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\^4/g, '⁴').replace(/\^5/g, '⁵').replace(/\^6/g, '⁶').replace(/\^7/g, '⁷').replace(/\^8/g, '⁸').replace(/\^9/g, '⁹');
    };

    return (
        <div ref={ref} style={{
            padding: '40px',
            backgroundColor: '#fbf8f5', // Fallback color
            background: 'linear-gradient(135deg, rgba(255, 248, 240, 0.9) 0%, rgba(250, 245, 240, 0.9) 50%, rgba(245, 240, 230, 0.9) 100%)', // Light orange/brown gradient for soil
            color: '#1d1d1f',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box'
        }}>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '30px', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img src="/logos/logo.png" alt="Proativa Lab Logo" style={{ height: '70px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', textTransform: 'uppercase' }}>
                            Laudo Analítico
                        </h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#c2410c', fontWeight: 600 }}>{report.name}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                        <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 'bold', fontSize: '14px' }}>Emissão</p>
                        <p style={{ margin: '4px 0 0 0' }}>{formatDate(report.issue_date)}</p>
                    </div>
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', paddingBottom: '10px', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informações Cadastrais</h2>

                <div style={{ padding: '15px', backgroundColor: '#fcfcfd', borderRadius: '12px', border: '1px solid #edf1f7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px', fontSize: '13px' }}>
                        {/* Linha 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Solicitante</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.requester || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Matriz Analítica</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.analytical_matrix || '-'}</strong>
                        </div>

                        {/* Linha 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Cliente</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.clients?.name || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Propriedade</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.property || '-'}</strong>
                        </div>

                        {/* Linha 3 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 4' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Município / UF</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>
                                {report.city ? `${report.city} - ${report.state || ''}` : '-'}
                            </strong>
                        </div>

                        {/* Linha 4 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Quem Coletou</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.collected_by || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Data da Coleta</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(report.collection_date)}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Entregue Por</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.delivered_by || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Data Entrada</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(report.entry_date)}</strong>
                        </div>
                    </div>
                </div>

                {samples && samples.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 15px 0', paddingBottom: '10px', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Resultados Analíticos: Pesquisa e Quantificação de Fungos em Solo
                        </h2>

                        {samples.map((sample, sIndex) => {
                            return (
                                <div key={sIndex} style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid', border: '1px solid #edf1f7' }}>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Código da Amostra</span>
                                            <strong style={{ fontSize: '14px', color: '#007aff' }}>{sample.code || '-'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Identificação</span>
                                            <strong style={{ fontSize: '13px', color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>{sample.identification || '-'}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '15px' }}>
                                        <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '12px 16px', borderLeft: '4px solid #ea580c' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#c2410c', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gênero</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {sample.microorganisms?.map((micro, mIndex) => (
                                                    <div key={mIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                                        <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500, fontStyle: 'italic' }}>{micro.genus || '-'}</span>
                                                        <span style={{ fontSize: '12px', backgroundColor: '#ffedd5', color: '#ea580c', padding: '3px 10px', borderRadius: '16px', fontWeight: 600 }}>{formatSuperscript(micro.count) || '-'}</span>
                                                    </div>
                                                ))}
                                                {(!sample.microorganisms || sample.microorganisms.length === 0) && <span style={{ fontSize: '12px', color: '#888' }}>Nenhum fungo registrado</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {report.observations && (
                <div style={{ marginTop: '20px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h2 style={{ fontSize: '16px', color: '#1a1a1a', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Considerações do Laudo</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{report.observations}</p>
                </div>
            )}

            {report.images && report.images.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h2 style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: 'bold', margin: '0 0 20px 0', paddingLeft: '5px' }}>Anexos Fotográficos</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {report.images.map((imgObj, idx) => {
                            const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                            const desc = typeof imgObj === 'string' ? '' : imgObj.description;
                            return (
                                <div key={idx} style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid', display: 'inline-block', width: '100%', textAlign: 'center' }}>
                                    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                        <img src={url} alt={`Anexo ${idx + 1}`} style={{ maxWidth: '100%', height: 'auto', display: 'block', maxHeight: '800px' }} />
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ display: 'block', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Figura {idx + 1}</span>
                                        {desc && <span style={{ display: 'block', fontSize: '14px', color: '#1a1a1a', marginTop: '4px' }}>{desc}</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* INFORMAÇÕES PADRONIZADAS DO LABORATÓRIO */}
            <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#fff', borderRadius: '16px', fontSize: '11px', color: '#555', lineHeight: '1.6', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid', breakBefore: report.images && report.images.length > 0 ? 'page' : 'auto', pageBreakBefore: report.images && report.images.length > 0 ? 'always' : 'auto' }}>
                <ol style={{ paddingLeft: '20px', margin: '0 0 25px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Os resultados expressos neste laudo se referem apenas aos parâmetros avaliados da amostra entregue ao Laboratório ProativaLab.</li>
                    <li>O Laudo de Controle de Qualidade somente poderá ser reproduzido na sua totalidade.</li>
                    <li>A identificação da amostra é de exclusiva responsabilidade do requerente.</li>
                    <li>A retenção da amostra para contraprova é de seis dias após a emissão do Laudo de Controle de Qualidade ou de acordo com sua viabilidade.</li>
                </ol>

                <div style={{ marginBottom: '25px', textAlign: 'center', backgroundColor: '#f9fbfd', padding: '15px', borderRadius: '8px', border: '1px solid #edf1f7' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '800', color: '#1a1a1a' }}>BIO PROATIVA LAB - ANÁLISES BIOLÓGICAS</h3>
                    <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#444' }}>RUA DOS CARAJÁS , N°888, BAIRRO CAIÇARAS, PATOS DE MINAS -MG, CEP 38702-188.</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#444' }}>Fone: (34) 9 9303-0633 &nbsp;|&nbsp; e-mail: gestaoadm@proativa.agr.br</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #edf1f7', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '60px' }}>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '8px', color: '#1a1a1a', fontSize: '12px' }}>Legenda:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div><strong>N.S</strong> = não solicitado</div>
                                <div><strong>N.D</strong> = não detectado</div>
                                <div><strong>-</strong> = ausência</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ alignSelf: 'flex-end', textAlign: 'center', minWidth: '220px', paddingRight: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#1a1a1a' }}>Responsável Técnico</p>
                        <img
                            src="/logos/assinatura.png"
                            alt="Assinatura Leslie Dias Franco"
                            style={{ maxWidth: '100%', height: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4px', marginTop: '2px' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#1a1a1a', fontWeight: 'bold' }}>Eng. Agr. Leslie Dias Franco</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#1a1a1a' }}>CREA-24928/D-GO</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ margin: '20px 20px 0 20px', paddingTop: '15px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', color: '#888' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>

        </div>
    );
});

SoilReportPDFTemplate.displayName = 'SoilReportPDFTemplate';

export default SoilReportPDFTemplate;
