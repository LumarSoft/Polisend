'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Copy, CornerDownRight, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError } from '@/lib/api-client'
import type { CodeLinkSource, CodeNode, CodeOrganization, CodeSummary, CodeTree } from '@/types/api/codes'
import { useOwnerCodeTree, useOwnerCodes } from '../hooks/use-owner-codes'
import { useRole } from '../hooks/use-role'
import { HEAD } from './billing-ui'

const CHIP = 'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap'

const SOURCE: Record<CodeLinkSource, { label: string; title: string; classes: string }> = {
  triunfo: {
    label: 'Organizador',
    title: 'Triunfo lo pone como organizador en las pólizas de este código',
    classes: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  },
  organization: {
    label: 'Organización',
    title: 'Está cargado en una organización cuyo código maestro es este',
    classes: 'border-line-2 bg-paper-2 text-ink-3',
  },
}

/** Codes are typed as Triunfo shows them: without leading zeros. */
function cleanCode(value: string) {
  const text = value.trim()
  return /^\d+$/.test(text) ? String(Number(text)) : text.toUpperCase()
}

function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('es-AR')} ${n === 1 ? one : many}`
}

/** Every code in the tree, without repeating the ones reached twice. */
function flatten(nodes: CodeNode[], into = new Set<string>()) {
  for (const node of nodes) {
    into.add(node.code)
    flatten(node.children, into)
  }
  return into
}

function SourceChips({ sources }: { sources: CodeLinkSource[] }) {
  return (
    <>
      {sources.map(source => (
        <span key={source} className={`${CHIP} ${SOURCE[source].classes}`} title={SOURCE[source].title}>
          {SOURCE[source].label}
        </span>
      ))}
    </>
  )
}

function OrganizationLinks({ organizations }: { organizations: Array<CodeOrganization & { isActive?: boolean }> }) {
  if (organizations.length === 0) return <span className="text-muted-foreground">Sin organización</span>
  return (
    <>
      {organizations.map((organization, index) => (
        <span key={organization.id}>
          {index > 0 && ', '}
          <Link
            href={`/admin/organizaciones/${organization.id}`}
            className="text-ink-3 underline-offset-2 hover:underline"
          >
            {organization.name}
          </Link>
          {organization.isActive === false && <span className="text-muted-foreground"> (inactivo)</span>}
        </span>
      ))}
    </>
  )
}

function CodeButton({ code, onOpen }: { code: string; onOpen: (code: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(code)}
      className="font-mono text-[13.5px] font-semibold text-ink underline-offset-2 hover:text-ember-2 hover:underline"
    >
      {code}
    </button>
  )
}

function TreeLevel({ nodes, depth, onOpen }: { nodes: CodeNode[]; depth: number; onOpen: (code: string) => void }) {
  return (
    <ul className={depth > 0 ? 'ml-3 border-l border-line-2 pl-3 sm:ml-5 sm:pl-4' : ''}>
      {nodes.map(node => (
        <li key={node.code} className="py-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {depth > 0 && <CornerDownRight className="size-3.5 shrink-0 text-faint" aria-hidden />}
            <CodeButton code={node.code} onOpen={onOpen} />
            {node.holderName && <span className="text-[13px] text-ink-3">{node.holderName}</span>}
            <SourceChips sources={node.sources} />
            {node.policies !== null && (
              <span className="text-[12px] text-muted-foreground">{plural(node.policies, 'póliza', 'pólizas')}</span>
            )}
            {node.repeated && <span className="text-[12px] text-muted-foreground">· ya figura arriba</span>}
          </div>
          {node.organizations.length > 0 && (
            <div className={`text-[12px] ${depth > 0 ? 'ml-5' : ''}`}>
              <OrganizationLinks organizations={node.organizations} />
            </div>
          )}
          {node.children.length > 0 && <TreeLevel nodes={node.children} depth={depth + 1} onOpen={onOpen} />}
        </li>
      ))}
    </ul>
  )
}

function TreeCard({ tree, onOpen }: { tree: CodeTree; onOpen: (code: string) => void }) {
  const copy = async () => {
    const codes = [...flatten(tree.dependents)].join(', ')
    try {
      await navigator.clipboard.writeText(codes)
      toast.success('Códigos copiados')
    } catch {
      toast.error('No se pudieron copiar los códigos')
    }
  }

  return (
    <Card className="gap-0 overflow-hidden border-line-2 py-0 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-2 px-5 py-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-[20px] font-semibold text-ink">{tree.code}</span>
            <span className="text-[14px] text-ink-3">{tree.holderName ?? 'Sin titular cargado'}</span>
          </div>
          <div className="text-[13px]">
            <OrganizationLinks organizations={tree.organizations} />
            {tree.masterOf.length > 0 && (
              <span className="text-muted-foreground">
                {' '}
                · código maestro de {tree.masterOf.map(organization => organization.name).join(', ')}
              </span>
            )}
            <span className="text-muted-foreground">
              {' '}
              · {plural(tree.policies, 'póliza propia', 'pólizas propias')}
            </span>
          </div>
          {tree.parents.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
              Depende de
              {tree.parents.map(parent => (
                <span key={parent.code} className="inline-flex items-center gap-1.5">
                  <CodeButton code={parent.code} onOpen={onOpen} />
                  {parent.holderName && <span className="text-ink-3">{parent.holderName}</span>}
                  <SourceChips sources={parent.sources} />
                </span>
              ))}
            </div>
          )}
        </div>
        {tree.dependentCount > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={copy} className="h-9 text-[12.5px]">
            <Copy className="size-4" />
            Copiar códigos
          </Button>
        )}
      </div>
      <div className="px-5 py-4">
        <div className="mb-2 text-[13px] font-medium text-ink">
          {tree.dependentCount === 0
            ? 'Ningún código depende de este.'
            : `${plural(tree.dependentCount, 'código depende', 'códigos dependen')} de este`}
        </div>
        {tree.dependents.length > 0 && <TreeLevel nodes={tree.dependents} depth={0} onOpen={onOpen} />}
      </div>
    </Card>
  )
}

function SummaryTable({ codes, onOpen }: { codes: CodeSummary[]; onOpen: (code: string) => void }) {
  return (
    <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-line-2 hover:bg-transparent">
            <TableHead className={`h-10 pl-5 ${HEAD}`}>Código</TableHead>
            <TableHead className={`hidden md:table-cell ${HEAD}`}>Organización</TableHead>
            <TableHead className={`text-right ${HEAD}`}>Directos</TableHead>
            <TableHead className={`pr-5 text-right ${HEAD}`}>En total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map(summary => (
            <TableRow key={summary.code} className="cursor-pointer" onClick={() => onOpen(summary.code)}>
              <TableCell className="whitespace-normal pl-5">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-mono text-[13.5px] font-semibold text-ink">{summary.code}</span>
                  {!summary.isRoot && <span className="text-[11.5px] text-muted-foreground">depende de otro</span>}
                </div>
                <div className="text-[12.5px] text-ink-3">{summary.holderName ?? 'Sin titular cargado'}</div>
                <div className="text-[12px] text-muted-foreground md:hidden">
                  {summary.organizations.map(organization => organization.name).join(', ') || 'Sin organización'}
                </div>
              </TableCell>
              <TableCell className="hidden whitespace-normal text-[13px] text-ink-3 md:table-cell">
                {summary.organizations.map(organization => organization.name).join(', ') || (
                  <span className="text-muted-foreground">Sin organización</span>
                )}
              </TableCell>
              <TableCell className="text-right text-[13px] tabular-nums text-ink-3">
                {summary.directDependents}
              </TableCell>
              <TableCell className="pr-5 text-right text-[13px] font-medium tabular-nums text-ink">
                {summary.dependentCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

/** "Códigos": the owner looks up a Triunfo code and sees every code that depends on it. */
export function CodigosView() {
  const { isOwner, isLoading: roleLoading } = useRole()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selected = searchParams.get('codigo')
  const [draft, setDraft] = useState(selected ?? '')
  const [shown, setShown] = useState(selected)
  const list = useOwnerCodes(isOwner)
  const tree = useOwnerCodeTree(isOwner ? selected : null)

  // The field follows the URL when a code is opened from the tree or the browser goes back.
  if (shown !== selected) {
    setShown(selected)
    setDraft(selected ?? '')
  }

  const open = (code: string | null) => {
    router.replace(code ? `${pathname}?codigo=${encodeURIComponent(code)}` : pathname, { scroll: false })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const code = cleanCode(draft)
    if (!/^[0-9A-Za-z]{1,20}$/.test(code)) {
      toast.error('Escribí un código de Triunfo: solo letras y números')
      return
    }
    open(code)
  }

  if (!roleLoading && !isOwner) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <p className="text-[14px] text-muted-foreground">Acceso restringido.</p>
      </div>
    )
  }

  const notFound = tree.error instanceof ApiError && tree.error.status === 404

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6 max-w-2xl">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Plataforma</div>
        <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Códigos</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Consultá un código de Triunfo y mirá todos los que dependen de él, en todas las organizaciones. Sale de dos
          lados: el organizador que Triunfo pone en cada póliza de la cartera, y los códigos que cada organización tiene
          cargados debajo de su código maestro. Solo se conoce lo que trajo la cartera de alguna organización.
        </p>
      </div>

      <form onSubmit={submit} className="mb-6 flex max-w-md gap-2">
        <Input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Código, por ejemplo 8074"
          inputMode="text"
          aria-label="Código de Triunfo"
          className="h-9 font-mono"
        />
        <Button type="submit" size="sm" className="h-9 text-[12.5px]" disabled={tree.isFetching}>
          {tree.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Consultar
        </Button>
        {selected && (
          <Button type="button" size="sm" variant="ghost" className="h-9 text-[12.5px]" onClick={() => open(null)}>
            Limpiar
          </Button>
        )}
      </form>

      {selected && (
        <section className="mb-10">
          {tree.isLoading && <Skeleton className="h-[220px] rounded-xl" />}
          {notFound && (
            <p className="text-[14px] text-muted-foreground">
              El código {selected} no está cargado en ninguna organización ni aparece en ninguna póliza.
            </p>
          )}
          {tree.isError && !notFound && <p className="text-[14px] text-destructive">No se pudo consultar el código.</p>}
          {tree.data && <TreeCard tree={tree.data} onOpen={open} />}
        </section>
      )}

      <section>
        <h2 className="mb-1 font-display text-[20px] tracking-[-0.02em] text-ink">Códigos con dependientes</h2>
        <p className="mb-3 text-[13px] text-muted-foreground">
          Primero los que no dependen de nadie. Tocá uno para ver su árbol.
        </p>
        {list.isError && <p className="text-[14px] text-destructive">No se pudieron cargar los códigos.</p>}
        {(roleLoading || list.isLoading) && <Skeleton className="h-[260px] rounded-xl" />}
        {list.data && list.data.length === 0 && (
          <p className="text-[14px] text-muted-foreground">Todavía ningún código tiene otros debajo.</p>
        )}
        {list.data && list.data.length > 0 && <SummaryTable codes={list.data} onOpen={open} />}
      </section>
    </div>
  )
}
