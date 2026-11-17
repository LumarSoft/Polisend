import { PagePlaceholder } from '@/features/admin/components/page-placeholder'

// Placeholder of the foundation. Owned by the network screens front: it replaces this with "Consumo de la red"
// (plan §6.2: Zona → Principal → Número, month selector, message counts only), built on useNetworkUsage(period).
export default function NetworkUsagePage() {
  return (
    <PagePlaceholder eyebrow="Mi red" title="Consumo de la red">
      Los mensajes de cada número de tu red, por zona y principal.
    </PagePlaceholder>
  )
}
