import React from 'react';

const ReportPDFTemplate = React.forwardRef(({ report, micros }, ref) => {
    if (!report) return null;

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

    return (
        <div ref={ref} style={{
            padding: '40px',
            backgroundColor: '#fbf8f5', // Fallback color
            background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.9) 0%, rgba(240, 250, 245, 0.9) 50%, rgba(230, 245, 240, 0.9) 100%)', // Light blue/green gradient
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
                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#007aff', fontWeight: 600 }}>{report.name}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                        <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 'bold', fontSize: '14px' }}>Emissão</p>
                        <p style={{ margin: '4px 0 0 0' }}>{formatDate(report.issue_date)}</p>
                    </div>
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', paddingBottom: '10px', color: '#007aff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informações Cadastrais</h2>

                {/* Grid for Info - Tighter Modern Layout */}
                <div style={{ padding: '15px', backgroundColor: '#fcfcfd', borderRadius: '12px', border: '1px solid #edf1f7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px', fontSize: '13px' }}>

                        {/* Linha 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Solicitante</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.requester || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Matriz Analítica</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.matrix || 'Cultura microbiana comercial'}</strong>
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
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Data Coleta</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(report.collection_date)}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Entregue Por</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{report.delivered_by || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Entrada no Lab</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(report.entry_date)}</strong>
                        </div>

                    </div>
                </div>
            </div>

            {micros && micros.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: 'bold', margin: '10px 0', paddingLeft: '5px' }}>Apresentação dos Resultados</h2>

                    {micros.map((micro, idx) => {
                        const recoveredList = micro.recovered && micro.recovered.length > 0
                            ? micro.recovered
                            : (micro.name || micro.cfu_per_ml ? [{ name: micro.name, cfu_per_ml: micro.cfu_per_ml }] : []);

                        return (
                            <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Código</span>
                                        <strong style={{ fontSize: '16px', color: '#007aff' }}>{micro.code || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Produto / Microrganismo</span>
                                        <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>{micro.name || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Produto Comercial</span>
                                        <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>{micro.commercial_product || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>pH</span>
                                        <strong style={{ fontSize: '14px', color: '#1a1a1a', display: 'inline-block', backgroundColor: '#f2f2f7', padding: '4px 14px', borderRadius: '20px' }}>{micro.ph || '-'}</strong>
                                    </div>
                                </div>

                                {micro.observations && (
                                    <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                                        <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Observações da amostra</span>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{micro.observations}</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

                                    {/* Recuperados */}
                                    <div style={{ background: '#fafdfa', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #34c759' }}>
                                        <h4 style={{ margin: '0 0 16px 0', color: '#2d8a43', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Microrganismos Recuperados</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {recoveredList.map((rec, rIdx) => (
                                                <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                                    <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 500 }}>{rec.name || '-'}</span>
                                                    <span style={{ fontSize: '13px', backgroundColor: '#e8f7ec', color: '#2d8a43', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>{rec.cfu_per_ml || '-'}</span>
                                                </div>
                                            ))}
                                            {recoveredList.length === 0 && <span style={{ fontSize: '13px', color: '#888' }}>Nenhum recuperado</span>}
                                        </div>
                                    </div>

                                    {/* Indicadores */}
                                    <div style={{ background: '#f5f9ff', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #007aff' }}>
                                        <h4 style={{ margin: '0 0 16px 0', color: '#0056b3', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Indicadores</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                                <span style={{ fontSize: '14px', color: '#666' }}>Enterobactérias</span>
                                                <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 600 }}>{micro.enterobacteria || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                                                <span style={{ fontSize: '14px', color: '#666' }}>Bolor/Levedura</span>
                                                <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 600 }}>{micro.mold_yeast || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {report.observations && (
                <div style={{ marginTop: '20px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h2 style={{ fontSize: '16px', color: '#1a1a1a', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Considerações do Laudo</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{report.observations}</p>
                </div>
            )}

            {report.images && report.images.length > 0 && (
                <div style={{ marginTop: '30px', breakBefore: 'page', pageBreakBefore: 'always' }}>
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
                    <li>As análises são baseadas em morfologia e características encontradas no produto comercial padrão. Não nos responsabilizamos pela garantia dos produtos comerciais.</li>
                    <li>Os resultados expressos neste laudo se referem apenas aos parâmetros avaliados da amostra entregue ao Laboratório ProativaLab, não podendo se estender a outras amostras.</li>
                    <li>O Laudo de Controle de Qualidade somente poderá ser reproduzido na sua totalidade.</li>
                    <li>A identificação da amostra é de exclusiva responsabilidade do requerente.</li>
                    <li>A amostra deve apresentar quantidade de material suficiente para o diagnóstico correto, no minimo 200 mL ou 100 gramas.</li>
                    <li>Para adequada identificação de gênero e espécie, os microrganismos devem estar em condições morfológicas tais quais sejam reconhecíveis e diagnosticáveis.</li>
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
                                <div><strong>UFC</strong> = unidades formadoras de colônias</div>
                                <div><strong>N.D</strong> = não detectado</div>
                                <div><strong>N.C</strong> = não consta</div>
                                <div><strong>N.S</strong> = não solicitado</div>
                                <div><strong>&lt;1x10</strong> = ausência na menor alíquota inoculada</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '40px', marginTop: '22px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>10<sup>0</sup> = 1</div>
                                <div>10<sup>1</sup> = 10</div>
                                <div>10<sup>2</sup> = 100</div>
                                <div>10<sup>3</sup> = 1.000</div>
                                <div>10<sup>4</sup> = 10.000</div>
                                <div>10<sup>5</sup> = 100.000</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>10<sup>6</sup> = 1.000.000</div>
                                <div>10<sup>7</sup> = 10.000.000</div>
                                <div>10<sup>8</sup> = 100.000.000</div>
                                <div>10<sup>9</sup> = 1.000.000.000</div>
                                <div>10<sup>10</sup> = 10.000.000.000</div>
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

ReportPDFTemplate.displayName = 'ReportPDFTemplate';

export default ReportPDFTemplate;
