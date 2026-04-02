import { supabase } from './supabase'

const BUCKET_NAME = 'event-images'

/**
 * Converte uma string Base64 (data:image/...) em um Blob pronto para upload.
 */
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

/**
 * Faz upload de uma imagem (File ou Base64 string) para o Supabase Storage.
 * Retorna a URL pública permanente.
 *
 * @param input — File object do input, ou string Base64 (data:image/...) 
 * @param folder — pasta dentro do bucket (ex: "covers", "gifts", "carousel")
 * @returns URL pública da imagem no Storage
 */
export async function uploadImageToStorage(
    input: File | string,
    folder: string
): Promise<string> {
    // Gerar nome de arquivo único
    const timestamp = Date.now()
    const rand = Math.random().toString(36).substring(2, 8)
    const ext = input instanceof File
        ? input.name.split('.').pop() || 'jpg'
        : 'jpg'
    const filePath = `${folder}/${timestamp}_${rand}.${ext}`

    let blob: Blob
    if (typeof input === 'string') {
        // Se for uma URL HTTP(s), não precisa reuplosar — já é do Storage
        if (input.startsWith('http://') || input.startsWith('https://')) {
            return input
        }
        blob = base64ToBlob(input)
    } else {
        blob = input
    }

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
            contentType: blob.type || 'image/jpeg',
            cacheControl: '31536000', // 1 ano — imutável por nome
            upsert: false
        })

    if (error) {
        console.error('[Storage Upload] Erro:', error)
        throw new Error(`Erro ao enviar imagem: ${error.message}`)
    }

    // Montar URL pública
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

    return urlData.publicUrl
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
