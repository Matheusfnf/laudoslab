'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, Clock, CheckCircle2, ClipboardList, GripVertical, User, X, Trash2, Calendar, Package, ChevronDown, ChevronRight, ChevronLeft, Edit2, ScrollText, Clipboard as ClipBoard, Layers, Printer, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Producao() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [batches, setBatches] = useState([]) // Kanban cards
    const [isLoading, setIsLoading] = useState(true)

    const [catalogProducts, setCatalogProducts] = useState([])
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
    const [editingCatalogId, setEditingCatalogId] = useState(null)
    const [newCatalogProduct, setNewCatalogProduct] = useState({
        name: '', acronym: '', type: 'bacteria', shelf_life_months: 6, last_sequential_number: 0
    })

    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [draggedItem, setDraggedItem] = useState(null) // Pode ser um product ou batch
    const [draggedOverCol, setDraggedOverCol] = useState(null)

    // Editing State
    const [editingOrderId, setEditingOrderId] = useState(null)
    const [editingBatchId, setEditingBatchId] = useState(null)

    // Modals state
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
    const [openDropdownId, setOpenDropdownId] = useState(null) // State para controlar o menu dropdown aberto
    const [activeTab, setActiveTab] = useState('active') // 'active' ou 'completed'

    // Form state for Order
    const [newOrder, setNewOrder] = useState({
        orderNumber: '',
        client: '',
        requesterName: '',
        orderDate: '',
        estimatedCompletionDate: '',
        receiptImage: null, // Novo campo para o arquivo da imagem em si
        receiptImageUrl: '', // URL retornado do banco
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

            // Fetch Catalog
            const { data: catalogData, error: catalogError } = await supabase
                .from('catalog_products')
                .select('*')
                .order('name', { ascending: true })
            if (catalogError && catalogError.code !== '42P01') throw catalogError // ignore table missing if not created yet
            setCatalogProducts(catalogData || [])

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
                    requesterName: order.requester_name,
                    orderDate: order.order_date,
                    estimatedCompletionDate: order.estimated_completion_date,
                    receiptImageUrl: order.receipt_image_url,
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
                    client: order.client || '?',
                    requesterName: order.requester_name || 'Não informado',
                    orderDate: order.order_date || null
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

    const handleSaveCatalogProduct = async () => {
        if (!newCatalogProduct.name || !newCatalogProduct.acronym) {
            alert("Nome e sigla são obrigatórios.")
            return;
        }
        try {
            if (editingCatalogId) {
                const { error } = await supabase.from('catalog_products').update(newCatalogProduct).eq('id', editingCatalogId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('catalog_products').insert([newCatalogProduct])
                if (error) throw error
            }
            const { data } = await supabase.from('catalog_products').select('*').order('name', { ascending: true })
            setCatalogProducts(data || [])
            setIsCatalogModalOpen(false)
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar produto no catálogo.')
        }
    }

    const handleDeleteCatalogProduct = async (id) => {
        if (!window.confirm("Deseja mesmo remover do catálogo? Os lotes e pedidos anteriores não serão afetados, mas este não aparecerá mais na lista.")) return;
        try {
            const { error } = await supabase.from('catalog_products').delete().eq('id', id)
            if (error) throw error
            const { data } = await supabase.from('catalog_products').select('*').order('name', { ascending: true })
            setCatalogProducts(data || [])
        } catch (error) {
            console.error(error)
            alert('Erro ao remover produto.')
        }
    }

    const columns = [
        { id: 'products', title: 'Produtos (A Fazer)', icon: <ClipboardList size={22} color="#8e8e93" />, color: '#8e8e93', bg: 'rgba(229, 229, 234, 0.4)' },
        { id: 'in_progress', title: 'Em andamento (Lotes)', icon: <Clock size={22} color="#007aff" />, color: '#007aff', bg: 'rgba(0, 122, 255, 0.1)' },
        { id: 'done', title: 'Concluídos (Lotes)', icon: <CheckCircle2 size={22} color="#34c759" />, color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' },
    ]

    // Kanban Drag & Drop
    const handleDragStart = (e, item, type) => {
        const dragData = { type, data: item }
        setDraggedItem(dragData)
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('application/json', JSON.stringify(dragData))
        }
    }
    const handleDragOver = (e, colId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        // Bloqueia arrastar Lote de volta para Produtos
        if (draggedItem?.type === 'batch' && colId === 'products') return;
        // Bloqueia arrastar Produto para Concluído direto ou de volta
        if (draggedItem?.type === 'product' && (colId === 'done' || colId === 'products')) return;

        if (draggedOverCol !== colId) setDraggedOverCol(colId)
    }
    const handleDragLeave = (e) => {
        e.preventDefault()
        setDraggedOverCol(null)
    }
    const handleDrop = async (e, colId) => {
        e.preventDefault()
        setDraggedOverCol(null)

        if (!draggedItem) return;

        if (draggedItem.type === 'product' && colId === 'in_progress') {
            // Drop de um Produto em "Em Andamento" -> Abre Modal de Lote
            handleOpenBatchModal(selectedOrderId, draggedItem.data, 'in_progress')
        }
        else if (draggedItem.type === 'batch') {
            const batch = draggedItem.data;
            handleMoveBatchStatus(batch, colId);
        }
        setDraggedItem(null)
    }

    const handleMoveBatchStatus = async (batch, newStatus) => {
        if (newStatus === 'products') return; // Bloqueia Lote -> Produto
        if (batch.status === newStatus) return;

        const originalBatches = [...batches]
        setBatches(batches.map(b => b.id === batch.id ? { ...b, status: newStatus } : b))

        try {
            const { error } = await supabase
                .from('production_batches')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', batch.id)

            if (error) throw error
            if (newStatus === 'done' || batch.status === 'done') {
                fetchData() // Refresh partial qtys
            }
        } catch (error) {
            console.error('Error updating status:', error)
            setBatches(originalBatches)
            alert('Erro ao mover o lote.')
        }
    }

    // Ações de Pedido (Editar e Excluir)
    const handleEditOrder = () => {
        const orderToEdit = orders.find(o => o.id === selectedOrderId)
        if (!orderToEdit) return;

        setNewOrder({
            orderNumber: orderToEdit.orderNumber,
            client: orderToEdit.client,
            requesterName: orderToEdit.requesterName || '',
            orderDate: orderToEdit.orderDate || '',
            estimatedCompletionDate: orderToEdit.estimatedCompletionDate || '',
            receiptImage: null, // Reset input
            receiptImageUrl: orderToEdit.receiptImageUrl || '',
            items: orderToEdit.items.map(i => ({
                id: i.id, // Original ID
                productName: i.productName,
                quantity: i.quantityRequested.toString(),
                unit: i.unit
            }))
        })
        setEditingOrderId(orderToEdit.id)
        setIsOrderModalOpen(true)
    }

    const handleDeleteOrder = async () => {
        const orderToDelete = orders.find(o => o.id === selectedOrderId)
        if (!orderToDelete) return;

        const confirmDelete = window.confirm(`ATENÇÃO: Você está prestes a excluir o pedido #${orderToDelete.orderNumber}.\\nEsta ação também apagará TODOS os lotes de produção vinculados a este pedido.\\n\\nDeseja realmente continuar?`)
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('production_orders')
                .delete()
                .eq('id', orderToDelete.id)

            if (error) throw error

            setSelectedOrderId(null)
            await fetchData()
        } catch (error) {
            console.error('Erro ao deletar pedido:', error)
            alert('Não foi possível excluir o pedido.')
        }
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
            let uploadedImageUrl = newOrder.receiptImageUrl;

            // Upload de Imagem se houver
            if (newOrder.receiptImage) {
                const fileExt = newOrder.receiptImage.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `receipts/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('production-receipts')
                    .upload(filePath, newOrder.receiptImage, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('production-receipts')
                    .getPublicUrl(filePath);

                uploadedImageUrl = publicUrlData.publicUrl;
            }

            const payloadData = {
                order_number: newOrder.orderNumber,
                client: newOrder.client,
                requester_name: newOrder.requesterName || null,
                order_date: newOrder.orderDate || null,
                estimated_completion_date: newOrder.estimatedCompletionDate || null,
                receipt_image_url: uploadedImageUrl || null
            };

            if (editingOrderId) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('production_orders')
                    .update(payloadData)
                    .eq('id', editingOrderId)

                if (updateError) throw updateError

                // Process Items: Get current ones to find what to delete
                const currentOrder = orders.find(o => o.id === editingOrderId)
                const oldItemIds = currentOrder ? currentOrder.items.map(i => i.id) : []
                const newItemIds = newOrder.items.filter(i => !i.id.startsWith('temp_')).map(i => i.id)

                // Excluir os itens removidos
                const itemsToDelete = oldItemIds.filter(id => !newItemIds.includes(id))
                if (itemsToDelete.length > 0) {
                    const { error: deleteItemsError } = await supabase
                        .from('production_order_items')
                        .delete()
                        .in('id', itemsToDelete)
                    if (deleteItemsError) throw deleteItemsError
                }

                // Separar em novos e existentes para insert/update
                const itemsToInsert = []

                for (const item of newOrder.items) {
                    if (item.id.startsWith('temp_')) {
                        itemsToInsert.push({
                            order_id: editingOrderId,
                            product_name: item.productName,
                            quantity_requested: parseFloat(item.quantity),
                            unit: item.unit
                        })
                    } else {
                        // Atualizar item existente (pode ter mudado nome ou qty)
                        const { error: updateItemError } = await supabase
                            .from('production_order_items')
                            .update({
                                product_name: item.productName,
                                quantity_requested: parseFloat(item.quantity),
                                unit: item.unit
                            })
                            .eq('id', item.id)

                        if (updateItemError) throw updateItemError
                    }
                }

                if (itemsToInsert.length > 0) {
                    const { error: insertItemsError } = await supabase.from('production_order_items').insert(itemsToInsert)
                    if (insertItemsError) throw insertItemsError
                }

            } else {
                // INSERT NOVO PEDIDO
                const { data: orderData, error: orderError } = await supabase
                    .from('production_orders')
                    .insert([{ ...payloadData, status: 'pending' }])
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
            }

            await fetchData()
            setIsOrderModalOpen(false)
            setEditingOrderId(null) // Reset
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar pedido.')
        }
    }

    // Modal Batches
    const handleOpenBatchModal = (orderId, item, initialStatus = 'in_progress') => {
        const remaining = item.quantityRequested - item.quantityProducedTotal

        const catalogItem = catalogProducts.find(c => c.name === item.productName)
        let initialBatchNumber = ''
        let initialManufacture = new Date().toISOString().split('T')[0] // Hoje
        let initialExpiration = ''

        if (catalogItem) {
            const today = new Date()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const year2Digit = String(today.getFullYear()).slice(-2)

            // Lógica Sequencial (ex: 7 vira 08)
            const nextSeqNumber = (catalogItem.last_sequential_number || 0) + 1
            const formattedSeq = String(nextSeqNumber).padStart(2, '0')

            initialBatchNumber = `${catalogItem.acronym.replace(/-/g, '')}${formattedSeq}-${month}${year2Digit}`

            const expDate = new Date(today)
            expDate.setMonth(expDate.getMonth() + catalogItem.shelf_life_months)
            initialExpiration = expDate.toISOString().split('T')[0]
        }

        setNewBatch({
            orderId: orderId,
            itemId: item.id,
            productName: item.productName,
            unit: item.unit,
            batchNumber: initialBatchNumber,
            quantityProduced: remaining > 0 ? remaining : '',
            manufactureDate: initialManufacture,
            expirationDate: initialExpiration,
            status: initialStatus,
            _suggestedBatchNumber: initialBatchNumber // guardamos para saber se ele aceitou a sugestão
        })
        setEditingBatchId(null)
        setIsBatchModalOpen(true)
    }

    const handleManufactureDateChange = (dateString, currentProductName) => {
        const catalogItem = catalogProducts.find(c => c.name === currentProductName)
        if (!dateString || !catalogItem) {
            setNewBatch(prev => ({ ...prev, manufactureDate: dateString }))
            return;
        }

        const dateObj = new Date(dateString + 'T12:00:00') // evita fuso horário subtraindo 1 dia
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const year2Digit = String(dateObj.getFullYear()).slice(-2)

        const nextSeqNumber = (catalogItem.last_sequential_number || 0) + 1
        const formattedSeq = String(nextSeqNumber).padStart(2, '0')
        const newBatchNumber = `${catalogItem.acronym.replace(/-/g, '')}${formattedSeq}-${month}${year2Digit}`

        const expDate = new Date(dateObj)
        expDate.setMonth(expDate.getMonth() + catalogItem.shelf_life_months)
        const newExpiration = expDate.toISOString().split('T')[0]

        setNewBatch(prev => ({
            ...prev,
            manufactureDate: dateString,
            batchNumber: newBatchNumber,
            expirationDate: newExpiration,
            _suggestedBatchNumber: newBatchNumber
        }))
    }


    const handleEditBatch = (batch) => {
        setNewBatch({
            orderId: batch.orderId,
            itemId: batch.itemId,
            productName: batch.productName,
            unit: batch.unit,
            batchNumber: batch.batchNumber,
            quantityProduced: batch.quantityProduced,
            manufactureDate: batch.manufactureDate || '',
            expirationDate: batch.expirationDate || '',
            status: batch.status
        })
        setEditingBatchId(batch.id)
        setIsBatchModalOpen(true)
    }

    const handleCompleteOrder = async () => {
        if (!selectedOrderId) return;

        const currentOrder = orders.find(o => o.id === selectedOrderId);
        if (!currentOrder) return;

        const isFullyProduced = currentOrder.items.length === 0 || currentOrder.items.every(i => i.quantityCompleted >= i.quantityRequested);
        if (!isFullyProduced) {
            alert("Não é possível concluir. Todos os produtos precisam ter seus lotes finalizados com a quantidade solicitada.");
            return;
        }

        if (!window.confirm("Deseja realmente marcar este pedido como concluído? Ele será movido para a aba de Concluídos.")) return;
        try {
            const { error } = await supabase.from('production_orders').update({ status: 'completed' }).eq('id', selectedOrderId)
            if (error) throw error
            await fetchData()
            setSelectedOrderId(null)
            setActiveTab('completed')
        } catch (e) { console.error(e); alert('Erro ao concluir pedido') }
    }

    const handleReopenOrder = async () => {
        if (!selectedOrderId) return;
        if (!window.confirm("Deseja reabrir este pedido? Ele voltará para a aba de Em Andamento.")) return;
        try {
            const { error } = await supabase.from('production_orders').update({ status: 'pending' }).eq('id', selectedOrderId)
            if (error) throw error
            await fetchData()
            setSelectedOrderId(null)
            setActiveTab('active')
        } catch (e) { console.error(e); alert('Erro ao reabrir pedido') }
    }

    const handleDeleteBatch = async (batch) => {
        const confirmDelete = window.confirm(`ATENÇÃO: Você está prestes a excluir o lote ${batch.batchNumber} (${batch.quantityProduced} ${batch.unit}).\\nA quantidade devolvida voltará a ficar "Pendente".\\nDeseja continuar?`)
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('production_batches')
                .delete()
                .eq('id', batch.id)

            if (error) throw error

            await fetchData()
        } catch (error) {
            console.error('Erro ao deletar lote:', error)
            alert('Não foi possível excluir o lote.')
        }
    }

    const handleSaveBatch = async () => {
        if (!newBatch.batchNumber || !newBatch.quantityProduced) {
            alert("Lote e quantidade são obrigatórios.");
            return;
        }
        try {
            if (editingBatchId) {
                // UPDATE
                const { error } = await supabase
                    .from('production_batches')
                    .update({
                        batch_number: newBatch.batchNumber,
                        quantity_produced: parseFloat(newBatch.quantityProduced),
                        manufacture_date: newBatch.manufactureDate || null,
                        expiration_date: newBatch.expirationDate || null
                    })
                    .eq('id', editingBatchId)

                if (error) throw error
            } else {
                // CREATE new batch
                const { error: insertError } = await supabase
                    .from('production_batches')
                    .insert([{
                        order_id: newBatch.orderId,
                        item_id: newBatch.itemId,
                        batch_number: newBatch.batchNumber,
                        quantity_produced: parseFloat(newBatch.quantityProduced),
                        manufacture_date: newBatch.manufactureDate || null,
                        expiration_date: newBatch.expirationDate || null,
                        status: newBatch.status || 'in_progress'
                    }])
                if (insertError) throw insertError

                // Lógica Sequencial: se o usuário usou o lote sugerido, incrementamos no banco para o próximo
                if (newBatch._suggestedBatchNumber && newBatch.batchNumber === newBatch._suggestedBatchNumber) {
                    const catalogItem = catalogProducts.find(c => c.name === newBatch.productName)
                    if (catalogItem) {
                        const newSeqNumber = (catalogItem.last_sequential_number || 0) + 1
                        const { error: updateCatalogError } = await supabase
                            .from('catalog_products')
                            .update({ last_sequential_number: newSeqNumber })
                            .eq('id', catalogItem.id)

                        if (updateCatalogError) console.error("Erro ao incrementar sequencial no catálogo:", updateCatalogError)
                    }
                }
            }

            await fetchData()
            setIsBatchModalOpen(false)
            setEditingBatchId(null)
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar lote.')
        }
    }

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    const handlePrintLabel = (batch) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            alert("Por favor, permita pop-ups para imprimir a etiqueta.");
            return;
        }

        // Busca o produto no catálogo para pegar a sigla (acronym)
        const catalogItem = catalogProducts.find(c => c.name === batch.productName);
        const titleText = catalogItem && catalogItem.acronym
            ? `ATIVADOR ${catalogItem.acronym}`
            : batch.productName;

        // O usuário solicitou que o volume seja sempre "5 Litros" para a etiqueta
        const volumeText = `Volume: 5 Litros`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etiqueta ${batch.batchNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100vw;
                        height: 100vh;
                        background: #f8fafc;
                        color: #000;
                    }
                    .label-container {
                        width: 15cm;
                        height: 10cm;
                        padding: 1.5cm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        align-items: center;
                        text-align: center;
                        background: #fff;
                        border: 1px dashed #ccc;
                    }
                    @media print {
                        body {
                            align-items: flex-start;
                            justify-content: flex-start;
                            background: none;
                        }
                        .label-container {
                            border: none;
                            width: 100%;
                            height: 100%;
                            page-break-after: always;
                            padding: 0;
                        }
                        @page {
                            size: 15cm 10cm;
                            margin: 0;
                        }
                    }
                    .title {
                        font-size: 38px;
                        font-weight: 800;
                        text-transform: uppercase;
                        margin: 0;
                        line-height: 1.2;
                    }
                    .volume {
                        font-size: 28px;
                        font-weight: 700;
                        margin: 14px 0 16px 0;
                    }
                    .info-col {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                        font-size: 20px;
                        width: 100%;
                        margin-bottom: 20px;
                    }
                    .info-item {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .info-bold {
                        font-weight: 800;
                        margin-left: 10px;
                        font-size: 22px;
                    }
                    .conservation {
                        font-size: 16px;
                        font-weight: 700;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                    }
                    .agite {
                        font-size: 16px;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    .logo-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        margin-top: 10px;
                    }
                    .logo-img {
                        height: 60px;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <div class="label-container">
                    <div>
                        <div class="title">${titleText}</div>
                        <div class="volume">${volumeText}</div>
                    </div>
                    
                    <div class="info-col">
                        <div class="info-item">Lote: <span class="info-bold">${batch.batchNumber}</span></div>
                        <div class="info-item">Fab: <span class="info-bold">${formatDateForDisplay(batch.manufactureDate)}</span></div>
                        <div class="info-item">Val: <span class="info-bold">${formatDateForDisplay(batch.expirationDate)}</span></div>
                    </div>

                    <div>
                        <div class="conservation">CONSERVAÇÃO: MANTER REFRIGERADO.</div>
                        <div class="agite">AGITE BEM ANTES DE USAR.</div>
                    </div>

                    <div class="logo-container">
                        <img src="${window.location.origin}/logos/Logo proativa vetorizado.svg" class="logo-img" alt="Proativa Lab Logo" onerror="this.style.display='none'"/>
                    </div>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Carregando Produção...</p>
            </div>
        )
    }

    const currentSelectedOrder = orders.find(o => o.id === selectedOrderId);
    const canCompleteOrder = currentSelectedOrder ? (currentSelectedOrder.items.length === 0 || currentSelectedOrder.items.every(i => i.quantityCompleted >= i.quantityRequested)) : false;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '0.5rem', height: 'calc(100vh - 135px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                    width: 0px;
                    background: transparent;
                }
            `}} />


            <div className="producao-container">

                {/* SIDEBAR: PEDIDOS */}
                <div className="producao-sidebar">
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Painel de Produção</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => {
                                        setNewCatalogProduct({ name: '', acronym: '', type: 'bacteria', shelf_life_months: 6 })
                                        setEditingCatalogId(null)
                                        setIsCatalogModalOpen(true)
                                    }}
                                    style={{
                                        background: '#fff', color: '#64748b', border: '1px solid #cbd5e1',
                                        padding: '0.4rem 0.6rem', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                    title="Catálogo de Produtos"
                                >
                                    <Layers size={15} /> Catálogo
                                </button>
                                {activeTab === 'active' && (
                                    <button
                                        onClick={() => {
                                            setEditingOrderId(null)
                                            setNewOrder({ orderNumber: '', client: '', items: [] })
                                            setCurrentItem({ productName: '', quantity: '', unit: 'UN' })
                                            setIsOrderModalOpen(true)
                                        }}
                                        style={{
                                            background: '#0ea5e9', color: '#fff', border: 'none',
                                            padding: '0.4rem 0.6rem', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)'
                                        }}
                                        title="Novo Pedido"
                                    >
                                        <PlusCircle size={15} /> Novo
                                    </button>
                                )}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Gerencie pedidos e divida-os em lotes.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '10px' }}>
                        <button
                            onClick={() => { setActiveTab('active'); setSelectedOrderId(null) }}
                            style={{ flex: 1, padding: '0.5rem', background: activeTab === 'active' ? '#fff' : 'transparent', color: activeTab === 'active' ? '#0ea5e9' : '#64748b', fontWeight: 600, border: 'none', borderRadius: '8px', boxShadow: activeTab === 'active' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                        >
                            Em Andamento
                        </button>
                        <button
                            onClick={() => { setActiveTab('completed'); setSelectedOrderId(null) }}
                            style={{ flex: 1, padding: '0.5rem', background: activeTab === 'completed' ? '#fff' : 'transparent', color: activeTab === 'completed' ? '#10b981' : '#64748b', fontWeight: 600, border: 'none', borderRadius: '8px', boxShadow: activeTab === 'completed' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                        >
                            Concluídos
                        </button>
                    </div>

                    <div className="orders-list hide-scrollbar">
                        {orders.filter(o => activeTab === 'completed' ? o.status === 'completed' : o.status !== 'completed').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum pedido {activeTab === 'completed' ? 'concluído' : 'pendente'}</div>
                        ) : (
                            orders.filter(o => activeTab === 'completed' ? o.status === 'completed' : o.status !== 'completed').map(order => {
                                const isSelected = selectedOrderId === order.id;
                                const isOrderComplete = order.items.every(i => i.quantityCompleted >= i.quantityRequested)

                                return (
                                    <div key={order.id} style={{
                                        flexShrink: 0, // Prevents cards from squishing under max-height constraints
                                        border: isSelected ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        opacity: isOrderComplete && !isSelected ? 0.6 : 1,
                                        boxShadow: isSelected ? '0 4px 12px rgba(14, 165, 233, 0.15)' : 'none'
                                    }}>
                                        <div
                                            onClick={() => setSelectedOrderId(order.id)}
                                            style={{
                                                background: isSelected ? '#f0f9ff' : '#fff',
                                                padding: '1.25rem 1rem', // Increased top/bottom padding
                                                cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                gap: '1rem' // Added gap between text and chevron
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span style={{ wordBreak: 'break-word' }}>Pedido #{order.orderNumber}</span>
                                                    {isOrderComplete && <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />}
                                                </div>
                                                <div style={{ fontSize: '0.82rem', color: isSelected ? '#0369a1' : '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.3rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                                                        <User size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                        <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>Cliente: {order.client || 'Nenhum'}</span>
                                                    </div>
                                                    {order.requesterName && (
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem', color: isSelected ? '#0284c7' : '#94a3b8' }}>
                                                            <User size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                            <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>Solc.: {order.requesterName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={18} color={isSelected ? '#0ea5e9' : '#94a3b8'} style={{ flexShrink: 0 }} />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* BOARD: LOTES */}
                <div className="producao-board">
                    {!selectedOrderId ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                            <Package size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>Selecione um Pedido</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.5rem' }}>Clique em um pedido na lista ao lado para ver e gerenciar os seus Lotes de produção.</p>
                        </div>
                    ) : (
                        <>
                            {/* Selected Order Header */}
                            <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flexShrink: 0, gap: '0.6rem' }}>
                                {/* Linha 1: Título + Botões */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0ea5e9', margin: 0, whiteSpace: 'nowrap' }}>
                                        Pedido #{orders.find(o => o.id === selectedOrderId)?.orderNumber}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {activeTab === 'completed' ? (
                                            <button
                                                onClick={handleReopenOrder}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f59e0b', color: '#fff', border: 'none', padding: '0.45rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}
                                                onMouseOver={e => { e.currentTarget.style.background = '#d97706' }}
                                                onMouseOut={e => { e.currentTarget.style.background = '#f59e0b' }}
                                            >
                                                <Edit2 size={14} /> Reabrir Pedido
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleCompleteOrder}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: canCompleteOrder ? '#10b981' : '#cbd5e1', color: '#fff', border: 'none', padding: '0.45rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: canCompleteOrder ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                                    onMouseOver={e => { if (canCompleteOrder) e.currentTarget.style.background = '#059669' }}
                                                    onMouseOut={e => { if (canCompleteOrder) e.currentTarget.style.background = '#10b981' }}
                                                    title={canCompleteOrder ? "Concluir Pedido" : "Finalize todos os lotes antes de concluir"}
                                                >
                                                    <CheckCircle2 size={14} /> Concluir Pedido
                                                </button>
                                                <button
                                                    onClick={handleEditOrder}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.45rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseOver={e => { e.currentTarget.style.color = '#0ea5e9'; e.currentTarget.style.borderColor = '#0ea5e9' }}
                                                    onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                                >
                                                    <Edit2 size={14} /> Editar
                                                </button>
                                                <button
                                                    onClick={handleDeleteOrder}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.45rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseOver={e => { e.currentTarget.style.background = '#fef2f2' }}
                                                    onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                                                >
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            </>
                                        )}
                                        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 0.2rem' }} />
                                        <button onClick={() => setSelectedOrderId(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.45rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                                            Limpar Seleção
                                        </button>
                                    </div>
                                </div>

                                {/* Linha 2: Pills horizontais */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        <User size={13} color="#0ea5e9" /> <strong style={{ color: '#334155' }}>Cliente:</strong> {orders.find(o => o.id === selectedOrderId)?.client}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        <User size={13} /> <strong>Solc.:</strong> {orders.find(o => o.id === selectedOrderId)?.requesterName || '-'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        <Calendar size={13} /> <strong>Ped.:</strong> {formatDateForDisplay(orders.find(o => o.id === selectedOrderId)?.orderDate) || '-'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#fffbeb', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                                        <Calendar size={13} color="#f59e0b" /> <strong style={{ color: '#f59e0b' }}>Prev:</strong> {formatDateForDisplay(orders.find(o => o.id === selectedOrderId)?.estimatedCompletionDate) || '-'}
                                    </span>
                                    {orders.find(o => o.id === selectedOrderId)?.receiptImageUrl && (
                                        <button
                                            onClick={() => setImagePreviewUrl(orders.find(o => o.id === selectedOrderId)?.receiptImageUrl)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            <ClipBoard size={13} /> Comprovante
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="kanban-columns">
                                {columns.map(col => {
                                    const currentOrder = orders.find(o => o.id === selectedOrderId)
                                    // Filtramos os batches apenas do pedido selecionado
                                    const colBatches = batches.filter(b => b.status === col.id && b.orderId === selectedOrderId)
                                    const productsItems = currentOrder?.items || []
                                    const isOver = draggedOverCol === col.id

                                    const itemCount = col.id === 'products' ? productsItems.length : colBatches.length

                                    return (
                                        <div
                                            key={col.id}
                                            onDragOver={(e) => handleDragOver(e, col.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                            className="kanban-column"
                                            style={{
                                                background: col.bg,
                                                border: isOver ? `2px dashed ${col.color}` : '2px solid transparent',
                                                boxShadow: isOver ? `0 0 15px ${col.color}33` : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0, gap: '0.5rem' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                                                    {col.icon}
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.title}</span>
                                                </h3>
                                                <span style={{
                                                    background: 'rgba(255,255,255,0.8)',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    color: col.color,
                                                    flexShrink: 0
                                                }}>
                                                    {itemCount}
                                                </span>
                                            </div>

                                            <div className="hide-scrollbar" style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.85rem',
                                                overflowY: 'auto',
                                                flex: 1,
                                                paddingRight: '0.5rem'
                                            }}>
                                                {itemCount === 0 && (
                                                    <div style={{
                                                        padding: '2.5rem 1rem', textAlign: 'center', color: '#8e8e93', fontSize: '0.9rem',
                                                        border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '12px', fontWeight: 500
                                                    }}>
                                                        Vazio nesta etapa
                                                    </div>
                                                )}

                                                {col.id === 'products' ? (
                                                    // Renderização dos Produtos do Pedido
                                                    productsItems.map(item => {
                                                        const isItemComplete = item.quantityCompleted >= item.quantityRequested
                                                        const isDragged = draggedItem?.data?.id === item.id && draggedItem?.type === 'product'

                                                        return (
                                                            <div key={item.id}
                                                                draggable={activeTab !== 'completed'}
                                                                onDragStart={activeTab !== 'completed' ? (e) => handleDragStart(e, item, 'product') : undefined}
                                                                onDragEnd={activeTab !== 'completed' ? () => setDraggedItem(null) : undefined}
                                                                style={{
                                                                    background: '#fff', padding: '1.15rem', borderRadius: '12px',
                                                                    border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.85rem',
                                                                    boxShadow: isDragged ? '0 12px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                                                                    cursor: activeTab === 'completed' ? 'default' : 'grab', display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                                                    opacity: isItemComplete ? 0.6 : (isDragged ? 0.4 : 1),
                                                                    transform: isDragged ? 'scale(0.98)' : 'scale(1)',
                                                                    transition: 'all 0.2s',
                                                                }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                                                                        {item.productName}
                                                                    </h4>
                                                                    {activeTab !== 'completed' && <GripVertical size={16} color="#cbd5e1" className="grip-handle" style={{ flexShrink: 0, cursor: 'grab' }} />}
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                        <span style={{ color: isItemComplete ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                                                            {item.quantityCompleted}
                                                                        </span> / {item.quantityRequested} {item.unit} prontos
                                                                    </div>
                                                                    {!isItemComplete && activeTab !== 'completed' && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenBatchModal(selectedOrderId, item) }}
                                                                            style={{
                                                                                background: '#f1f5f9', color: '#64748b', border: 'none',
                                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                                                                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                                                                                transition: 'background 0.2s',
                                                                            }}
                                                                            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                                                                            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                                                                        >
                                                                            <Package size={12} /> + Lote
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {item.quantityProducedTotal > item.quantityCompleted && item.quantityProducedTotal > 0 && (
                                                                    <div style={{ fontSize: '0.7rem', color: '#0ea5e9', marginTop: '0.1rem', fontWeight: 600 }}>
                                                                        (+ {item.quantityProducedTotal - item.quantityCompleted} {item.unit} em produçao)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    // Renderização dos Lotes Padrões
                                                    colBatches.map(batch => {
                                                        const isDragged = draggedItem?.data?.id === batch.id && draggedItem?.type === 'batch'

                                                        return (
                                                            <div
                                                                key={batch.id}
                                                                draggable={activeTab !== 'completed'}
                                                                onDragStart={activeTab !== 'completed' ? (e) => handleDragStart(e, batch, 'batch') : undefined}
                                                                onDragEnd={activeTab !== 'completed' ? () => setDraggedItem(null) : undefined}
                                                                style={{
                                                                    background: '#fff',
                                                                    padding: '0.85rem',
                                                                    borderRadius: '12px',
                                                                    boxShadow: isDragged ? '0 12px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                                                                    cursor: activeTab === 'completed' ? 'default' : 'grab',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '0.4rem',
                                                                    border: '1px solid rgba(0,0,0,0.05)',
                                                                    opacity: isDragged ? 0.4 : 1,
                                                                    transform: isDragged ? 'scale(0.98)' : 'scale(1)',
                                                                    transition: 'all 0.2s',
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>
                                                                        {batch.productName}
                                                                    </h4>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenDropdownId(openDropdownId === batch.id ? null : batch.id);
                                                                            }}
                                                                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                                        >
                                                                            <List size={18} />
                                                                        </button>
                                                                        {openDropdownId === batch.id && (
                                                                            <>
                                                                                <div
                                                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                                                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                                                                                />
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    top: '100%',
                                                                                    right: '0',
                                                                                    marginTop: '4px',
                                                                                    background: '#fff',
                                                                                    border: '1px solid #e2e8f0',
                                                                                    borderRadius: '8px',
                                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                                    padding: '4px',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    minWidth: '180px',
                                                                                    zIndex: 20
                                                                                }}>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); router.push(`/producao/certificado/${batch.id}`) }}
                                                                                        style={{ background: 'transparent', border: 'none', color: '#1e293b', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textAlign: 'left', width: '100%', borderRadius: '6px' }}
                                                                                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                                    >
                                                                                        <ScrollText size={15} color="#10b981" /> Emitir Certificado
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handlePrintLabel(batch) }}
                                                                                        style={{ background: 'transparent', border: 'none', color: '#1e293b', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textAlign: 'left', width: '100%', borderRadius: '6px' }}
                                                                                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                                    >
                                                                                        <Printer size={15} color="#6366f1" /> Imprimir Etiqueta
                                                                                    </button>
                                                                                    {activeTab !== 'completed' && (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleEditBatch(batch) }}
                                                                                                style={{ background: 'transparent', border: 'none', color: '#1e293b', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textAlign: 'left', width: '100%', borderRadius: '6px' }}
                                                                                                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                                            >
                                                                                                <Edit2 size={15} color="#94a3b8" /> Editar Lote
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteBatch(batch) }}
                                                                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textAlign: 'left', width: '100%', borderRadius: '6px' }}
                                                                                                onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                                                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                                            >
                                                                                                <Trash2 size={15} color="#ef4444" /> Excluir Lote
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {activeTab !== 'completed' && <GripVertical size={16} color="#cbd5e1" className="grip-handle" style={{ flexShrink: 0, cursor: 'grab', marginLeft: '4px' }} />}
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', width: 'fit-content' }}>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1' }}>Lote: {batch.batchNumber}</span>
                                                                    <span style={{ color: '#cbd5e1' }}>|</span>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9' }}>{batch.quantityProduced} {batch.unit}</span>
                                                                </div>

                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0' }}>
                                                                    {batch.manufactureDate && <div><strong>Fab:</strong> {formatDateForDisplay(batch.manufactureDate)}</div>}
                                                                    {batch.expirationDate && <div><strong>Val:</strong> {formatDateForDisplay(batch.expirationDate)}</div>}
                                                                </div>

                                                                {/* BOTOES DE MOVIMENTACAO MOBILE */}
                                                                {activeTab !== 'completed' && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem' }} className="mobile-move-actions">
                                                                        {batch.status === 'done' && (
                                                                            <button onClick={(e) => { e.stopPropagation(); handleMoveBatchStatus(batch, 'in_progress') }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem', borderRadius: '8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}>
                                                                                <ChevronLeft size={16} /> Voltar Lote
                                                                            </button>
                                                                        )}
                                                                        {batch.status === 'in_progress' && (
                                                                            <button onClick={(e) => { e.stopPropagation(); handleMoveBatchStatus(batch, 'done') }} style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#10b981', padding: '0.4rem', borderRadius: '8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 600, cursor: 'pointer' }}>
                                                                                Concluir <ChevronRight size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAL GERENCIAR CATÁLOGO */}
            {isCatalogModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => { setIsCatalogModalOpen(false); setEditingCatalogId(null) }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Layers size={24} color="#0ea5e9" /> Gerenciar Catálogo</h2>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>{editingCatalogId ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: '2 1 200px' }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nome Completo *</label><input type="text" value={newCatalogProduct.name} onChange={e => setNewCatalogProduct({ ...newCatalogProduct, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Ex: Trichoderma asperellum" /></div>
                                <div style={{ flex: '1 1 100px' }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sigla *</label><input type="text" value={newCatalogProduct.acronym} onChange={e => setNewCatalogProduct({ ...newCatalogProduct, acronym: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Ex: TR-A" /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
                                <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Grupo</label>
                                    <select value={newCatalogProduct.type} onChange={e => setNewCatalogProduct({ ...newCatalogProduct, type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                                        <option value="bacteria">Bactéria</option>
                                        <option value="fungus">Fungo</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div style={{ flex: '1 1 100px' }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Validade (Meses)</label><input type="number" value={newCatalogProduct.shelf_life_months} onChange={e => setNewCatalogProduct({ ...newCatalogProduct, shelf_life_months: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                                <div style={{ flex: '1 1 100px' }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }} title="Último numeral gerado (ex: 7). O próximo lote será 08.">Contagem (Lote)</label><input type="number" value={newCatalogProduct.last_sequential_number} onChange={e => setNewCatalogProduct({ ...newCatalogProduct, last_sequential_number: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                                <button onClick={handleSaveCatalogProduct} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, height: '40px' }}>{editingCatalogId ? 'Salvar Edição' : 'Adicionar'}</button>
                                {editingCatalogId && <button onClick={() => { setEditingCatalogId(null); setNewCatalogProduct({ name: '', acronym: '', type: 'bacteria', shelf_life_months: 6, last_sequential_number: 0 }) }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, height: '40px' }}>Cancelar</button>}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Produtos Cadastrados ({catalogProducts.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }} className="hide-scrollbar">
                                {catalogProducts.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name} <span style={{ color: '#0ea5e9', fontSize: '0.9rem', marginLeft: '0.5rem' }}>{p.acronym}</span></div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.type === 'bacteria' ? '🦠 Bactéria' : p.type === 'fungus' ? '🍄 Fungo' : '📦 Outro'} • Validade: {p.shelf_life_months} meses • Contagem atual: {p.last_sequential_number || 0}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => { setEditingCatalogId(p.id); setNewCatalogProduct({ name: p.name, acronym: p.acronym, type: p.type, shelf_life_months: p.shelf_life_months, last_sequential_number: p.last_sequential_number || 0 }) }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteCatalogProduct(p.id)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {catalogProducts.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Nenhum produto cadastrado no catálogo.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NOVO PEDIDO */}
            {
                isOrderModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                            <button onClick={() => { setIsOrderModalOpen(false); setEditingOrderId(null) }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0.5rem' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                {editingOrderId ? 'Editar Pedido' : 'Cadastrar Novo Pedido'}
                            </h2>

                            <div className="form-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <div style={{ flex: '1 1 min-content' }}>
                                    <label>Número do Pedido *</label>
                                    <input type="text" placeholder="Ex: 10045" value={newOrder.orderNumber} onChange={e => setNewOrder({ ...newOrder, orderNumber: e.target.value })} />
                                </div>
                                <div style={{ flex: '2 1 min-content' }}>
                                    <label>Cliente *</label>
                                    <input type="text" placeholder="Nome do Cliente" value={newOrder.client} onChange={e => setNewOrder({ ...newOrder, client: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <div style={{ flex: '2 1 min-content' }}>
                                    <label>Solicitante</label>
                                    <input type="text" placeholder="Quem fez o pedido?" value={newOrder.requesterName} onChange={e => setNewOrder({ ...newOrder, requesterName: e.target.value })} />
                                </div>
                                <div style={{ flex: '1 1 min-content' }}>
                                    <label>Data do Pedido</label>
                                    <input type="date" value={newOrder.orderDate} onChange={e => setNewOrder({ ...newOrder, orderDate: e.target.value })} />
                                </div>
                                <div style={{ flex: '1 1 min-content' }}>
                                    <label>Previsão Conclusão</label>
                                    <input type="date" value={newOrder.estimatedCompletionDate} onChange={e => setNewOrder({ ...newOrder, estimatedCompletionDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Comprovante do Pedido (Opcional)</label>
                                {newOrder.receiptImageUrl && !newOrder.receiptImage && (
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CheckCircle2 size={16} /> Comprovante já anexado. Envie outro para substituir.
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={e => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setNewOrder({ ...newOrder, receiptImage: e.target.files[0] })
                                        }
                                    }}
                                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', background: '#f8fafc' }}
                                />
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Produtos Solicitados</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '2 1 min-content', minWidth: '150px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto</label>
                                        <select value={currentItem.productName} onChange={e => setCurrentItem({ ...currentItem, productName: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                                            <option value="" disabled>Selecione um produto</option>
                                            {catalogProducts.map(cp => (
                                                <option key={cp.id} value={cp.name}>{cp.name} ({cp.acronym})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ flex: '1 1 auto', minWidth: '80px' }}><label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Qtd Total</label><input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                                    <div style={{ flex: '1 1 auto', width: '80px' }}><label style={{ fontSize: '0.75rem', fontWeight: 600 }}>UN</label><select value={currentItem.unit} onChange={e => setCurrentItem({ ...currentItem, unit: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="UN">UN</option><option value="KG">KG</option><option value="LT">LT</option></select></div>
                                    <button onClick={handleAddOrderItem} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%', marginTop: '0.5rem' }}>Add</button>
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
                                <button className="btn btn-secondary" onClick={() => { setIsOrderModalOpen(false); setEditingOrderId(null) }}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSaveOrder}>
                                    {editingOrderId ? 'Salvar Alterações' : 'Cadastrar Pedido'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL NOVO LOTE */}
            {
                isBatchModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                            <button onClick={() => { setIsBatchModalOpen(false); setEditingBatchId(null) }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '0.5rem' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700 }}>
                                {editingBatchId ? 'Editar Lote de Produção' : 'Separar Lote para Produção'}
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Produto: <strong style={{ color: '#1e293b' }}>{newBatch.productName}</strong></p>

                            <div className="form-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '2 1 min-content' }}>
                                    <label>Número do Lote *</label>
                                    <input type="text" placeholder="Ex: Lote 001" value={newBatch.batchNumber} onChange={e => setNewBatch({ ...newBatch, batchNumber: e.target.value })} />
                                </div>
                                <div style={{ flex: '1 1 min-content' }}>
                                    <label>Qtd. Lote *</label>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <input type="number" style={{ border: 'none', borderRadius: 0, width: '100%' }} value={newBatch.quantityProduced} onChange={e => setNewBatch({ ...newBatch, quantityProduced: e.target.value })} />
                                        <span style={{ padding: '0 10px', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{newBatch.unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 min-content' }}><label>Data Fabricação</label><input type="date" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }} value={newBatch.manufactureDate} onChange={e => handleManufactureDateChange(e.target.value, newBatch.productName)} /></div>
                                <div style={{ flex: '1 1 min-content' }}><label>Data Vencimento</label><input type="date" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }} value={newBatch.expirationDate} onChange={e => setNewBatch({ ...newBatch, expirationDate: e.target.value })} /></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-secondary" onClick={() => { setIsBatchModalOpen(false); setEditingBatchId(null) }}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSaveBatch}>
                                    {editingBatchId ? 'Salvar Lote' : 'Gerar Lote no Kanban'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* MODAL PREVIEW IMAGEM */}
            {
                imagePreviewUrl && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                            <button
                                onClick={() => setImagePreviewUrl(null)}
                                style={{ position: 'absolute', top: '-40px', right: 0, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                            <img
                                src={imagePreviewUrl}
                                alt="Comprovante do Pedido"
                                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            />
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <a href={imagePreviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#bae6fd', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                                    ↗ Abrir Original
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
