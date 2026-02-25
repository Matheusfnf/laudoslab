'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, Clock, CheckCircle2, ClipboardList, GripVertical, User, X, Trash2, Edit2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Producao() {
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const [draggedTask, setDraggedTask] = useState(null)
    const [draggedOverCol, setDraggedOverCol] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Form state for new/edit order
    const [newOrder, setNewOrder] = useState({
        id: null,
        orderNumber: '',
        client: '',
        batch: '',
        manufactureDate: '',
        expirationDate: '',
        items: [],
        itemsToDelete: [] // Track items to delete when editing
    })

    const [currentItem, setCurrentItem] = useState({
        productName: '',
        quantity: '',
        unit: 'UN' // default unit
    })

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const { data: ordersData, error: ordersError } = await supabase
                .from('production_orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (ordersError) throw ordersError

            const { data: itemsData, error: itemsError } = await supabase
                .from('production_order_items')
                .select('*')

            if (itemsError) throw itemsError

            // Combine orders with their items
            const formattedTasks = ordersData.map(order => {
                const orderItems = itemsData.filter(item => item.order_id === order.id).map(i => ({
                    id: i.id,
                    productName: i.product_name,
                    quantity: i.quantity,
                    unit: i.unit
                }))

                return {
                    id: order.id,
                    orderNumber: order.order_number,
                    title: `Pedido #${order.order_number}${order.batch ? ` - Lote: ${order.batch}` : ''}`,
                    client: order.client,
                    batch: order.batch || '',
                    manufactureDate: order.manufacture_date || '',
                    expirationDate: order.expiration_date || '',
                    status: order.status,
                    items: orderItems
                }
            })

            setTasks(formattedTasks)
        } catch (error) {
            console.error('Error fetching orders:', error)
            alert('Erro ao carregar pedidos de produção.')
        } finally {
            setIsLoading(false)
        }
    }

    const columns = [
        {
            id: 'todo',
            title: 'Pedidos a fazer',
            icon: <ClipboardList size={22} color="#8e8e93" />,
            color: '#8e8e93',
            bg: 'rgba(229, 229, 234, 0.4)'
        },
        {
            id: 'in_progress',
            title: 'Em andamento',
            icon: <Clock size={22} color="#007aff" />,
            color: '#007aff',
            bg: 'rgba(0, 122, 255, 0.1)'
        },
        {
            id: 'done',
            title: 'Concluídos',
            icon: <CheckCircle2 size={22} color="#34c759" />,
            color: '#34c759',
            bg: 'rgba(52, 199, 89, 0.15)'
        },
    ]

    const handleDragStart = (e, task) => {
        setDraggedTask(task)
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', task.id)
        }
    }

    const handleDragOver = (e, colId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (draggedOverCol !== colId) {
            setDraggedOverCol(colId)
        }
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setDraggedOverCol(null)
    }

    const handleDrop = async (e, colId) => {
        e.preventDefault()
        setDraggedOverCol(null)

        if (draggedTask && draggedTask.status !== colId) {
            // Optimistic UI update
            const originalTasks = [...tasks]
            setTasks(tasks.map(t =>
                t.id === draggedTask.id ? { ...t, status: colId } : t
            ))

            try {
                const { error } = await supabase
                    .from('production_orders')
                    .update({ status: colId, updated_at: new Date().toISOString() })
                    .eq('id', draggedTask.id)

                if (error) throw error
            } catch (error) {
                console.error('Error updating order status:', error)
                // Revert UI on error
                setTasks(originalTasks)
                alert('Erro ao mover o pedido.')
            }
        }
        setDraggedTask(null)
    }

    const handleAddItem = () => {
        if (!currentItem.productName || !currentItem.quantity) return;
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { ...currentItem, id: `temp_${Date.now()}` }]
        })
        setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
    }

    const handleRemoveItem = (id) => {
        const itemToRemove = newOrder.items.find(item => item.id === id)

        // Se for um item que já existe no banco (não é temp_), adiciona à lista de exclusão
        const isTemporary = String(id).startsWith('temp_')
        const updatedItemsToDelete = (!isTemporary && itemToRemove)
            ? [...newOrder.itemsToDelete, id]
            : newOrder.itemsToDelete

        setNewOrder({
            ...newOrder,
            items: newOrder.items.filter(item => item.id !== id),
            itemsToDelete: updatedItemsToDelete
        })
    }

    const handleOpenCreateModal = () => {
        setIsEditing(false)
        setNewOrder({ id: null, orderNumber: '', client: '', batch: '', manufactureDate: '', expirationDate: '', items: [], itemsToDelete: [] })
        setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (task) => {
        setIsEditing(true)
        setNewOrder({
            id: task.id,
            orderNumber: task.orderNumber || '',
            client: task.client || '',
            batch: task.batch || '',
            manufactureDate: task.manufactureDate || '',
            expirationDate: task.expirationDate || '',
            items: [...task.items],
            itemsToDelete: []
        })
        setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
        setIsModalOpen(true)
    }

    const handleSaveOrder = async () => {
        if (!newOrder.orderNumber || !newOrder.client) {
            alert("Preencha o número do pedido e o cliente.");
            return;
        }

        try {
            let orderId = newOrder.id

            if (isEditing) {
                // UPDATE ORDER
                const { error: orderError } = await supabase
                    .from('production_orders')
                    .update({
                        order_number: newOrder.orderNumber,
                        client: newOrder.client,
                        batch: newOrder.batch || null,
                        manufacture_date: newOrder.manufactureDate || null,
                        expiration_date: newOrder.expirationDate || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId)

                if (orderError) throw orderError

                // Delete removed items
                if (newOrder.itemsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('production_order_items')
                        .delete()
                        .in('id', newOrder.itemsToDelete)
                    if (deleteError) throw deleteError
                }

            } else {
                // CREATE NEW ORDER
                const { data: orderData, error: orderError } = await supabase
                    .from('production_orders')
                    .insert([{
                        order_number: newOrder.orderNumber,
                        client: newOrder.client,
                        batch: newOrder.batch || null,
                        manufacture_date: newOrder.manufactureDate || null,
                        expiration_date: newOrder.expirationDate || null,
                        status: 'todo'
                    }])
                    .select()
                    .single()

                if (orderError) throw orderError
                orderId = orderData.id
            }

            // Handle Items (insert new ones)
            const newItemsToInsert = newOrder.items
                .filter(item => String(item.id).startsWith('temp_'))
                .map(item => ({
                    order_id: orderId,
                    product_name: item.productName,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit
                }))

            if (newItemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                    .from('production_order_items')
                    .insert(newItemsToInsert)

                if (itemsError) throw itemsError
            }

            // Reload data to reflect changes reliably
            await fetchOrders()
            setIsModalOpen(false)

        } catch (error) {
            console.error('Error saving order:', error)
            alert('Erro ao salvar o pedido. Verifique o console.')
        }
    }

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando dados da produção...</p>
            </div>
        )
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '2rem', position: 'relative' }}>
            <div className="header-actions" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="title-main">Painel de Produção</h1>
                    <p className="title-sub">Gerencie o fluxo de desenvolvimento e análises do laboratório</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                    <PlusCircle size={20} />
                    Novo Pedido
                </button>
            </div>

            <div style={{
                display: 'flex',
                gap: '2rem',
                overflowX: 'auto',
                minHeight: '65vh',
                padding: '0.5rem 0'
            }}>
                {columns.map(col => {
                    const colTasks = tasks.filter(t => t.status === col.id)
                    const isOver = draggedOverCol === col.id

                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.id)}
                            style={{
                                flex: 1,
                                minWidth: '320px',
                                maxWidth: '400px',
                                background: col.bg,
                                border: isOver ? `2px dashed ${col.color}` : '2px solid transparent',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem',
                                transition: 'all 0.2s ease',
                                boxShadow: isOver ? `0 0 15px ${col.color}33` : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: 700, color: '#1a1a1a' }}>
                                    {col.icon}
                                    {col.title}
                                </h3>
                                <span style={{
                                    background: 'rgba(255,255,255,0.8)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: col.color,
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    {colTasks.length}
                                </span>
                            </div>

                            {colTasks.length === 0 && (
                                <div style={{
                                    padding: '3rem 1rem',
                                    textAlign: 'center',
                                    color: '#8e8e93',
                                    fontSize: '0.95rem',
                                    border: '2px dashed rgba(0,0,0,0.1)',
                                    borderRadius: '12px',
                                    fontWeight: 500
                                }}>
                                    Nenhum pedido nesta etapa
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {colTasks.map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={() => setDraggedTask(null)}
                                        style={{
                                            background: '#fff',
                                            padding: '1.25rem',
                                            borderRadius: '14px',
                                            boxShadow: draggedTask?.id === task.id ? '0 12px 25px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.04)',
                                            cursor: 'grab',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.85rem',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            opacity: draggedTask?.id === task.id ? 0.4 : 1,
                                            transform: draggedTask?.id === task.id ? 'scale(0.98)' : 'scale(1)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#2d3748', lineHeight: 1.4, flex: 1 }}>
                                                {task.title}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleOpenEditModal(task)}
                                                    style={{
                                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                                        color: '#94a3b8', padding: '0.2rem', display: 'flex',
                                                        transition: 'color 0.2s'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.color = '#0ea5e9'}
                                                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                                                    title="Editar Pedido"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <GripVertical size={18} color="#cbd5e1" style={{ flexShrink: 0, cursor: 'grab' }} />
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#64748b',
                                            fontSize: '0.85rem',
                                            background: '#f8fafc',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '8px',
                                            width: 'fit-content'
                                        }}>
                                            <User size={14} />
                                            <span style={{ fontWeight: 500 }}>{task.client}</span>
                                        </div>

                                        {(task.manufactureDate || task.expirationDate) && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                color: '#64748b',
                                                fontSize: '0.8rem',
                                                background: '#f8fafc',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                marginTop: '-0.25rem'
                                            }}>
                                                {task.manufactureDate && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <Calendar size={12} color="#8e8e93" />
                                                        <span>Fab: {formatDateForDisplay(task.manufactureDate)}</span>
                                                    </div>
                                                )}
                                                {task.manufactureDate && task.expirationDate && (
                                                    <span style={{ color: '#cbd5e1' }}>|</span>
                                                )}
                                                {task.expirationDate && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <Calendar size={12} color="#8e8e93" />
                                                        <span>Val: {formatDateForDisplay(task.expirationDate)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {task.items && task.items.length > 0 && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                paddingTop: '0.5rem',
                                                borderTop: '1px solid #f1f5f9',
                                                fontSize: '0.8rem',
                                                color: '#64748b'
                                            }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Produtos:</div>
                                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                    {task.items.map(item => (
                                                        <li key={item.id}>{item.productName} ({item.quantity} {item.unit})</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal de Novo/Editar Pedido */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: '#8e8e93', padding: '0.5rem', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', color: '#1a1a1a', fontSize: '1.5rem', fontWeight: 700 }}>
                            {isEditing ? 'Editar Pedido de Produção' : 'Criar Novo Pedido de Produção'}
                        </h2>

                        <div className="form-group">
                            <label>Número do Pedido *</label>
                            <input
                                type="text"
                                placeholder="Ex: 10045"
                                value={newOrder.orderNumber}
                                onChange={e => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)' }}>Cliente *</label>
                                <input
                                    type="text"
                                    placeholder="Nome do Cliente"
                                    value={newOrder.client}
                                    onChange={e => setNewOrder({ ...newOrder, client: e.target.value })}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)' }}>Lote</label>
                                <input
                                    type="text"
                                    placeholder="Identificação do Lote"
                                    value={newOrder.batch}
                                    onChange={e => setNewOrder({ ...newOrder, batch: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)' }}>Data de Fabricação</label>
                                <input
                                    type="date"
                                    value={newOrder.manufactureDate}
                                    onChange={e => setNewOrder({ ...newOrder, manufactureDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none' }}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-main)' }}>Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={newOrder.expirationDate}
                                    onChange={e => setNewOrder({ ...newOrder, expirationDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Seção de Produtos */}
                        <div style={{
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginTop: '2rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#334155', fontWeight: 600 }}>
                                Produtos do Pedido
                            </h3>

                            {/* Formulário de Adição Rápida */}
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Produto</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do produto"
                                        value={currentItem.productName}
                                        onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Quantidade</label>
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        value={currentItem.quantity}
                                        onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ width: '80px' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>UN</label>
                                    <select
                                        value={currentItem.unit}
                                        onChange={e => setCurrentItem({ ...currentItem, unit: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                                    >
                                        <option value="UN">UN</option>
                                        <option value="KG">KG</option>
                                        <option value="LT">LT</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddItem}
                                    style={{
                                        background: '#0ea5e9', color: '#fff', border: 'none',
                                        padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                        fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        height: '42px', transition: 'background 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#0284c7'}
                                    onMouseOut={e => e.currentTarget.style.background = '#0ea5e9'}
                                >
                                    Add
                                </button>
                            </div>

                            {/* Lista de Produtos Adicionados */}
                            {newOrder.items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {newOrder.items.map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px',
                                                    fontWeight: 700, color: '#475569', fontSize: '0.85rem', minWidth: '70px', textAlign: 'center'
                                                }}>
                                                    {item.quantity} {item.unit}
                                                </div>
                                                <span style={{ fontWeight: 500, color: '#1e293b' }}>{item.productName}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    Nenhum produto adicionado
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveOrder}
                            >
                                {isEditing ? 'Atualizar Pedido' : 'Criar Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
