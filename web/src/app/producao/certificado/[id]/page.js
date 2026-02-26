'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, FileDown, PlusCircle, Trash2, Camera } from 'lucide-react'
import ImageEditorModal from '@/components/ImageEditorModal'
import CertificatePDFTemplate from '@/components/CertificatePDFTemplate'

// Util function to format powers like ^5 to ⁵
const formatSuperscript = (text) => {
    if (!text) return text;
    const map = {
        '^0': '⁰', '^1': '¹', '^2': '²', '^3': '³', '^4': '⁴',
        '^5': '⁵', '^6': '⁶', '^7': '⁷', '^8': '⁸', '^9': '⁹'
    };
    let formattedText = text;
    for (const [key, val] of Object.entries(map)) {
        formattedText = formattedText.split(key).join(val);
    }
    return formattedText;
};

export default function CertificadoPage() {
    const params = useParams()
    const router = useRouter()
    const batchId = params.id

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [certificateId, setCertificateId] = useState(null)
    const pdfRef = useRef(null)

    // Modal Image
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const [selectedImageFile, setSelectedImageFile] = useState(null)
    const fileInputRef = useRef(null)

    // Form Data
    const [formData, setFormData] = useState({
        certificateNumber: '',
        emissionDate: new Date().toISOString().split('T')[0],
        productName: '',
        productCode: '',
        brand: 'Proativa - Soluções Biológicas',
        batchNumber: '',
        manufactureDate: '',
        expirationDate: '',
        batchVolume: '',
        presentation: '',
        storageConditions: '',
        imageUrl: ''
    })

    const [microorganisms, setMicroorganisms] = useState([
        { id: `temp_${Date.now()}`, name: '', exponentialValue: '' }
    ])

    const [physicochemicals, setPhysicochemicals] = useState([
        { id: `temp_${Date.now()}_1`, characteristic: 'Cor', resultValue: '' },
        { id: `temp_${Date.now()}_2`, characteristic: 'Estado', resultValue: '' },
        { id: `temp_${Date.now()}_3`, characteristic: 'pH', resultValue: '' }
    ])

    useEffect(() => {
        if (batchId) {
            loadData()
        }
    }, [batchId])

    const loadData = async () => {
        try {
            setIsLoading(true)

            // 1. Check if Certificate already exists for this batch
            const { data: existingCert, error: certError } = await supabase
                .from('production_certificates')
                .select('*')
                .eq('batch_id', batchId)
                .single()

            if (certError && certError.code !== 'PGRST116') { // PGRST116 is "No rows found"
                throw certError
            }

            if (existingCert) {
                // Load existing certificate
                setCertificateId(existingCert.id)
                setFormData({
                    certificateNumber: existingCert.certificate_number || '',
                    emissionDate: existingCert.emission_date || new Date().toISOString().split('T')[0],
                    productName: existingCert.product_name || '',
                    productCode: existingCert.product_code || '',
                    brand: existingCert.brand || 'Proativa - Soluções Biológicas',
                    batchNumber: existingCert.batch_number || '',
                    manufactureDate: existingCert.manufacture_date || '',
                    expirationDate: existingCert.expiration_date || '',
                    batchVolume: existingCert.batch_volume || '',
                    presentation: existingCert.presentation || '',
                    storageConditions: existingCert.storage_conditions || '',
                    imageUrl: existingCert.image_url || ''
                })

                // Load tables
                const { data: micros } = await supabase.from('certificate_microorganisms').select('*').eq('certificate_id', existingCert.id).order('name')
                if (micros && micros.length > 0) setMicroorganisms(micros)

                const { data: physics } = await supabase.from('certificate_physicochemical').select('*').eq('certificate_id', existingCert.id).order('characteristic')
                if (physics && physics.length > 0) {
                    const defaultPhysics = [
                        { id: `temp_${Date.now()}_1`, characteristic: 'Cor', resultValue: '' },
                        { id: `temp_${Date.now()}_2`, characteristic: 'Estado', resultValue: '' },
                        { id: `temp_${Date.now()}_3`, characteristic: 'pH', resultValue: '' }
                    ]
                    const mappedPhysics = defaultPhysics.map(dp => {
                        const existing = physics.filter(p => p.characteristic === dp.characteristic)
                        if (existing.length > 0) {
                            const withValue = existing.find(p => p.result_value?.trim());
                            const toUse = withValue || existing[0];
                            return { ...dp, id: toUse.id, resultValue: toUse.result_value || '' }
                        }
                        return dp;
                    })
                    setPhysicochemicals(mappedPhysics)
                }

            } else {
                // Initialize NEW certificate from Batch data
                const { data: batchData, error: batchError } = await supabase
                    .from('production_batches')
                    .select(`
                        id, batch_number, quantity_produced, manufacture_date, expiration_date,
                        production_order_items ( product_name, unit )
                    `)
                    .eq('id', batchId)
                    .single()

                if (batchError) throw batchError

                // Generate new Certificate Number (ex: 02880/2026)
                const year = new Date().getFullYear();
                const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

                setFormData(prev => ({
                    ...prev,
                    certificateNumber: `${randomId}/${year}`,
                    productName: batchData.production_order_items?.product_name || '',
                    batchNumber: batchData.batch_number || '',
                    manufactureDate: batchData.manufacture_date || '',
                    expirationDate: batchData.expiration_date || '',
                    batchVolume: `${batchData.quantity_produced} ${batchData.production_order_items?.unit || ''}`
                }))
            }
        } catch (error) {
            console.error('Error loading data:', error)
            alert('Erro ao carregar os dados. Verifique se as novas tabelas foram criadas no banco (run SQL).')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            let currentCertId = certificateId

            const certPayload = {
                batch_id: batchId,
                certificate_number: formData.certificateNumber,
                emission_date: formData.emissionDate || null,
                product_name: formData.productName,
                product_code: formData.productCode,
                brand: formData.brand,
                batch_number: formData.batchNumber,
                manufacture_date: formData.manufactureDate || null,
                expiration_date: formData.expirationDate || null,
                batch_volume: formData.batchVolume,
                presentation: formData.presentation,
                storage_conditions: formData.storageConditions,
                image_url: formData.imageUrl
            }

            if (currentCertId) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('production_certificates')
                    .update(certPayload)
                    .eq('id', currentCertId)
                if (updateError) throw updateError

                // Clear old sub-tables to recreate them
                await supabase.from('certificate_microorganisms').delete().eq('certificate_id', currentCertId)
                await supabase.from('certificate_physicochemical').delete().eq('certificate_id', currentCertId)
            } else {
                // INSERT
                const { data: newCert, error: insertError } = await supabase
                    .from('production_certificates')
                    .insert([certPayload])
                    .select()
                    .single()

                if (insertError) throw insertError
                currentCertId = newCert.id
                setCertificateId(newCert.id)
            }

            // Insert sub tables
            const validMicros = microorganisms.filter(m => m.name.trim() !== '')
            if (validMicros.length > 0) {
                const microPayload = validMicros.map(m => ({
                    certificate_id: currentCertId,
                    name: m.name,
                    exponential_value: m.exponentialValue
                }))
                await supabase.from('certificate_microorganisms').insert(microPayload)
            }

            const validPhysics = physicochemicals.filter(p => p.characteristic.trim() !== '')
            if (validPhysics.length > 0) {
                const physicPayload = validPhysics.map(p => ({
                    certificate_id: currentCertId,
                    characteristic: p.characteristic,
                    result_value: p.resultValue || p.result_value || ''
                }))
                await supabase.from('certificate_physicochemical').insert(physicPayload)
            }

            alert('Certificado salvo com sucesso!')
            loadData() // Reload to get proper IDs assigned

        } catch (error) {
            console.error('Error saving certificate:', error)
            alert('Erro ao salvar o certificado.')
        } finally {
            setIsSaving(false)
        }
    }

    // Handlers for Tables
    const addMicroorganism = () => setMicroorganisms([...microorganisms, { id: `temp_${Date.now()}`, name: '', exponentialValue: '' }])
    const updateMicroorganism = (id, field, value) => {
        let finalValue = value;
        if (field === 'exponentialValue') finalValue = formatSuperscript(value);
        setMicroorganisms(microorganisms.map(m => m.id === id ? { ...m, [field]: finalValue } : m))
    }
    const removeMicroorganism = (id) => setMicroorganisms(microorganisms.filter(m => m.id !== id))

    const updatePhysicochemical = (id, field, value) => {
        setPhysicochemicals(physicochemicals.map(p => p.id === id ? { ...p, [field]: value } : p))
    }
    const handleGeneratePDF = async () => {
        if (!pdfRef.current) return;

        try {
            setIsGeneratingPDF(true);
            const html2pdf = (await import('html2pdf.js/dist/html2pdf.min.js')).default;

            const element = pdfRef.current;
            const originalDisplay = element.style.display;
            element.style.display = 'block';

            const opt = {
                margin: 0,
                filename: `Certificado_${formData.certificateNumber.replace('/', '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            element.style.display = originalDisplay;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Não foi possível gerar o PDF do Certificado. Tente novamente.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando dados do Lote...</p></div>
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '3rem' }}>
            <div className="header-actions">
                <div>
                    <button onClick={() => router.push('/producao')} style={{ background: 'transparent', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Voltar para Produção
                    </button>
                    <h1 className="title-main">Emitir Certificado (CQ)</h1>
                    <p className="title-sub">Certifique a qualidade do Lote: <strong>{formData.batchNumber}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                        <FileDown size={18} /> {isGeneratingPDF ? 'Gerando...' : 'Visualizar / PDF'}
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Certificado'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 3fr)', gap: '2rem' }}>

                {/* Lado Esquerdo: Formularios Básicos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Cabeçalho do Certificado</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Nº do Laudo / Certificado</label>
                                <input type="text" value={formData.certificateNumber} onChange={e => setFormData({ ...formData, certificateNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Data de Emissão</label>
                                <input type="date" value={formData.emissionDate} onChange={e => setFormData({ ...formData, emissionDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Código do Produto</label>
                                <input type="text" placeholder="Ex: PR-A" value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Produto</label>
                                <input type="text" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Marca</label>
                                <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Lote de Produção</label>
                                <input type="text" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Volume do Lote</label>
                                <input type="text" placeholder="Ex: 30 litros" value={formData.batchVolume} onChange={e => setFormData({ ...formData, batchVolume: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Fabricação</label>
                                <input type="date" value={formData.manufactureDate} onChange={e => setFormData({ ...formData, manufactureDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Validade</label>
                                <input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Apresentação</label>
                                <input type="text" placeholder="Ex: bolsa de 5 litros" value={formData.presentation} onChange={e => setFormData({ ...formData, presentation: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Armazenamento</label>
                                <input type="text" placeholder="Ex: sob refrigeração" value={formData.storageConditions} onChange={e => setFormData({ ...formData, storageConditions: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Tabelas e Imagem */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Imagem (Placa de Petri) */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Foto de Análise (Placa Petri)</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedImageFile(e.target.files[0])
                                            setIsImageModalOpen(true)
                                        }
                                    }}
                                />
                                {formData.imageUrl && (
                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }} onClick={() => setFormData({ ...formData, imageUrl: '' })}>
                                        <Trash2 size={14} /> Remover
                                    </button>
                                )}
                                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => fileInputRef.current.click()}>
                                    <Camera size={14} /> Incluir / Alterar Foto
                                </button>
                            </div>
                        </div>

                        {formData.imageUrl ? (
                            <div style={{ width: '100%', height: '220px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', backgroundImage: `url(${formData.imageUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
                        ) : (
                            <div style={{ width: '100%', height: '220px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', flexDirection: 'column', gap: '0.5rem' }}>
                                <Camera size={32} />
                                <span style={{ fontSize: '0.9rem' }}>Nenhuma imagem selecionada</span>
                            </div>
                        )}
                    </div>

                    {/* Tabela de Microrganismos */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Tabela Microrganismo</h2>
                            <button onClick={addMicroorganism} style={{ background: 'transparent', border: 'none', color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, fontSize: '0.85rem' }}><PlusCircle size={16} /> Adicionar M.O.</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {microorganisms.map((item) => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" placeholder="Nome do Microrganismo (Ex: Priestia aryabhattai...)" value={item.name} onChange={e => updateMicroorganism(item.id, 'name', e.target.value)} style={{ flex: 2, padding: '0.6rem' }} />
                                    <input type="text" placeholder="Exponencial (Ex: 6,5x10⁷ UFC/mL)" value={item.exponentialValue} onChange={e => updateMicroorganism(item.id, 'exponentialValue', e.target.value)} style={{ flex: 1, padding: '0.6rem' }} />
                                    <button onClick={() => removeMicroorganism(item.id)} style={{ padding: '0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabela Fisico/Quimica */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Característica Físico/Química</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {physicochemicals.map((item) => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" value={item.characteristic} readOnly style={{ flex: 1, padding: '0.6rem', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed', border: '1px solid #e2e8f0', fontWeight: 500 }} title="Característica Fixa" />
                                    <input type="text" placeholder="Ex: âmbar médio, líquido..." value={item.resultValue || ''} onChange={e => updatePhysicochemical(item.id, 'resultValue', e.target.value)} style={{ flex: 2, padding: '0.6rem' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {isImageModalOpen && (
                <ImageEditorModal
                    isOpen={isImageModalOpen}
                    imageFile={selectedImageFile}
                    onClose={() => setIsImageModalOpen(false)}
                    onSave={(newFile) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(newFile);
                        reader.onloadend = () => {
                            setFormData({ ...formData, imageUrl: reader.result });
                            setIsImageModalOpen(false);
                        };
                    }}
                />
            )}

            {/* Template Escondido para PDF Generation */}
            <div style={{ display: 'none' }}>
                <CertificatePDFTemplate
                    ref={pdfRef}
                    cert={formData}
                    micros={microorganisms}
                    physics={physicochemicals}
                />
            </div>
        </div>
    )
}
