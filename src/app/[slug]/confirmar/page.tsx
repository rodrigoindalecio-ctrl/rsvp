'use client'

import { useParams } from 'next/navigation'
import LayoutWrapper from '../layout-wrapper'
import RSVPContent from './content'

export default function ConfirmarPage() {
    const params = useParams()
    const slug = params.slug as string
    if (!slug) return null

    return (
        <LayoutWrapper>
            <RSVPContent slug={slug} />
        </LayoutWrapper>
    )
}
