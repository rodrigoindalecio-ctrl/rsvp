'use client'

import { useParams } from 'next/navigation'
import LayoutWrapper from '../layout-wrapper'
import PresentsContent from './content'

export default function PresentsPage() {
    const params = useParams()
    const slug = params.slug as string
    if (!slug) return null

    return (
        <LayoutWrapper>
            <PresentsContent slug={slug} />
        </LayoutWrapper>
    )
}
