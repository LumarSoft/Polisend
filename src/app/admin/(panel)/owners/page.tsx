import { PagePlaceholder } from '@/features/admin/components/page-placeholder'

// Placeholder of the foundation. Owned by the network screens front: it replaces this with the Developer's "Owners y
// zonas" (plan §6.4), built on usePlatformOwners(), usePlatformZones() and their actions (use-platform-structure.ts).
export default function OwnersPage() {
  return (
    <PagePlaceholder eyebrow="Plataforma" title="Owners y zonas">
      Los Owners con sus zonas y su principal propio, y las zonas de la plataforma.
    </PagePlaceholder>
  )
}
