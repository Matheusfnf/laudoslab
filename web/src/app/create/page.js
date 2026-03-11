'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PlusCircle, Trash2, ArrowLeft, Save, CheckCircle, UploadCloud, Sparkles, Loader2, Image as ImageIcon, X, Microscope, Sprout, ShieldAlert, Network, Layers } from 'lucide-react'
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

export default function CreateReport() {
    const router = useRouter()

    const [header, setHeader] = useState({
        name: '',
        client_id: '',
        property: '',
        collected_by: '',
        issue_date: new Date().toISOString().split('T')[0],
        entry_date: new Date().toISOString().split('T')[0],
        requester: '',
        delivered_by: '',
        collection_date: '',
        city: '',
        state: '',
        observations: '',
        observations: '',
        report_type: 'micro', // 'micro', 'sementes', 'solos', 'raizes'
        analytical_matrix: '' // ex: semente de feijão, amostra de solo
    })

    const [createdReportId, setCreatedReportId] = useState(null)

    const [clients, setClients] = useState([])
    const [selectedClientProperties, setSelectedClientProperties] = useState([])

    // Seed Report state — array of samples
    const newSeedSample = () => ({
        identification: '',
        analytical_technique: 'Plaqueamento de 200 sementes em meio sólido PDA e NEON',
        pathogenic: [{ genus: '', percent: '' }],
        deteriorating: [{ genus: '', percent: '' }],
        contaminating: [{ genus: '', percent: '' }]
    })

    const [seedResults, setSeedResults] = useState({ samples: [newSeedSample()] })

    const addSeedSample = () => setSeedResults(prev => ({ samples: [...prev.samples, newSeedSample()] }))

    const removeSeedSample = (sIndex) => setSeedResults(prev => {
        const arr = [...prev.samples]; arr.splice(sIndex, 1); return { samples: arr }
    })

    const addSeedRow = (sIndex, category) => setSeedResults(prev => {
        const samples = [...prev.samples]
        const catArray = [...samples[sIndex][category]]
        catArray.push({ genus: '', percent: '' })
        samples[sIndex] = { ...samples[sIndex], [category]: catArray }
        return { samples }
    })

    const removeSeedRow = (sIndex, category, rowIndex) => setSeedResults(prev => {
        const samples = [...prev.samples]
        const arr = [...samples[sIndex][category]]; arr.splice(rowIndex, 1)
        samples[sIndex] = { ...samples[sIndex], [category]: arr }
        return { samples }
    })

    const updateSeedField = (sIndex, field, value) => setSeedResults(prev => {
        const samples = [...prev.samples]; samples[sIndex] = { ...samples[sIndex], [field]: value }; return { samples }
    })

    const updateSeedRow = (sIndex, category, rowIndex, key, value) => setSeedResults(prev => {
        const samples = [...prev.samples]
        const arr = [...samples[sIndex][category]]
        arr[rowIndex] = { ...arr[rowIndex], [key]: value }
        samples[sIndex] = { ...samples[sIndex], [category]: arr }
        return { samples }
    })

    // Soil Report state
    const [soilResults, setSoilResults] = useState({
        samples: [
            {
                code: '',
                identification: '',
                microorganisms: [
                    { genus: 'Contagem total de fungos', count: '' },
                    { genus: 'Trichoderma', count: '' },
                    { genus: 'Demais fungos patogênicos', count: 'ND' }
                ]
            }
        ]
    })

    const addSoilSample = () => {
        setSoilResults(prev => ({
            ...prev,
            samples: [
                ...prev.samples,
                {
                    code: '',
                    identification: '',
                    microorganisms: [
                        { genus: 'Contagem total de fungos', count: '' },
                        { genus: 'Trichoderma', count: '' },
                        { genus: 'Demais fungos patogênicos', count: 'ND' }
                    ]
                }
            ]
        }))
    }

    const removeSoilSample = (index) => {
        setSoilResults(prev => {
            const newArr = [...prev.samples]
            newArr.splice(index, 1)
            return { ...prev, samples: newArr }
        })
    }

    const addSoilMicroorganism = (sampleIndex) => {
        setSoilResults(prev => {
            const newSamples = [...prev.samples]
            const newMicros = [...newSamples[sampleIndex].microorganisms]
            newMicros.push({ genus: '', count: '' })
            newSamples[sampleIndex] = { ...newSamples[sampleIndex], microorganisms: newMicros }
            return { ...prev, samples: newSamples }
        })
    }

    const removeSoilMicroorganism = (sampleIndex, microIndex) => {
        setSoilResults(prev => {
            const newSamples = [...prev.samples]
            newSamples[sampleIndex].microorganisms.splice(microIndex, 1)
            return { ...prev, samples: newSamples }
        })
    }

    // Raizes Report state
    const [rootResults, setRootResults] = useState({
        samples: [
            {
                code: '',
                identification: '',
                microorganisms: [
                    { genus: '' }
                ]
            }
        ]
    })

    const addRootSample = () => {
        setRootResults(prev => ({
            ...prev,
            samples: [
                ...prev.samples,
                {
                    code: '',
                    identification: '',
                    microorganisms: [
                        { genus: '' }
                    ]
                }
            ]
        }))
    }

    const removeRootSample = (index) => {
        setRootResults(prev => {
            const newArr = [...prev.samples]
            newArr.splice(index, 1)
            return { ...prev, samples: newArr }
        })
    }

    const addRootMicroorganism = (sampleIndex) => {
        setRootResults(prev => {
            const newSamples = [...prev.samples]
            const newMicros = [...newSamples[sampleIndex].microorganisms]
            newMicros.push({ genus: '' })
            newSamples[sampleIndex] = { ...newSamples[sampleIndex], microorganisms: newMicros }
            return { ...prev, samples: newSamples }
        })
    }

    const removeRootMicroorganism = (sampleIndex, microIndex) => {
        setRootResults(prev => {
            const newSamples = [...prev.samples]
            newSamples[sampleIndex].microorganisms.splice(microIndex, 1)
            return { ...prev, samples: newSamples }
        })
    }

    useEffect(() => {
        async function fetchClients() {
            const { data } = await supabase.from('clients').select('id, name, city, state, properties').order('name')
            if (data) setClients(data)
        }
        fetchClients()
    }, [])

    // Microorganisms state
    const [micros, setMicros] = useState([
        { code: '', name: '', ph: '', recovered: [{ name: '', cfu_per_ml: '' }], enterobacteria: '', mold_yeast: '', commercial_product: '', observations: '' }
    ])

    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [images, setImages] = useState([])
    const [uploadingImage, setUploadingImage] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const [fileQueue, setFileQueue] = useState([])

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // 1. Activate loading IMMEDIATELY after file selection
        setAiLoading(true)
        setError(null)

        try {
            // Convert file to Base64
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64String = reader.result.split(',')[1]

                // Send to our API route
                const res = await fetch('/api/parse-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64String,
                        mimeType: file.type
                    })
                })

                if (!res.ok) throw new Error('Falha ao interpretar a imagem')

                const data = await res.json()

                if (data.header) {
                    setHeader(prev => ({ ...prev, ...data.header }))
                }

                if (data.micros && data.micros.length > 0) {
                    const adaptedMicros = data.micros.map(m => ({
                        ...m,
                        recovered: m.recovered || (m.name ? [{ name: m.name, cfu_per_ml: m.cfu_per_ml || '' }] : [{ name: '', cfu_per_ml: '' }])
                    }))
                    setMicros(adaptedMicros)
                }

                setAiLoading(false) // Disable loading overlay on success

                alert('✅ Laudo Importado com Sucesso! Por favor, revise os dados antes de salvar.')
            }

            reader.onerror = () => {
                setError('Falha ao ler o arquivo localmente.')
                setAiLoading(false)
            }
        } catch (err) {
            console.error(err)
            setError('Falha ao usar a Inteligência Artificial. Verifique o console ou tente outra imagem.')
            setAiLoading(false)
        }
    }

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

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return
        setFileQueue(files)
        e.target.value = null
    }

    const processEditedFile = async (editedFile) => {
        setUploadingImage(true)
        setError(null)

        try {
            const fileExt = editedFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
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
            console.error(err)
            setError('Erro ao enviar imagem. Verifique o tamanho ou formato.')
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Sanitize header to remove empty date strings which will crash Postgres 'date' type
            const cleanHeader = { ...header }
            if (cleanHeader.collection_date === '') cleanHeader.collection_date = null
            if (cleanHeader.entry_date === '') cleanHeader.entry_date = null
            if (cleanHeader.issue_date === '') cleanHeader.issue_date = null

            // 1. Insert header and potentially JSON results
            let matrixResults = null
            if (cleanHeader.report_type === 'sementes') matrixResults = seedResults
            else if (cleanHeader.report_type === 'solos') matrixResults = soilResults
            else if (cleanHeader.report_type === 'raizes') matrixResults = rootResults

            const payload = {
                ...cleanHeader,
                images,
                matrix_results: matrixResults
            }

            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .insert([payload])
                .select()
                .single()

            if (reportError) throw reportError

            const reportId = reportData.id

            // 2. Insert microorganisms linking to report_id (ONLY IF IT IS 'micro')
            if (cleanHeader.report_type === 'micro') {
                const microsToInsert = micros.filter(m => m.name || m.ph || m.enterobacteria || m.mold_yeast || m.commercial_product || m.recovered.some(r => r.name || r.cfu_per_ml))
                    .map(m => {
                        const microToSave = { ...m, report_id: reportId }
                        delete microToSave.cfu_per_ml // Clean up old field if present
                        microToSave.recovered = m.recovered.filter(r => r.name || r.cfu_per_ml)
                        return microToSave
                    })

                if (microsToInsert.length > 0) {
                    const { error: microError } = await supabase
                        .from('microorganisms')
                        .insert(microsToInsert)

                    if (microError) throw microError
                }
            }

            setCreatedReportId(reportId)
            setSuccess(true)
        } catch (err) {
            console.error("Supabase Error Details:", err.message || err)
            setError(`Erro ao salvar no banco de dados: ${err.message || JSON.stringify(err)}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="card success-box" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10vh' }}>
                <div className="success-icon">
                    <CheckCircle size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Laudo Criado com Sucesso!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    O laudo microbiológico foi salvo corretamente no banco de dados.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => {
                        setSuccess(false)
                        setCreatedReportId(null)
                        setHeader({ name: '', client_id: '', property: '', collected_by: '', issue_date: new Date().toISOString().split('T')[0], entry_date: new Date().toISOString().split('T')[0], requester: '', delivered_by: '', collection_date: '', city: '', state: '' })
                        setMicros([{ code: '', name: '', ph: '', recovered: [{ name: '', cfu_per_ml: '' }], enterobacteria: '', mold_yeast: '', commercial_product: '' }])
                        setSelectedClientProperties([])
                        setImages([])
                    }}>
                        Criar Novo Laudo
                    </button>
                    {createdReportId && (
                        <button
                            className="btn btn-primary"
                            onClick={() => window.open(`/report/${createdReportId}/label`, '_blank')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff' }}
                            title="Imprimir etiquetas 6x4 com QR Code"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Imprimir Etiqueta
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => router.push('/laudos')}>
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

            {/* AI Loading Overlay */}
            {aiLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-color)'
                }}>
                    <Loader2 size={64} className="animate-spin" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
                        Importando seu laudo como um passe de mágica... ✨
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Por favor, aguarde alguns segundos.
                    </p>
                </div>
            )}

            <div className="header-actions">
                <Link href="/laudos" passHref>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </Link>
                <h1 className="title-main" style={{ textAlign: 'center', flex: 1 }}>Novo Laudo</h1>
                <div style={{ width: '92px' }}></div> {/* Spacer to keep title centered */}
            </div>

            {error && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* AI Upload Section */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240, 248, 255, 0.9))', border: '1px solid #82c2f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                            <Sparkles size={22} />
                            Preenchimento Mágico com IA
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px' }}>
                            Faça upload do laudo inteiro (PDF, JPG, PNG). Nossa IA vai ler o documento na velocidade da luz e preencher todos os campos abaixo automaticamente para você!
                        </p>
                    </div>

                    <div>
                        <input
                            type="file"
                            id="ai-upload"
                            accept="image/*, application/pdf"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                            disabled={aiLoading}
                        />
                        <label
                            htmlFor="ai-upload"
                            className="btn btn-primary"
                            style={{ padding: '0.85rem 1.5rem', cursor: aiLoading ? 'not-allowed' : 'pointer', background: aiLoading ? '#82c2f9' : 'var(--primary-color)' }}
                        >
                            {aiLoading ? (
                                <><Loader2 size={20} className="animate-spin" /> Analisando Imagem...</>
                            ) : (
                                <><UploadCloud size={20} /> Importar Arquivo</>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Tipo de Laudo */}
                <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--primary-color)' }}>
                    <h2>Tipo de Laudo</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                        {[
                            { id: 'micro', label: 'Microbiológica', icon: <Microscope size={20} /> },
                            { id: 'sementes', label: 'Sementes', icon: <Sprout size={20} /> },
                            { id: 'solos', label: 'Solo', icon: <Layers size={20} /> },
                            { id: 'raizes', label: 'Raízes', icon: <Network size={20} /> }
                        ].map((type) => (
                            <label
                                key={type.id}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.75rem', border: `1.5px solid ${header.report_type === type.id ? 'var(--primary-color)' : '#e2e8f0'}`,
                                    borderRadius: '10px', cursor: 'pointer',
                                    background: header.report_type === type.id ? '#eff6ff' : '#fff',
                                    color: header.report_type === type.id ? 'var(--primary-color)' : 'var(--text-main)',
                                    transition: 'all 0.2s', textAlign: 'center', fontWeight: header.report_type === type.id ? 700 : 500
                                }}
                            >
                                <input
                                    type="radio"
                                    name="report_type"
                                    value={type.id}
                                    checked={header.report_type === type.id}
                                    onChange={handleHeaderChange}
                                    style={{ display: 'none' }}
                                />
                                {type.icon}
                                <span style={{ fontSize: '0.85rem' }}>{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Cliente e Localidade */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2>Dados do Cliente e Localidade</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1', background: '#f4f7fb', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
                            <label style={{ color: 'var(--primary-color)' }}>Cliente (Preenchimento Automático)</label>
                            <select
                                name="client_id"
                                value={header.client_id}
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
                                    value={header.property}
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
                                    value={header.property}
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
                                value={header.requester}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Franco"
                            />
                        </div>

                        <div className="form-group">
                            <label>Município</label>
                            <input
                                type="text"
                                name="city"
                                value={header.city}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Paracatu"
                            />
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <input
                                type="text"
                                name="state"
                                value={header.state}
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
                                value={header.name}
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
                                value={header.issue_date}
                                onChange={handleHeaderChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Entrada no Laboratório</label>
                            <input
                                type="date"
                                name="entry_date"
                                value={header.entry_date}
                                onChange={handleHeaderChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Quem Coletou</label>
                            <input
                                type="text"
                                name="collected_by"
                                value={header.collected_by}
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
                                value={header.collection_date}
                                onChange={handleHeaderChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Entregue por</label>
                            <input
                                type="text"
                                name="delivered_by"
                                value={header.delivered_by}
                                onChange={handleHeaderChange}
                                placeholder="Ex: Franco"
                            />
                        </div>
                        {header.report_type === 'sementes' && (
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Matriz Analítica</label>
                                <input
                                    type="text"
                                    name="analytical_matrix"
                                    value={header.analytical_matrix}
                                    onChange={handleHeaderChange}
                                    placeholder="Ex: Semente de Feijão, Semente de Soja..."
                                    required={header.report_type === 'sementes'}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabela de Resultados ou Microorganismos */}
                {header.report_type === 'micro' ? (
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
                                            value={micro.code}
                                            onChange={(e) => handleMicroChange(index, 'code', e.target.value)}
                                            placeholder="Ex: 001"
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Nome do Microorganismo</label>
                                        <input
                                            type="text"
                                            value={micro.name}
                                            onChange={(e) => handleMicroChange(index, 'name', e.target.value)}
                                            placeholder="Ex: B. amyloliquefaciens + B. velezensis"
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>pH</label>
                                        <input
                                            type="text"
                                            value={micro.ph}
                                            onChange={(e) => handleMicroChange(index, 'ph', e.target.value)}
                                            placeholder="Ex: 7.2"
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Produto Comercial</label>
                                        <input
                                            type="text"
                                            value={micro.commercial_product}
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
                                                            value={rec.name}
                                                            onChange={(e) => handleRecoveredChange(index, rIdx, 'name', e.target.value)}
                                                            placeholder="Ex: B. amyloliquefaciens"
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                                        <label style={{ fontSize: '0.8rem' }}>UFC/mL <span style={{ color: '#888', fontWeight: 400 }}>(Ex: ^4 para ⁴)</span></label>
                                                        <input
                                                            type="text"
                                                            value={rec.cfu_per_ml}
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
                                                    value={micro.enterobacteria}
                                                    onChange={(e) => handleMicroChange(index, 'enterobacteria', e.target.value)}
                                                    placeholder="Ex: < 10 UFC/g"
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Bolor/Levedura <span style={{ color: '#888', fontWeight: 400, fontSize: '0.8rem' }}>(Ex: ^4 para ⁴)</span></label>
                                                <input
                                                    type="text"
                                                    value={micro.mold_yeast}
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
                ) : header.report_type === 'sementes' ? (
                    <>
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ marginBottom: 0 }}>Resultados para Pesquisa e Quantificação de Fungos</h2>
                                <button type="button" className="btn btn-primary" onClick={addSeedSample} style={{ padding: '0.5rem 1rem' }}>
                                    <PlusCircle size={18} /> Nova Amostra
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {seedResults.samples.map((sample, sIndex) => (
                                    <div key={sIndex} style={{ border: '1px solid #dcfce7', borderRadius: '12px', overflow: 'hidden' }}>
                                        {/* Sample header */}
                                        <div style={{ background: '#f0fdf4', padding: '1.25rem 1.5rem', borderBottom: '1px solid #dcfce7', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: '1rem', alignItems: 'flex-end' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Identificação do Lote</label>
                                                <input
                                                    type="text"
                                                    value={sample.identification}
                                                    onChange={(e) => updateSeedField(sIndex, 'identification', e.target.value)}
                                                    placeholder="Ex: Feijão Lote: JMO1/C/16/25"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Técnica Analítica</label>
                                                <input
                                                    type="text"
                                                    value={sample.analytical_technique}
                                                    onChange={(e) => updateSeedField(sIndex, 'analytical_technique', e.target.value)}
                                                    placeholder="Ex: Plaqueamento de 200 sementes..."
                                                />
                                            </div>
                                            {seedResults.samples.length > 1 && (
                                                <button type="button" onClick={() => removeSeedSample(sIndex)}
                                                    style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '8px', padding: '0.6rem 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', height: '42px' }}>
                                                    <Trash2 size={15} /> Remover
                                                </button>
                                            )}
                                        </div>

                                        {/* Categories */}
                                        <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem' }}>
                                            {/* Patogênicos */}
                                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #16a34a', display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ color: '#15803d', marginBottom: '1rem', fontSize: '0.9rem' }}>Gêneros Patogênicos</h4>
                                                {sample.pathogenic.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                        <input type="text" value={item.genus} onChange={(e) => updateSeedRow(sIndex, 'pathogenic', idx, 'genus', e.target.value)} style={{ flex: 2, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="Gênero" />
                                                        <input type="text" value={item.percent} onChange={(e) => updateSeedRow(sIndex, 'pathogenic', idx, 'percent', formatSuperscript(e.target.value))} style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="%" />
                                                        {sample.pathogenic.length > 1 && (
                                                            <button type="button" onClick={() => removeSeedRow(sIndex, 'pathogenic', idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addSeedRow(sIndex, 'pathogenic')} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                                                    <PlusCircle size={15} /> Adicionar Linha
                                                </button>
                                            </div>

                                            {/* Deteriorantes */}
                                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #4ade80', display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ color: '#15803d', marginBottom: '1rem', fontSize: '0.9rem' }}>Deteriorante/Armazenamento</h4>
                                                {sample.deteriorating.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                        <input type="text" value={item.genus} onChange={(e) => updateSeedRow(sIndex, 'deteriorating', idx, 'genus', e.target.value)} style={{ flex: 2, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="Gênero" />
                                                        <input type="text" value={item.percent} onChange={(e) => updateSeedRow(sIndex, 'deteriorating', idx, 'percent', formatSuperscript(e.target.value))} style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="%" />
                                                        {sample.deteriorating.length > 1 && (
                                                            <button type="button" onClick={() => removeSeedRow(sIndex, 'deteriorating', idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addSeedRow(sIndex, 'deteriorating')} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                                                    <PlusCircle size={15} /> Adicionar Linha
                                                </button>
                                            </div>

                                            {/* Contaminantes */}
                                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #86efac', display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ color: '#15803d', marginBottom: '1rem', fontSize: '0.9rem' }}>Contaminante</h4>
                                                {sample.contaminating.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                        <input type="text" value={item.genus} onChange={(e) => updateSeedRow(sIndex, 'contaminating', idx, 'genus', e.target.value)} style={{ flex: 2, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="Gênero" />
                                                        <input type="text" value={item.percent} onChange={(e) => updateSeedRow(sIndex, 'contaminating', idx, 'percent', formatSuperscript(e.target.value))} style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }} placeholder="%" />
                                                        {sample.contaminating.length > 1 && (
                                                            <button type="button" onClick={() => removeSeedRow(sIndex, 'contaminating', idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addSeedRow(sIndex, 'contaminating')} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                                                    <PlusCircle size={15} /> Adicionar Linha
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : header.report_type === 'solos' ? (
                    <>
                        {/* Solos */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ marginBottom: 0 }}>Resultados para Pesquisa e Quantificação de Fungos em Solo</h2>
                                <button type="button" className="btn btn-primary" onClick={addSoilSample} style={{ padding: '0.5rem 1rem' }}>
                                    <PlusCircle size={18} /> Adicionar Nova Amostra
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {soilResults.samples.map((sample, sIndex) => (
                                    <div key={sIndex} style={{ border: '1px solid #e0e7ff', borderRadius: '8px', overflow: 'hidden' }}>
                                        {/* Sample Header Info */}
                                        <div style={{ background: '#f8fafc', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr) auto', gap: '1rem', alignItems: 'flex-start', borderBottom: '1px solid #e0e7ff' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Código (Cód.)</label>
                                                <input
                                                    type="text"
                                                    value={sample.code}
                                                    onChange={(e) => {
                                                        setSoilResults(prev => {
                                                            const newArr = [...prev.samples];
                                                            newArr[sIndex] = { ...newArr[sIndex], code: e.target.value };
                                                            return { ...prev, samples: newArr };
                                                        });
                                                    }}
                                                    placeholder="Ex: 2646"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Identificação</label>
                                                <textarea
                                                    value={sample.identification}
                                                    onChange={(e) => {
                                                        setSoilResults(prev => {
                                                            const newArr = [...prev.samples];
                                                            newArr[sIndex] = { ...newArr[sIndex], identification: e.target.value };
                                                            return { ...prev, samples: newArr };
                                                        });
                                                    }}
                                                    placeholder="Ex: Solo amostra 01&#10;Ponto 1-Margarida 2016&#10;Cultura: Abacate"
                                                    style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccd0d5', resize: 'vertical' }}
                                                />
                                            </div>
                                            {soilResults.samples.length > 1 && (
                                                <button type="button" onClick={() => removeSoilSample(sIndex)} style={{ background: '#ffebee', border: 'none', color: '#c62828', cursor: 'pointer', padding: '0.6rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                                    <Trash2 size={16} /> Remover Amostra
                                                </button>
                                            )}
                                        </div>

                                        {/* Microorganisms List for this Sample */}
                                        <div style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                                                <strong style={{ color: 'var(--text-color)' }}>Gênero (Qualquer texto)</strong>
                                                <strong style={{ color: 'var(--text-color)' }}>Resultado UFC/g de solo</strong>
                                                <div style={{ width: '38px' }}></div>
                                            </div>
                                            {sample.microorganisms.map((micro, mIndex) => (
                                                <div key={mIndex} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={micro.genus}
                                                        onChange={(e) => {
                                                            setSoilResults(prev => {
                                                                const newSamples = [...prev.samples];
                                                                const newMicros = [...newSamples[sIndex].microorganisms];
                                                                newMicros[mIndex] = { ...newMicros[mIndex], genus: e.target.value };
                                                                newSamples[sIndex] = { ...newSamples[sIndex], microorganisms: newMicros };
                                                                return { ...prev, samples: newSamples };
                                                            });
                                                        }}
                                                        placeholder="Ex: Trichoderma ou Demais fungos"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={micro.count}
                                                        onChange={(e) => {
                                                            const val = formatSuperscript(e.target.value);
                                                            setSoilResults(prev => {
                                                                const newSamples = [...prev.samples];
                                                                const newMicros = [...newSamples[sIndex].microorganisms];
                                                                newMicros[mIndex] = { ...newMicros[mIndex], count: val };
                                                                newSamples[sIndex] = { ...newSamples[sIndex], microorganisms: newMicros };
                                                                return { ...prev, samples: newSamples };
                                                            });
                                                        }}
                                                        placeholder="Ex: 5x10^2"
                                                    />
                                                    {sample.microorganisms.length > 1 ? (
                                                        <button type="button" onClick={() => removeSoilMicroorganism(sIndex, mIndex)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.4rem' }}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    ) : <div style={{ width: '38px' }}></div>}
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addSoilMicroorganism(sIndex)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                <PlusCircle size={18} /> Adicionar Microrganismo
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : header.report_type === 'raizes' ? (
                    <>
                        {/* Raizes */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ marginBottom: 0 }}>Resultados para Pesquisa de Fungos em Raízes</h2>
                                <button type="button" className="btn btn-primary" onClick={addRootSample} style={{ padding: '0.5rem 1rem' }}>
                                    <PlusCircle size={18} /> Adicionar Nova Amostra
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {rootResults.samples.map((sample, sIndex) => (
                                    <div key={sIndex} style={{ border: '1px solid #cffafe', borderRadius: '8px', overflow: 'hidden' }}>
                                        {/* Sample Header Info */}
                                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr) auto', gap: '1rem', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ color: '#0891b2' }}>Código (Cód.)</label>
                                                <input
                                                    type="text"
                                                    value={sample.code}
                                                    onChange={(e) => {
                                                        setRootResults(prev => {
                                                            const newArr = [...prev.samples];
                                                            newArr[sIndex] = { ...newArr[sIndex], code: e.target.value };
                                                            return { ...prev, samples: newArr };
                                                        });
                                                    }}
                                                    placeholder="Ex: 2687"
                                                    style={{ borderColor: '#a5f3fc' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ color: '#0891b2' }}>Identificação</label>
                                                <textarea
                                                    value={sample.identification}
                                                    onChange={(e) => {
                                                        setRootResults(prev => {
                                                            const newArr = [...prev.samples];
                                                            newArr[sIndex] = { ...newArr[sIndex], identification: e.target.value };
                                                            return { ...prev, samples: newArr };
                                                        });
                                                    }}
                                                    placeholder="Ex: Amostra de raiz de soja inoculada em ágar"
                                                    style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #a5f3fc', resize: 'vertical' }}
                                                />
                                            </div>
                                            {rootResults.samples.length > 1 && (
                                                <button type="button" onClick={() => removeRootSample(sIndex)} style={{ background: '#ffebee', border: 'none', color: '#c62828', cursor: 'pointer', padding: '0.6rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                                    <Trash2 size={16} /> Remover Amostra
                                                </button>
                                            )}
                                        </div>

                                        {/* Microorganisms List for this Sample (Root - No UFC) */}
                                        <div style={{ padding: '1.5rem', background: '#fff' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                                                <strong style={{ color: '#0891b2' }}>Gênero Encontrado</strong>
                                                <div style={{ width: '38px' }}></div>
                                            </div>
                                            {sample.microorganisms.map((micro, mIndex) => (
                                                <div key={mIndex} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={micro.genus}
                                                        onChange={(e) => {
                                                            setRootResults(prev => {
                                                                const newSamples = [...prev.samples];
                                                                const newMicros = [...newSamples[sIndex].microorganisms];
                                                                newMicros[mIndex] = { ...newMicros[mIndex], genus: e.target.value };
                                                                newSamples[sIndex] = { ...newSamples[sIndex], microorganisms: newMicros };
                                                                return { ...prev, samples: newSamples };
                                                            });
                                                        }}
                                                        placeholder="Ex: Fusarium"
                                                    />
                                                    <button type="button" onClick={() => removeRootMicroorganism(sIndex, mIndex)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.4rem' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addRootMicroorganism(sIndex)} style={{ background: 'none', border: 'none', color: '#0891b2', cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                <PlusCircle size={18} /> Adicionar Gênero
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null
                }

                {/* Considerações do Laudo */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: 0 }}>Considerações do Laudo</h2>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Considerações Adicionais (Opcional)</label>
                        <textarea
                            name="observations"
                            value={header.observations}
                            onChange={handleHeaderChange}
                            placeholder="Adicione qualquer consideração complementar pertinente ao laudo inteiro..."
                            style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid #ccd0d5', resize: 'vertical', fontSize: '1rem' }}
                        />
                    </div>
                </div>

                {/* Anexos Fotográficos */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ImageIcon size={20} color="var(--primary-color)" /> Anexos Fotográficos
                        </h2>
                        <div>
                            <input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handlePhotoUpload}
                                disabled={uploadingImage}
                            />
                            <label
                                htmlFor="photo-upload"
                                className="btn btn-secondary"
                                style={{
                                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                    padding: '0.5rem 1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    margin: 0
                                }}
                            >
                                {uploadingImage ? (
                                    <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                                ) : (
                                    <><UploadCloud size={16} /> Adicionar Fotos</>
                                )}
                            </label>
                        </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        As imagens adicionadas aparecerão no final do PDF. Você pode adicionar descrições observações personalizadas para cada foto.
                    </p>

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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.875rem 2.5rem', fontSize: '1rem', borderRadius: '8px' }}>
                        {loading ? 'Salvando...' : (
                            <>
                                <Save size={20} /> Salvar Laudo Definitivo
                            </>
                        )}
                    </button>
                </div>
            </form >
        </div >
    )
}
