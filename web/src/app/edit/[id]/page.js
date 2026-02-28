'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PlusCircle, Trash2, ArrowLeft, Save, CheckCircle, Loader2, Upload, X } from 'lucide-react'
import ImageEditorModal from '@/components/ImageEditorModal'

// Util function to format powers like ^5 to ⁵
const formatSuperscript = (text) => {
    if (!text) return text;
    const map = {
        '^0': '⁰', '^1': '¹', '^2': '²', '^3': '³', '^4': '⁴',
        '^5': '⁵', '^6': '⁶', '^7': '⁷', '^8': '⁸', '^9': '⁹'
    };
    let formattedText = text;
    for (const [key, val] of Object.entries(map)) {
        // Use regex global replace
        formattedText = formattedText.split(key).join(val);
    }
    return formattedText;
};

export default function EditReport() {
    const router = useRouter()
    const { id } = useParams()

    const [header, setHeader] = useState({
        name: '',
        client_id: '',
        property: '',
        collected_by: '',
        issue_date: '',
        entry_date: '',
        requester: '',
        delivered_by: '',
        collection_date: '',
        city: '',
        state: '',
        observations: ''
    })

    const [clients, setClients] = useState([])
    const [selectedClientProperties, setSelectedClientProperties] = useState([])

    const [micros, setMicros] = useState([])
    const [images, setImages] = useState([])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchClients() {
            const { data } = await supabase.from('clients').select('id, name, city, state, properties').order('name')
            if (data) setClients(data)
            return data || []
        }

        async function fetchReportData(clientsData) {
            try {
                // Fetch report header
                const { data: reportData, error: reportError } = await supabase
                    .from('reports')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (reportError) throw reportError

                setHeader({
                    name: reportData.name || '',
                    client_id: reportData.client_id || '',
                    property: reportData.property || '',
                    collected_by: reportData.collected_by || '',
                    issue_date: reportData.issue_date || '',
                    entry_date: reportData.entry_date || '',
                    requester: reportData.requester || '',
                    delivered_by: reportData.delivered_by || '',
                    collection_date: reportData.collection_date || '',
                    city: reportData.city || '',
                    state: reportData.state || '',
                    observations: reportData.observations || ''
                })

                if (reportData.images) {
                    const normalized = reportData.images.map(img =>
                        typeof img === 'string' ? { url: img, description: '' } : img
                    )
                    setImages(normalized)
                }

                // Set selected client properties if a client is linked
                if (reportData.client_id && clientsData) {
                    const client = clientsData.find(c => c.id === reportData.client_id)
                    if (client) {
                        setSelectedClientProperties(client.properties || [])
                    }
                }

                // Fetch microorganisms
                const { data: microsData, error: microsError } = await supabase
                    .from('microorganisms')
                    .select('*')
                    .eq('report_id', id)

                if (microsError) throw microsError

                if (microsData && microsData.length > 0) {
                    const adaptedMicros = microsData.map(m => ({
                        ...m,
                        recovered: m.recovered && m.recovered.length > 0 ? m.recovered : (m.name ? [{ name: m.name, cfu_per_ml: m.cfu_per_ml || '' }] : [{ name: '', cfu_per_ml: '' }])
                    }))
                    setMicros(adaptedMicros)
                } else {
                    // Start with one empty if none exist
                    setMicros([{ code: '', name: '', ph: '', recovered: [{ name: '', cfu_per_ml: '' }], enterobacteria: '', mold_yeast: '', commercial_product: '', observations: '' }])
                }

            } catch (err) {
                setError('Erro ao carregar dados do laudo: ' + err.message)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchClients().then((clientsData) => {
                fetchReportData(clientsData)
            })
        }
    }, [id])

    const handleHeaderChange = (e) => {
        const { name, value } = e.target

        if (name === 'client_id') {
            const client = clients.find(c => c.id === value)
            if (client) {
                setHeader(prev => ({
                    ...prev,
                    client_id: value,
                    city: '', // Reset city, wait for property selection
                    state: '', // Reset state, wait for property selection
                    property: '' // Reset property when client changes
                }))
                setSelectedClientProperties(client.properties || [])
            } else {
                setHeader(prev => ({ ...prev, client_id: '' }))
                setSelectedClientProperties([])
            }
            return
        }

        if (name === 'property') {
            const selectedProp = selectedClientProperties.find(p => p.name === value || p === value)
            if (selectedProp && typeof selectedProp === 'object') {
                setHeader(prev => ({
                    ...prev,
                    property: value,
                    city: selectedProp.city || prev.city,
                    state: selectedProp.state || prev.state
                }))
            } else {
                setHeader(prev => ({ ...prev, property: value }))
            }
            return
        }

        setHeader(prev => ({ ...prev, [name]: value }))
    }

    const handleMicroChange = (index, field, value) => {
        const updated = [...micros]
        // Auto-format for specific fields that might use superscripts
        if (['enterobacteria', 'mold_yeast'].includes(field)) {
            updated[index][field] = formatSuperscript(value)
        } else {
            updated[index][field] = value
        }
        setMicros(updated)
    }

    const handleRecoveredChange = (microIndex, recIndex, field, value) => {
        const updated = [...micros]
        if (field === 'cfu_per_ml') {
            updated[microIndex].recovered[recIndex][field] = formatSuperscript(value)
        } else {
            updated[microIndex].recovered[recIndex][field] = value
        }
        setMicros(updated)
    }

    const addRecovered = (microIndex) => {
        const updated = [...micros]
        updated[microIndex].recovered.push({ name: '', cfu_per_ml: '' })
        setMicros(updated)
    }

    const removeRecovered = (microIndex, recIndex) => {
        const updated = [...micros]
        updated[microIndex].recovered.splice(recIndex, 1)
        setMicros(updated)
    }

    const addMicro = () => {
        setMicros([...micros, { code: '', name: '', ph: '', recovered: [{ name: '', cfu_per_ml: '' }], enterobacteria: '', mold_yeast: '', commercial_product: '', observations: '' }])
    }

    const removeMicro = (index) => {
        const updated = [...micros]
        updated.splice(index, 1)
        setMicros(updated)
    }

    const [uploadingImage, setUploadingImage] = useState(false)
    const [fileQueue, setFileQueue] = useState([])

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (!files || files.length === 0) return

        setFileQueue(files)
        e.target.value = null
    }

    const processEditedFile = async (editedFile) => {
        setUploadingImage(true)
        setError(null)

        try {
            const fileExt = editedFile.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('report_images')
                .upload(filePath, editedFile)

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage
                .from('report_images')
                .getPublicUrl(filePath)

            setImages(prev => [...prev, { url: publicUrlData.publicUrl, description: '' }])
        } catch (err) {
            console.error('Error uploading image: ', err)
            setError('Erro ao enviar imagem: ' + err.message)
        } finally {
            setUploadingImage(false)
            setFileQueue(prev => prev.slice(1))
        }
    }

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove))
    }

    const handleImageDescriptionChange = (index, value) => {
        const updated = [...images]
        updated[index].description = value
        setImages(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            // Sanitize header to remove empty date strings which will crash Postgres 'date' type
            const cleanHeader = { ...header }
            if (cleanHeader.collection_date === '') cleanHeader.collection_date = null
            if (cleanHeader.entry_date === '') cleanHeader.entry_date = null
            if (cleanHeader.issue_date === '') cleanHeader.issue_date = null

            // Sanitize client_id which will crash Postgres 'uuid' type if empty string
            if (cleanHeader.client_id === '') cleanHeader.client_id = null

            // 1. Update header
            const { error: reportError } = await supabase
                .from('reports')
                .update({ ...cleanHeader, images })
                .eq('id', id)

            if (reportError) throw reportError

            // 2. Delete existing microorganisms
            const { error: deleteError } = await supabase
                .from('microorganisms')
                .delete()
                .eq('report_id', id)

            if (deleteError) throw deleteError

            // 3. Insert new microorganisms linking to report_id
            const microsToInsert = micros.filter(m => m.name || m.ph || m.enterobacteria || m.mold_yeast || m.commercial_product || m.recovered.some(r => r.name || r.cfu_per_ml))
                .map(m => {
                    const micro = { ...m, report_id: id }
                    delete micro.id // Prevent ID collision in insert
                    delete micro.created_at
                    delete micro.cfu_per_ml
                    micro.recovered = m.recovered.filter(r => r.name || r.cfu_per_ml)
                    return micro
                })

            if (microsToInsert.length > 0) {
                const { error: microError } = await supabase
                    .from('microorganisms')
                    .insert(microsToInsert)

                if (microError) throw microError
            }

            setSuccess(true)
        } catch (err) {
            console.error("Supabase Error Details:", err.message || err)
            setError(`Erro ao salvar no banco de dados: ${err.message || JSON.stringify(err)}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '5rem' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>Carregando dados do laudo...</p>
            </div>
        )
    }

    if (success) {
        return (
            <div className="card success-box" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10vh' }}>
                <div className="success-icon">
                    <CheckCircle size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Laudo Editado com Sucesso!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    As alterações no laudo foram salvas corretamente no banco de dados.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => router.push(`/report/${id}`)}>
                        Visualizar Laudo Atualizado
                    </button>
                    <button className="btn btn-secondary" onClick={() => router.push('/laudos')}>
                        Voltar ao Início
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            <ImageEditorModal
                isOpen={fileQueue.length > 0}
                imageFile={fileQueue[0]}
                onClose={() => setFileQueue(prev => prev.slice(1))}
                onSave={processEditedFile}
            />

            <div className="header-actions">
                <div>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push(`/report/${id}`)} style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>
                <h1 className="title-main" style={{ textAlign: 'center', flex: 1 }}>Editar Laudo</h1>
                <div style={{ width: '92px' }}></div> {/* Spacer to keep title centered */}
            </div>

            {error && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Cliente e Localidade */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2>Dados do Cliente e Localidade</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1', background: '#f4f7fb', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
                            <label style={{ color: 'var(--primary-color)' }}>Cliente (Preenchimento Automático)</label>
                            <select
                                name="client_id"
                                value={header.client_id || ''}
                                onChange={handleHeaderChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccd0d5' }}
                            >
                                <option value="">-- Selecione um Cliente Cadastrado (Opcional) --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                                Selecione um cliente para listar as Fazendas e preencher a Cidade/Estado.
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Propriedade (Fazenda)</label>
                            {selectedClientProperties.length > 0 ? (
                                <select
                                    name="property"
                                    value={header.property || ''}
                                    onChange={handleHeaderChange}
                                    required
                                >
                                    <option value="">-- Selecione a Fazenda --</option>
                                    {selectedClientProperties.map((p, i) => {
                                        const propName = typeof p === 'string' ? p : p.name;
                                        return <option key={i} value={propName}>{propName}</option>
                                    })}
                                    <option value="OUTRA">Outra (Digitar manualmente)</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    name="property"
                                    value={header.property || ''}
                                    onChange={handleHeaderChange}
                                    placeholder="Ex: Fazenda Lt.12"
                                    required
                                />
                            )}
                            {header.property === 'OUTRA' && (
                                <input
                                    type="text"
                                    style={{ marginTop: '0.5rem' }}
                                    placeholder="Digite o nome da fazenda"
                                    onChange={(e) => handleHeaderChange({ target: { name: 'property', value: e.target.value } })}
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label>Solicitante</label>
                            <input
                                type="text"
                                name="requester"
                                value={header.requester || ''}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Franco"
                            />
                        </div>

                        <div className="form-group">
                            <label>Município</label>
                            <input
                                type="text"
                                name="city"
                                value={header.city || ''}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Paracatu"
                            />
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <input
                                type="text"
                                name="state"
                                value={header.state || ''}
                                onChange={handleHeaderChange}
                                placeholder="Ex: MG"
                            />
                        </div>
                    </div>
                </div>

                {/* Informações da Amostra */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2>Informações da Amostra e Laudo</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Número do Laudo / Identificação</label>
                            <input
                                type="text"
                                name="name"
                                value={header.name || ''}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Laudo 12345"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Emissão (Laudo)</label>
                            <input
                                type="date"
                                name="issue_date"
                                value={header.issue_date || ''}
                                onChange={handleHeaderChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Entrada no Laboratório</label>
                            <input
                                type="date"
                                name="entry_date"
                                value={header.entry_date || ''}
                                onChange={handleHeaderChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Quem Coletou</label>
                            <input
                                type="text"
                                name="collected_by"
                                value={header.collected_by || ''}
                                onChange={handleHeaderChange}
                                placeholder="Nome do responsável"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Coleta</label>
                            <input
                                type="date"
                                name="collection_date"
                                value={header.collection_date || ''}
                                onChange={handleHeaderChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Entregue por</label>
                            <input
                                type="text"
                                name="delivered_by"
                                value={header.delivered_by || ''}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Franco"
                            />
                        </div>
                    </div>
                </div>

                {/* Microorganismos */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: 0 }}>Análise Microbiológica</h2>
                        <button type="button" className="btn btn-secondary" onClick={addMicro} style={{ padding: '0.5rem 1rem' }}>
                            <PlusCircle size={16} /> Adicionar
                        </button>
                    </div>

                    <div className="micro-list">
                        {micros.map((micro, index) => (
                            <div key={index} className="micro-item" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Código</label>
                                    <input
                                        type="text"
                                        value={micro.code || ''}
                                        onChange={(e) => handleMicroChange(index, 'code', e.target.value)}
                                        placeholder="Ex: 001"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Nome do Microorganismo</label>
                                    <input
                                        type="text"
                                        value={micro.name || ''}
                                        onChange={(e) => handleMicroChange(index, 'name', e.target.value)}
                                        placeholder="Ex: B. amyloliquefaciens + B. velezensis"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>pH</label>
                                    <input
                                        type="text"
                                        value={micro.ph || ''}
                                        onChange={(e) => handleMicroChange(index, 'ph', e.target.value)}
                                        placeholder="Ex: 7.2"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Produto Comercial</label>
                                    <input
                                        type="text"
                                        value={micro.commercial_product || ''}
                                        onChange={(e) => handleMicroChange(index, 'commercial_product', e.target.value)}
                                        placeholder="Ex: Inovar"
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                                    <label>Observações da amostra (Opcional)</label>
                                    <textarea
                                        value={micro.observations || ''}
                                        onChange={(e) => handleMicroChange(index, 'observations', e.target.value)}
                                        placeholder="Ex: Crescimento atípico observado..."
                                        style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccd0d5', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1', background: 'rgba(52, 199, 89, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--success-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: 'var(--success-color)', fontSize: '0.95rem', fontWeight: 600 }}>Microrganismos Recuperados</h4>
                                        <button type="button" className="btn btn-secondary" onClick={() => addRecovered(index)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', height: 'auto' }}>
                                            <PlusCircle size={14} /> Adicionar
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {micro.recovered.map((rec, rIdx) => (
                                            <div key={rIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                                                    <label style={{ fontSize: '0.8rem' }}>Microrganismo</label>
                                                    <input
                                                        type="text"
                                                        value={rec.name || ''}
                                                        onChange={(e) => handleRecoveredChange(index, rIdx, 'name', e.target.value)}
                                                        placeholder="Ex: B. amyloliquefaciens"
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem' }}>UFC/mL <span style={{ color: '#888', fontWeight: 400 }}>(Ex: ^4 para ⁴)</span></label>
                                                    <input
                                                        type="text"
                                                        value={rec.cfu_per_ml || ''}
                                                        onChange={(e) => handleRecoveredChange(index, rIdx, 'cfu_per_ml', e.target.value)}
                                                        placeholder="Ex: < 1x10⁵"
                                                    />
                                                </div>
                                                {micro.recovered.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => removeRecovered(index, rIdx)}
                                                        style={{ padding: '0.5rem', color: '#c62828', height: '42px', border: 'none', background: 'transparent' }}
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1', background: 'rgba(0, 86, 179, 0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: 600 }}>Indicadores</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Enterobactérias <span style={{ color: '#888', fontWeight: 400, fontSize: '0.8rem' }}>(Ex: ^4 para ⁴)</span></label>
                                            <input
                                                type="text"
                                                value={micro.enterobacteria || ''}
                                                onChange={(e) => handleMicroChange(index, 'enterobacteria', e.target.value)}
                                                placeholder="Ex: < 10 UFC/g"
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Bolor/Levedura <span style={{ color: '#888', fontWeight: 400, fontSize: '0.8rem' }}>(Ex: ^4 para ⁴)</span></label>
                                            <input
                                                type="text"
                                                value={micro.mold_yeast || ''}
                                                onChange={(e) => handleMicroChange(index, 'mold_yeast', e.target.value)}
                                                placeholder="Ex: 1x10⁴ UFC/g"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {micros.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => removeMicro(index)}
                                        style={{ padding: '0.75rem', background: '#ffebee', color: '#c62828', height: '42px', justifySelf: 'start', alignSelf: 'end' }}
                                    >
                                        <Trash2 size={16} /> Remover
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Considerações do Laudo */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: 0 }}>Considerações do Laudo</h2>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Considerações Adicionais (Opcional)</label>
                        <textarea
                            name="observations"
                            value={header.observations || ''}
                            onChange={handleHeaderChange}
                            placeholder="Adicione qualquer consideração complementar pertinente ao laudo inteiro..."
                            style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid #ccd0d5', resize: 'vertical', fontSize: '1rem' }}
                        />
                    </div>
                </div>

                {/* Anexos Fotográficos */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: 0 }}>Anexos Fotográficos (Fotos de Placas, Produtos ou Ensaios)</h2>
                    </div>

                    <div style={{ padding: '2.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '1.5rem', position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
                            {uploadingImage ? (
                                <>
                                    <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Enviando imagem de forma segura...</p>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                        <Upload size={32} style={{ color: 'var(--primary-color)' }} />
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#1a1a1a', fontSize: '1.15rem' }}>Clique ou arraste imagens para anexar ao laudo</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Formatos suportados: PNG, JPG, JPEG.</p>
                                </>
                            )}
                        </div>
                    </div>

                    {images.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem', alignItems: 'start' }}>
                            {images.map((imgObj, idx) => (
                                <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                                        <img src={imgObj.url} alt={`Anexo ${idx + 1}`} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                                    </div>
                                    <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                                        <input
                                            type="text"
                                            placeholder="Adicionar descrição ou observação... (opcional)"
                                            value={imgObj.description || ''}
                                            onChange={(e) => handleImageDescriptionChange(idx, e.target.value)}
                                            style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', border: '1px solid #ccd0d5', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 20 }}
                                        title="Remover anexo"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.875rem 2.5rem', fontSize: '1rem', borderRadius: '8px' }}>
                        {saving ? 'Salvando...' : (
                            <>
                                <Save size={20} /> Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
