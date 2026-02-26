'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Wand2, Save, X, Loader2 } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'

export default function ImageEditorModal({ isOpen, imageFile, onClose, onSave }) {
    const [imgSrc, setImgSrc] = useState('')
    const [crop, setCrop] = useState()
    const [completedCrop, setCompletedCrop] = useState(null)
    const imgRef = useRef(null)
    const [isProcessingBg, setIsProcessingBg] = useState(false)
    const [isProcessingMessage, setIsProcessingMessage] = useState('')

    useEffect(() => {
        if (imageFile && isOpen) {
            setCrop(undefined)
            const reader = new FileReader()
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
            reader.readAsDataURL(imageFile)
            setIsProcessingBg(false)
        }
    }, [imageFile, isOpen])

    if (!isOpen) return null

    function onImageLoad(e) {
        const { width, height } = e.currentTarget
        if (width && height) {
            const initialCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, undefined, width, height),
                width,
                height
            )
            setCrop(initialCrop)
        }
    }

    const handleRemoveBg = async () => {
        try {
            setIsProcessingBg(true)
            setIsProcessingMessage('Analisando imagem com IA (pode demorar alguns segundos na 1ª vez)...')

            // Apply background removal
            const blob = await removeBackground(imgSrc)

            setIsProcessingMessage('Aplicando transparência...')
            const reader = new FileReader()
            reader.readAsDataURL(blob)
            reader.onloadend = () => {
                setImgSrc(reader.result)
                setIsProcessingBg(false)
                setIsProcessingMessage('')
            }
        } catch (error) {
            console.error('Failed to remove background:', error)
            alert('Falha ao remover fundo. Verifique o console.')
            setIsProcessingBg(false)
            setIsProcessingMessage('')
        }
    }

    const handleSave = async () => {
        if (!imgRef.current) return

        setIsProcessingBg(true)
        setIsProcessingMessage('Salvando recorte...')

        try {
            const image = imgRef.current
            const canvas = document.createElement('canvas')

            // If crop is empty for some reason, take full image
            const targetCrop = completedCrop?.width && completedCrop?.height
                ? completedCrop
                : { x: 0, y: 0, width: image.width, height: image.height, unit: 'px' }

            const scaleX = image.naturalWidth / image.width
            const scaleY = image.naturalHeight / image.height

            canvas.width = targetCrop.width * scaleX
            canvas.height = targetCrop.height * scaleY

            const ctx = canvas.getContext('2d')

            // Disable anti-aliasing to avoid blurring
            ctx.imageSmoothingQuality = 'high'

            ctx.drawImage(
                image,
                targetCrop.x * scaleX,
                targetCrop.y * scaleY,
                targetCrop.width * scaleX,
                targetCrop.height * scaleY,
                0,
                0,
                targetCrop.width * scaleX,
                targetCrop.height * scaleY
            )

            // Convert to blob and send to parent
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas is empty')
                    setIsProcessingBg(false)
                    return
                }

                // Keep the original filename or set as edited.png
                const newFileName = imageFile?.name ? `edited_${imageFile.name}` : 'edited_image.png'
                const newFile = new File([blob], newFileName, { type: 'image/png' })

                onSave(newFile)
                setIsProcessingBg(false)
                setIsProcessingMessage('')
            }, 'image/png', 1)

        } catch (error) {
            console.error('Error saving image:', error)
            setIsProcessingBg(false)
            setIsProcessingMessage('')
        }
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Editor Rápido de Fotos</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Crop Area */}
                <div style={{ flex: 1, overflow: 'hidden', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '15px 15px' }}>

                    {isProcessingBg ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                            <p style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{isProcessingMessage}</p>
                            {isProcessingMessage.includes('IA') && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Os próximos cortes serão bem mais rápidos!</p>}
                        </div>
                    ) : (
                        !!imgSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                style={{ maxHeight: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px', overflow: 'hidden' }}
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop me"
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                    style={{ maxHeight: 'calc(90vh - 180px)', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                                />
                            </ReactCrop>
                        )
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>

                    <button
                        type="button"
                        onClick={handleRemoveBg}
                        disabled={isProcessingBg || !imgSrc}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isProcessingBg ? 'not-allowed' : 'pointer', opacity: isProcessingBg ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                    >
                        <Wand2 size={20} />
                        Remover Fundo (IA)
                    </button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isProcessingBg || !imgSrc}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-color)', color: 'white', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isProcessingBg ? 'not-allowed' : 'pointer', opacity: isProcessingBg ? 0.7 : 1 }}
                        >
                            <Save size={20} />
                            Aplicar e Recortar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
