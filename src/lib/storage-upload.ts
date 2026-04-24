/**
 * Faz upload de uma imagem (File ou Base64 string) via API route server-side.
 * Usa a service role para evitar problemas de RLS no Supabase Storage.
 *
 * @param input — File object ou string Base64 (data:image/...)
 * @param folder — pasta dentro do bucket (ex: "covers", "gifts", "carousel")
 * @returns URL pública da imagem no Storage
 */
export async function uploadImageToStorage(
    input: File | string,
    folder: string
): Promise<string> {
    // Se já for uma URL HTTP(s), não precisa re-upload
    if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
        return input
    }

    const formData = new FormData()
    formData.append('folder', folder)

    if (typeof input === 'string') {
        // Converte Base64 para File
        const blob = base64ToBlob(input)
        const file = new File([blob], `image_${Date.now()}.jpg`, { type: blob.type })
        formData.append('file', file)
    } else {
        formData.append('file', input)
    }

    const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP ${res.status} ao enviar imagem`)
    }

    const data = await res.json()
    return data.url as string
}

/**
 * Faz upload de múltiplas imagens em paralelo.
 * Mantém URLs HTTP já existentes sem re-upload.
 */
export async function uploadMultipleImages(
    images: string[],
    folder: string
): Promise<string[]> {
    return Promise.all(
        images.map(img => uploadImageToStorage(img, folder))
    )
}

/**
 * Verifica se uma string é Base64 (começa com data:image/)
 */
export function isBase64Image(str: string): boolean {
    return typeof str === 'string' && str.startsWith('data:image/')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function base64ToBlob(base64: string): Blob {
    const parts = base64.split(',')
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(parts[1])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
}
