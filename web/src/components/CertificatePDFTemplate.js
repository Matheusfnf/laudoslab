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
            padding: '30px 40px',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* Cabeçalho */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr', border: '1px solid #1a1a1a', marginBottom: '30px' }}>
                <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #1a1a1a' }}>
                    <img src="/logos/logo.png" alt="Proativa Lab Logo" style={{ height: '70px', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', borderRight: '1px solid #1a1a1a' }}>
                    Certificado de Controle de Qualidade
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1px solid #1a1a1a', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                        Laudo: <span style={{ fontWeight: 'normal' }}>{cert.certificateNumber}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #1a1a1a', fontSize: '12px' }}>
                            <span style={{ fontWeight: 'bold', marginBottom: '4px' }}>Emissão:</span>
                            <span>{formatDate(cert.emissionDate)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                            <span style={{ fontWeight: 'bold', marginBottom: '4px' }}>Página:</span>
                            <span>1/1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal (2 Colunas com as Tabelas no meio) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1 }}>

                {/* Coluna Esquerda: Informações Gerais do Lote */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Produto:</strong>
                        <span>{cert.productName || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Código:</strong>
                        <span>{cert.productCode || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Marca:</strong>
                        <span>{cert.brand || 'Proativa - Soluções Biológicas'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Lote:</strong>
                        <span>{cert.batchNumber || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Fabricação:</strong>
                        <span>{formatDate(cert.manufactureDate)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Validade:</strong>
                        <span>{formatDate(cert.expirationDate)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Volume do lote:</strong>
                        <span>{cert.batchVolume || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Apresentação:</strong>
                        <span>{cert.presentation || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <strong style={{ width: '130px' }}>Armazenamento:</strong>
                        <span>{cert.storageConditions || '-'}</span>
                    </div>

                    {/* Assinatura lado esquerdo */}
                    <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingRight: '20px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Responsável Técnico</span>
                        <img
                            src="/logos/assinatura.png"
                            alt="Assinatura Leslie Dias Franco"
                            style={{ height: '50px', objectFit: 'contain', marginBottom: '5px' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ borderTop: '1px solid #1a1a1a', width: '100%', textAlign: 'center', paddingTop: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>Eng. Agr. Leslie Dias Franco</span>
                            <span style={{ fontSize: '11px', display: 'block' }}>CREA-24928/D-GO</span>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Tabelas Técnicas e Imagem */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* Faixa Título Certificado */}
                    <div style={{ backgroundColor: '#00a8e8', color: 'white', textAlign: 'center', padding: '6px', fontWeight: 'bold', fontSize: '13px', margin: '-10px -10px 10px -30px' }}>
                        Certificado
                    </div>

                    {/* Tabela Microrganismos */}
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                        <div style={{ backgroundColor: '#90ce4a', color: 'white', display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>
                            <span>Microrganismo</span>
                            <span>Exponencial</span>
                        </div>
                        {micros && micros.map((m, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ fontStyle: m.name.includes(' ') ? 'italic' : 'normal' }}>{m.name}</span>
                                <span style={{ textAlign: 'center' }}>{m.exponentialValue}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tabela Características */}
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginTop: '10px' }}>
                        <div style={{ backgroundColor: '#90ce4a', color: 'white', display: 'block', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>
                            Característica físico/química
                        </div>
                        {physics && physics.map((p, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ fontWeight: 'bold' }}>{p.characteristic}</span>
                                <span style={{ textAlign: 'center' }}>{p.resultValue}</span>
                            </div>
                        ))}
                    </div>

                    {/* Foto da Placa Petri */}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {cert.imageUrl ? (
                            <img src={cert.imageUrl} alt="Placa de Petri Analisada" style={{ maxWidth: '220px', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', border: '4px solid #fff', boxShadow: '0 0 10px rgba(0,0,0,0.15)' }} />
                        ) : (
                            <div style={{ width: '220px', height: '220px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
                                Imagem da análise não informada
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Rodapé / Observações Padrão */}
            <div style={{ marginTop: '20px', paddingTop: '20px', fontSize: '10px', color: '#1a1a1a', lineHeight: '1.4' }}>
                <p style={{ margin: 0 }}>
                    Os resultados expressos neste certificado se referem apenas aos parâmetros avaliados da amostra correspondente ao lote produzido, não podendo se estender a outros lotes.
                </p>
                <p style={{ margin: '2px 0 15px 0', fontWeight: 'bold' }}>
                    A conservação do produto é de inteira responsabilidade do adquirente.
                </p>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '11px' }}>PROATIVA LAB- SOLUÇÕES BIOLÓGICAS</p>
                    <p style={{ margin: '0 0 2px 0' }}>RUA DOS CARAJÁS , N°888, BAIRRO CAIÇARAS, PATOS DE MINAS -MG, CEP 38702-188.</p>
                    <p style={{ margin: 0 }}>Fone: (34) 9 9303-0633 &nbsp;&nbsp;&nbsp; e-mail: gestaoadm@proativa.agr.br</p>
                </div>
            </div>

        </div>
    );
});

CertificatePDFTemplate.displayName = 'CertificatePDFTemplate';

export default CertificatePDFTemplate;
