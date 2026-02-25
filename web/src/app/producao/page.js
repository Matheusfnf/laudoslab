'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, Clock, CheckCircle2, ClipboardList, GripVertical, User, X, Trash2, Calendar, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Producao() {
    const [orders, setOrders] = useState([])
    const [batches, setBatches] = useState([]) // Kanban cards
    const [isLoading, setIsLoading] = useState(true)

    const [expandedOrderId, setExpandedOrderId] = useState(null)
    const [draggedBatch, setDraggedBatch] = useState(null)
    const [draggedOverCol, setDraggedOverCol] = useState(null)

    // Modals state
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)

    // Form state for Order
    const [newOrder, setNewOrder] = useState({
        orderNumber: '',
        client: '',
        items: []
    })
    const [currentItem, setCurrentItem] = useState({ productName: '', quantity: '', unit: 'UN' })

    // Form state for Batch
    const [newBatch, setNewBatch] = useState({
        orderId: null,
        itemId: null,
        productName: '',
        unit: '',
        batchNumber: '',
        quantityProduced: '',
        manufactureDate: '',
        expirationDate: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setIsLoading(true)

            // Fetch Orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('production_orders')
                .select('*')
                .order('created_at', { ascending: false })
            if (ordersError) throw ordersError

            // Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from('production_order_items')
                .select('*')
            if (itemsError) throw itemsError

            // Fetch Batches
            const { data: batchesData, error: batchesError } = await supabase
                .from('production_batches')
                .select('*')
                .order('created_at', { ascending: false })
            if (batchesError) throw batchesError

            // Combine Orders with their Items and calculate produced quantities
            const formattedOrders = ordersData.map(order => {
                const orderItems = itemsData.filter(i => i.order_id === order.id).map(item => {
                    const itemBatches = batchesData.filter(b => b.item_id === item.id)
                    const producedCompleted = itemBatches.filter(b => b.status === 'done').reduce((sum, b) => sum + Number(b.quantity_produced), 0)
                    const producedTotal = itemBatches.reduce((sum, b) => sum + Number(b.quantity_produced), 0)

                    return {
                        id: item.id,
                        productName: item.product_name,
                        quantityRequested: item.quantity_requested,
                        quantityProducedTotal: producedTotal, // In any status
                        quantityCompleted: producedCompleted, // Only 'done'
                        unit: item.unit
                    }
                })

                return {
                    id: order.id,
                    orderNumber: order.order_number,
                    client: order.client,
                    status: order.status,
                    items: orderItems
                }
            })

            // Format Batches for Kanban
            const formattedBatches = batchesData.map(batch => {
                const order = ordersData.find(o => o.id === batch.order_id) || {}
                const item = itemsData.find(i => i.id === batch.item_id) || {}

                return {
                    id: batch.id,
                    orderId: batch.order_id,
                    itemId: batch.item_id,
                    batchNumber: batch.batch_number,
                    quantityProduced: batch.quantity_produced,
                    manufactureDate: batch.manufacture_date,
                    expirationDate: batch.expiration_date,
                    status: batch.status,
                    productName: item.product_name || 'Desconhecido',
                    unit: item.unit || 'UN',
                    orderNumber: order.order_number || '?',
                    client: order.client || '?'
                }
            })

            setOrders(formattedOrders)
            setBatches(formattedBatches)
        } catch (error) {
            console.error('Error fetching data:', error)

            // Se erro for de tabela inexistente (ainda não rodou o script)
            if (error.code === '42P01') {
                alert('Tabelas de produção não encontradas. Por favor, execute o script SQL V2 no Supabase.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const columns = [
        { id: 'todo', title: 'A Fazer (Lotes)', icon: <ClipboardList size={22} color="#8e8e93" />, color: '#8e8e93', bg: 'rgba(229, 229, 234, 0.4)' },
        { id: 'in_progress', title: 'Em andamento', icon: <Clock size={22} color="#007aff" />, color: '#007aff', bg: 'rgba(0, 122, 255, 0.1)' },
        { id: 'done', title: 'Concluídos', icon: <CheckCircle2 size={22} color="#34c759" />, color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' },
    ]

    // Kanban Drag & Drop
    const handleDragStart = (e, batch) => {
        setDraggedBatch(batch)
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', batch.id)
        }
    }
    const handleDragOver = (e, colId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (draggedOverCol !== colId) setDraggedOverCol(colId)
    }
    const handleDragLeave = (e) => {
        e.preventDefault()
        setDraggedOverCol(null)
    }
    const handleDrop = async (e, colId) => {
        e.preventDefault()
        setDraggedOverCol(null)

        if (draggedBatch && draggedBatch.status !== colId) {
            const originalBatches = [...batches]
            setBatches(batches.map(b => b.id === draggedBatch.id ? { ...b, status: colId } : b))

            try {
                const { error } = await supabase
                    .from('production_batches')
                    .update({ status: colId, updated_at: new Date().toISOString() })
                    .eq('id', draggedBatch.id)

                if (error) throw error
                // Reload to recalculate quantities if dropped to 'done'
                if (colId === 'done' || draggedBatch.status === 'done') {
                    fetchData()
                }
            } catch (error) {
                console.error('Error updating status:', error)
                setBatches(originalBatches)
                alert('Erro ao mover o lote.')
            }
        }
        setDraggedBatch(null)
    }

    // Modal Orders
    const handleAddOrderItem = () => {
        if (!currentItem.productName || !currentItem.quantity) return;
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { ...currentItem, id: `temp_${Date.now()}` }]
        })
        setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
    }
    const handleRemoveOrderItem = (id) => {
        setNewOrder({ ...newOrder, items: newOrder.items.filter(item => item.id !== id) })
    }
    const handleSaveOrder = async () => {
        if (!newOrder.orderNumber || !newOrder.client || newOrder.items.length === 0) {
            alert("Preencha número, cliente e ao menos um produto.");
            return;
        }
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('production_orders')
                .insert([{ order_number: newOrder.orderNumber, client: newOrder.client, status: 'pending' }])
                .select().single()
            if (orderError) throw orderError

            const itemsToInsert = newOrder.items.map(item => ({
                order_id: orderData.id,
                product_name: item.productName,
                quantity_requested: parseFloat(item.quantity),
                unit: item.unit
            }))

            const { error: itemsError } = await supabase.from('production_order_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            await fetchData()
            setIsOrderModalOpen(false)
        } catch (error) {
            console.error(error)
            alert('Erro ao criar pedido.')
        }
    }

    // Modal Batches
    const handleOpenBatchModal = (orderId, item) => {
        const remaining = item.quantityRequested - item.quantityProducedTotal
        setNewBatch({
            orderId: orderId,
            itemId: item.id,
            productName: item.productName,
            unit: item.unit,
            batchNumber: '',
            quantityProduced: remaining > 0 ? remaining : '',
            manufactureDate: '',
            expirationDate: ''
        })
        setIsBatchModalOpen(true)
    }

    const handleSaveBatch = async () => {
        if (!newBatch.batchNumber || !newBatch.quantityProduced) {
            alert("Lote e quantidade são obrigatórios.");
            return;
        }
        try {
            // Create new batch
            const { error } = await supabase
                .from('production_batches')
                .insert([{
                    order_id: newBatch.orderId,
                    item_id: newBatch.itemId,
                    batch_number: newBatch.batchNumber,
                    quantity_produced: parseFloat(newBatch.quantityProduced),
                    manufacture_date: newBatch.manufactureDate || null,
                    expiration_date: newBatch.expirationDate || null,
                    status: 'todo'
                }])
            if (error) throw error

            await fetchData()
            setIsBatchModalOpen(false)
        } catch (error) {
            console.error(error)
            alert('Erro ao gerar lote.')
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
                <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando Produção...</p>
            </div>
        )
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div className="header-actions" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
                <div>
                    <h1 className="title-main">Painel de Produção</h1>
                    <p className="title-sub">Gerencie Pedidos dos clientes e divida-os em Lotes de produção</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '70vh' }}>

                {/* SIDEBAR: PEDIDOS */}
                <div style={{
                    minWidth: '300px',
                    width: '30%',
                    maxWidth: '400px',
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Pedidos</h2>
                        <button
                            onClick={() => {
                                setNewOrder({ orderNumber: '', client: '', items: [] })
                                setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
                                setIsOrderModalOpen(true)
                            }}
                            style={{
                                background: '#0ea5e9', color: '#fff', border: 'none',
                                padding: '0.5rem 0.8rem', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            <PlusCircle size={16} /> Novo
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum pedido pendente</div>
                        ) : (
                            orders.map(order => {
                                const isExpanded = expandedOrderId === order.id;
                                const isOrderComplete = order.items.every(i => i.quantityCompleted >= i.quantityRequested)

                                return (
                                    <div key={order.id} style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        opacity: isOrderComplete ? 0.6 : 1
                                    }}>
                                        <div
                                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                            style={{
                                                background: isExpanded ? '#f8fafc' : '#fff',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Pedido #{order.orderNumber}
                                                    {isOrderComplete && <CheckCircle2 size={16} color="#10b981" />}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                                    <User size={12} /> {order.client}
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '0 1rem 1rem 1rem', background: '#f8fafc' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Produtos:</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {order.items.map(item => {
                                                        const isItemComplete = item.quantityCompleted >= item.quantityRequested
                                                        return (
                                                            <div key={item.id} style={{
                                                                background: '#fff', padding: '0.75rem', borderRadius: '8px',
                                                                border: '1px solid #e2e8f0', fontSize: '0.85rem'
                                                            }}>
                                                                <div style={{ fontWeight: 600, color: '#475569', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                                                                    {item.productName}
                                                                    {isItemComplete && <CheckCircle2 size={14} color="#10b981" />}
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                        <span style={{ color: isItemComplete ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                                                            {item.quantityCompleted}
                                                                        </span> / {item.quantityRequested} {item.unit} concluídos
                                                                    </div>
                                                                    {!isItemComplete && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenBatchModal(order.id, item) }}
                                                                            style={{
                                                                                background: '#e0f2fe', color: '#0284c7', border: 'none',
                                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                                                                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem'
                                                                            }}
                                                                        >
                                                                            <Package size={12} /> + Lote
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {item.quantityProducedTotal > item.quantityCompleted && item.quantityProducedTotal > 0 && (
                                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                                                                        ({item.quantityProducedTotal - item.quantityCompleted} {item.unit} em produçao)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* BOARD: LOTES */}
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    flex: 1,
                    paddingBottom: '0.5rem'
                }}>
                    {columns.map(col => {
                        const colBatches = batches.filter(b => b.status === col.id)
                        const isOver = draggedOverCol === col.id

                        return (
                            <div
                                key={col.id}
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id)}
                                style={{
                                    flex: 1,
                                    minWidth: 0, // Permite que a flexbox encolha
                                    background: col.bg,
                                    border: isOver ? `2px dashed ${col.color}` : '2px solid transparent',
                                    borderRadius: '16px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isOver ? `0 0 15px ${col.color}33` : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexShrink: 0 }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>
                                        {col.icon}
                                        {col.title}
                                    </h3>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.8)',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: col.color,
                                    }}>
                                        {colBatches.length}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.85rem'
                                }}>
                                    {colBatches.length === 0 && (
                                        <div style={{
                                            padding: '2.5rem 1rem', textAlign: 'center', color: '#8e8e93', fontSize: '0.9rem',
                                            border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '12px', fontWeight: 500
                                        }}>
                                            Nenhum lote nesta etapa
                                        </div>
                                    )}
                                    {colBatches.map(batch => (
                                        <div
                                            key={batch.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, batch)}
                                            onDragEnd={() => setDraggedBatch(null)}
                                            style={{
                                                background: '#fff',
                                                padding: '1.15rem',
                                                borderRadius: '12px',
                                                boxShadow: draggedBatch?.id === batch.id ? '0 12px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                                                cursor: 'grab',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.6rem',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                opacity: draggedBatch?.id === batch.id ? 0.4 : 1,
                                                transform: draggedBatch?.id === batch.id ? 'scale(0.98)' : 'scale(1)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                                                    {batch.productName}
                                                </h4>
                                                <GripVertical size={16} color="#cbd5e1" style={{ flexShrink: 0, cursor: 'grab' }} />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', width: 'fit-content' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1' }}>Lote: {batch.batchNumber}</span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9' }}>{batch.quantityProduced} {batch.unit}</span>
                                            </div>

                                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ fontWeight: 600 }}>P. #{batch.orderNumber}</span> - {batch.client}
                                                </div>
                                            </div>

                                            {(batch.manufactureDate || batch.expirationDate) && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#94a3b8',
                                                    fontSize: '0.7rem', marginTop: '0.2rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9'
                                                }}>
                                                    {batch.manufactureDate && <span>Fab: {formatDateForDisplay(batch.manufactureDate)}</span>}
                                                    {batch.manufactureDate && batch.expirationDate && <span>•</span>}
                                                    {batch.expirationDate && <span>Val: {formatDateForDisplay(batch.expirationDate)}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MODAL NOVO PEDIDO */}
            {isOrderModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setIsOrderModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Cadastrar Novo Pedido</h2>

                        <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>Número do Pedido *</label>
                                <input type="text" placeholder="Ex: 10045" value={newOrder.orderNumber} onChange={e => setNewOrder({ ...newOrder, orderNumber: e.target.value })} />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label>Cliente *</label>
                                <input type="text" placeholder="Nome do Cliente" value={newOrder.client} onChange={e => setNewOrder({ ...newOrder, client: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Produtos Solicitados</h3>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 2 }}><label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto</label><input type="text" value={currentItem.productName} onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Qtd Total</label><input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                                <div style={{ width: '80px' }}><label style={{ fontSize: '0.75rem', fontWeight: 600 }}>UN</label><select value={currentItem.unit} onChange={e => setCurrentItem({ ...currentItem, unit: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="UN">UN</option><option value="KG">KG</option><option value="LT">LT</option></select></div>
                                <button onClick={handleAddOrderItem} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                            </div>

                            {newOrder.items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {newOrder.items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '0.85rem' }}><strong style={{ color: '#0ea5e9' }}>{item.quantity} {item.unit}</strong> • {item.productName}</div>
                                            <button onClick={() => handleRemoveOrderItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Adicione os produtos do pedido</div>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveOrder}>Cadastrar Pedido</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NOVO LOTE */}
            {isBatchModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setIsBatchModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Separar Lote para Produção</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Produto: <strong style={{ color: '#1e293b' }}>{newBatch.productName}</strong></p>

                        <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 2 }}>
                                <label>Número do Lote *</label>
                                <input type="text" placeholder="Ex: Lote 001" value={newBatch.batchNumber} onChange={e => setNewBatch({ ...newBatch, batchNumber: e.target.value })} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Qtd. Lote *</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <input type="number" style={{ border: 'none', borderRadius: 0, width: '100%' }} value={newBatch.quantityProduced} onChange={e => setNewBatch({ ...newBatch, quantityProduced: e.target.value })} />
                                    <span style={{ padding: '0 10px', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{newBatch.unit}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ flex: 1 }}><label>Data Fabricação</label><input type="date" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }} value={newBatch.manufactureDate} onChange={e => setNewBatch({ ...newBatch, manufactureDate: e.target.value })} /></div>
                            <div style={{ flex: 1 }}><label>Data Vencimento</label><input type="date" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }} value={newBatch.expirationDate} onChange={e => setNewBatch({ ...newBatch, expirationDate: e.target.value })} /></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsBatchModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveBatch}>Gerar Lote no Kanban</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
