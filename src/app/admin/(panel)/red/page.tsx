import { PagePlaceholder } from '@/features/admin/components/page-placeholder'

// Placeholder of the foundation. Owned by the network screens front ("Mi red", "Consumo de la red", "Owners y
// zonas", Organizaciones): it replaces this with the Owner's home (plan §6.2), built on useNetworkTree() and
// <NetworkFilter mode="network">.
export default function NetworkPage() {
  return (
    <PagePlaceholder eyebrow="Mi red" title="Mi red">
      Tus zonas, sus principales y sus productores, con lo que pasa en cada uno.
    </PagePlaceholder>
  )
}
