import React from 'react';

const CertificatePDFTemplate = React.forwardRef(({ cert, micros, physics }, ref) => {
    if (!cert) return null;

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
            padding: '20px',
            backgroundColor: '#fbf8f5', // Fallback color
            background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.9) 0%, rgba(240, 250, 245, 0.9) 50%, rgba(230, 245, 240, 0.9) 100%)', // Light blue/green gradient
            color: '#1d1d1f',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            width: '210mm',
            boxSizing: 'border-box'
        }}>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '15px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '12px', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img src="/logos/logo.png" alt="Proativa Lab Logo" style={{ height: '45px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', textTransform: 'uppercase' }}>
                            Certificado de Produção
                        </h1>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#007aff', fontWeight: 600 }}>Padrão de Qualidade</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', borderLeft: '1px solid #eee', paddingLeft: '15px' }}>
                        <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 'bold', fontSize: '12px' }}>Certificado N°</p>
                        <p style={{ margin: '2px 0 0 0' }}>{cert.certificateNumber}</p>
                    </div>
                </div>

                <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', paddingBottom: '6px', color: '#007aff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informações do Produto</h2>

                {/* Grid for Info - Tighter Modern Layout */}
                <div style={{ padding: '10px 15px', backgroundColor: '#fcfcfd', borderRadius: '10px', border: '1px solid #edf1f7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 8px', fontSize: '11px' }}>

                        {/* Linha 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Produto Comercial</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.productName || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Código do Produto</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.productCode || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Lote de Produção</span>
                            <strong style={{ fontSize: '13px', color: '#007aff' }}>{cert.batchNumber || '-'}</strong>
                        </div>

                        {/* Linha 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 2' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Marca</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.brand || 'Proativa - Soluções Biológicas'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Fabricação</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(cert.manufactureDate)}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Validade</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(cert.expirationDate)}</strong>
                        </div>

                        {/* Linha 3 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Data de Emissão</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{formatDate(cert.emissionDate)}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Volume Produzido</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.batchVolume || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Apresentação</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.presentation || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: 'span 1' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>Cond. de Armazenamento</span>
                            <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>{cert.storageConditions || '-'}</strong>
                        </div>

                    </div>
                </div>
            </div>

            {/* Conteúdo Técnico Dividido em Blocos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '15px', flex: 1, marginBottom: '12px' }}>

                {/* Coluna 1: Tabelas de Características e Microrganismos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* Tabela de Microrganismos */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 15px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '13px', color: '#2d8a43', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', paddingBottom: '6px' }}>Concentração Biológica</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fcfcfd', borderBottom: '1px solid #edf1f7', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Espécie Alvo</span>
                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Espectro / UFC/mL</span>
                            </div>
                            {micros && micros.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #edf1f7', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontStyle: m.name.includes(' ') ? 'italic' : 'normal', fontWeight: 500 }}>{m.name || '-'}</span>
                                    <span style={{ fontSize: '13px', backgroundColor: '#e8f7ec', color: '#2d8a43', padding: '3px 12px', borderRadius: '16px', fontWeight: 600 }}>{m.exponentialValue || '-'}</span>
                                </div>
                            ))}
                            {(!micros || micros.length === 0) && (
                                <div style={{ padding: '10px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum microrganismo informado.</div>
                            )}
                        </div>
                    </div>

                    {/* Tabela de Fisico/Quimicos */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 15px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '13px', color: '#007aff', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', paddingBottom: '6px' }}>Características Físico-Químicas</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fcfcfd', borderBottom: '1px solid #edf1f7', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parâmetro Analisado</span>
                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resultado Obtido</span>
                            </div>
                            {physics && physics.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #edf1f7', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>{p.characteristic || '-'}</span>
                                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 600 }}>{p.resultValue || '-'}</span>
                                </div>
                            ))}
                            {(!physics || physics.length === 0) && (
                                <div style={{ padding: '10px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma característica informada.</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Coluna 2: Anexo Fotográfico (Petri Plaque) */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 15px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>Evidência Fotográfica</h2>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '6px 0', backgroundColor: '#fcfcfd', border: '1px solid #edf1f7', borderRadius: '10px', padding: '10px' }}>
                            {cert.imageUrl ? (
                                <img src={cert.imageUrl} alt="Análise Biológica Placa" style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
                            ) : (
                                <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
                                    <p>Nenhuma imagem comprobatória anexada.</p>
                                </div>
                            )}
                        </div>
                        <p style={{ margin: 0, textAlign: 'center', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                            Registro visual - Contagem em meio de cultura seletivo.
                        </p>
                    </div>
                </div>

            </div>

            {/* INFORMAÇÕES PADRONIZADAS DO LABORATÓRIO (Using the exact same block from ReportPDFTemplate) */}
            <div style={{ marginTop: 'auto', padding: '12px 20px', backgroundColor: '#fff', borderRadius: '12px', fontSize: '9px', color: '#555', lineHeight: '1.4', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <ol style={{ paddingLeft: '15px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Os resultados expressos neste comunicado referem-se exclusiva e restritamente ao volume amostral submetido a análise e testes no Lote em questão, não se estendendo a partidas não representadas.</li>
                    <li>O Laudo de Controle de Qualidade somente poderá ser reproduzido, copiado ou compartilhado na sua totalidade estrutural.</li>
                    <li>A estabilidade, armazenamento e conservação do produto fora das instalações originais são de inteira responsabilidade do adquirente e revendedor.</li>
                    <li>Para as definições analíticas de pureza de estirpe e contaminação em lote aplicam-se metodologias normativas reconhecidas para recuperação e plaqueamento em meio seletivo cromogênico específico de cultura de microrganismos.</li>
                </ol>

                <div style={{ marginBottom: '12px', textAlign: 'center', backgroundColor: '#f9fbfd', padding: '8px', borderRadius: '8px', border: '1px solid #edf1f7' }}>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '800', color: '#1a1a1a' }}>BIO PROATIVA LAB - ANÁLISES BIOLÓGICAS</h3>
                    <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#444' }}>RUA DOS CARAJÁS , N°888, BAIRRO CAIÇARAS, PATOS DE MINAS -MG, CEP 38702-188.</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#444' }}>Fone: (34) 9 9303-0633 &nbsp;|&nbsp; e-mail: gestaoadm@proativa.agr.br</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #edf1f7', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '6px', color: '#1a1a1a', fontSize: '10px' }}>Legenda:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div><strong>UFC</strong> = unidades formadoras de colônias</div>
                                <div><strong>N.D</strong> = não detectado</div>
                                <div><strong>N.C</strong> = não consta</div>
                                <div><strong>N.S</strong> = não solicitado</div>
                                <div><strong>&lt;1x10</strong> = ausência na menor alíquota inoculada</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '30px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div>10<sup>0</sup> = 1</div>
                                <div>10<sup>1</sup> = 10</div>
                                <div>10<sup>2</sup> = 100</div>
                                <div>10<sup>3</sup> = 1.000</div>
                                <div>10<sup>4</sup> = 10.000</div>
                                <div>10<sup>5</sup> = 100.000</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div>10<sup>6</sup> = 1.000.000</div>
                                <div>10<sup>7</sup> = 10.000.000</div>
                                <div>10<sup>8</sup> = 100.000.000</div>
                                <div>10<sup>9</sup> = 1.000.000.000</div>
                                <div>10<sup>10</sup> = 10.000.000.000</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ alignSelf: 'flex-end', textAlign: 'center', minWidth: '180px', paddingRight: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#1a1a1a' }}>Responsável Técnico</p>
                        <img
                            src="/logos/assinatura.png"
                            alt="Assinatura Leslie Dias Franco"
                            style={{ maxWidth: '100%', height: '40px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4px', marginTop: '2px' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#1a1a1a', fontWeight: 'bold' }}>Eng. Agr. Leslie Dias Franco</p>
                            <p style={{ margin: 0, fontSize: '10px', color: '#1a1a1a' }}>CREA-24928/D-GO</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ margin: '12px 20px 0 20px', paddingTop: '8px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '8px', color: '#888' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>

        </div>
    );
});

CertificatePDFTemplate.displayName = 'CertificatePDFTemplate';

export default CertificatePDFTemplate;
