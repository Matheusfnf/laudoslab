'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, PlusCircle, Trash2, Home, MapPin, Pencil } from 'lucide-react'

export default function Clients() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [newClient, setNewClient] = useState({ name: '', properties: [{ name: '', city: '', state: '' }] })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchClients()
    }, [])

    async function fetchClients() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error fetching clients:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePropertyChange = (index, field, value) => {
        const updated = [...newClient.properties]
        updated[index] = { ...updated[index], [field]: value }
        setNewClient({ ...newClient, properties: updated })
    }

    const addPropertyField = () => {
        setNewClient({ ...newClient, properties: [...newClient.properties, { name: '', city: '', state: '' }] })
    }

    const removePropertyField = (index) => {
        const updated = [...newClient.properties]
        updated.splice(index, 1)
        setNewClient({ ...newClient, properties: updated })
    }

    const resetForm = () => {
        setIsAdding(false)
        setEditingId(null)
        setNewClient({ name: '', properties: [{ name: '', city: '', state: '' }] })
    }

    const handleEditClient = (client) => {
        // Prepare the client properties for the form
        // If they had no properties, provide at least one empty one to edit
        const clientProps = client.properties && client.properties.length > 0
            ? [...client.properties]
            : [{ name: '', city: '', state: '' }]

        setNewClient({
            name: client.name,
            properties: clientProps
        })
        setEditingId(client.id)
        setIsAdding(true)
        window.scrollTo(0, 0)
    }

    const handleSaveClient = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Remove empty properties before saving
            const filteredProperties = newClient.properties.filter(p => p.name.trim() !== '')

            let savedData = null;

            if (editingId) {
                // UPDATE existing client
                const { data, error } = await supabase
                    .from('clients')
                    .update({
                        name: newClient.name,
                        properties: filteredProperties
                    })
                    .eq('id', editingId)
                    .select()

                if (error) throw error
                savedData = data[0]

                // Replace the old client with the updated one in the list
                setClients(clients.map(c => c.id === editingId ? savedData : c).sort((a, b) => a.name.localeCompare(b.name)))
            } else {
                // INSERT new client
                const { data, error } = await supabase
                    .from('clients')
                    .insert([{
                        name: newClient.name,
                        city: null,
                        state: null,
                        properties: filteredProperties
                    }])
                    .select()

                if (error) throw error
                savedData = data[0]

                // Add the new client to the list
                setClients([...clients, savedData].sort((a, b) => a.name.localeCompare(b.name)))
            }

            resetForm()
        } catch (error) {
            alert('Erro ao salvar cliente: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClient = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)

            if (error) throw error
            setClients(clients.filter(c => c.id !== id))
        } catch (error) {
            alert('Erro ao excluir cliente. Verifique se ele não tem laudos associados. Erro: ' + error.message)
        }
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div className="header-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <h1 className="title-main" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={28} color="var(--primary-color)" /> Clientes
                        </h1>
                        <p className="title-sub">Gerencie clientes cadastrados e suas fazendas.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/" passHref>
                            <button className="btn btn-secondary">
                                <Home size={18} /> Início
                            </button>
                        </Link>
                        {!isAdding && (
                            <button className="btn btn-primary" onClick={() => {
                                resetForm()
                                setIsAdding(true)
                            }}>
                                <PlusCircle size={18} /> Novo Cliente
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary-color)' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
                    <form onSubmit={handleSaveClient}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label>Nome do Cliente *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#f8fafd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Propriedades / Fazendas *</label>

                            {newClient.properties.map((prop, index) => (
                                <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', border: '1px solid #e0e7ff', borderRadius: '6px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Nome da Propriedade / Fazenda *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder={`Ex: Fazenda Bela Vista`}
                                                value={prop.name}
                                                onChange={(e) => handlePropertyChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Município</label>
                                            <input
                                                type="text"
                                                placeholder={`Ex: Paracatu`}
                                                value={prop.city}
                                                onChange={(e) => handlePropertyChange(index, 'city', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>UF</label>
                                            <input
                                                type="text"
                                                placeholder={`Ex: MG`}
                                                maxLength={2}
                                                style={{ textTransform: 'uppercase' }}
                                                value={prop.state}
                                                onChange={(e) => handlePropertyChange(index, 'state', e.target.value)}
                                            />
                                        </div>
                                        {newClient.properties.length > 1 && (
                                            <button type="button" onClick={() => removePropertyField(index)} className="btn btn-secondary" style={{ padding: '0 0.75rem', color: '#c62828', background: '#ffebee', height: '42px', border: 'none' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addPropertyField} className="btn btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                + Adicionar outra propriedade
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Salvar Cliente')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Clientes Cadastrados</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Mapeando clientes...</div>
                ) : clients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Nenhum cliente cadastrado ainda.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {clients.map(client => (
                            <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--primary-color)' }}>{client.name}</h3>
                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <span>
                                            <strong>{client.properties?.length || 0}</strong> Fazenda(s) cadastradas
                                        </span>
                                    </div>
                                    {client.properties && client.properties.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                            {client.properties.map((p, i) => (
                                                <span key={i} className="badge" style={{ background: '#e5f1ff', color: 'var(--primary-color)' }}>
                                                    {p.name || p} {p.city ? `(${p.city}/${p.state})` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEditClient(client)} className="btn btn-secondary" style={{ color: 'var(--primary-color)', background: '#e5f1ff', padding: '0.5rem', border: 'none' }} title="Editar cliente">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="btn btn-secondary" style={{ color: '#c62828', background: '#ffebee', padding: '0.5rem', border: 'none' }} title="Excluir cliente">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
