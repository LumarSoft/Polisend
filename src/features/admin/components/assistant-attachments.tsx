'use client'

import { AlertCircle, FileText, Loader2, X } from 'lucide-react'
import { apiAssetUrl } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { AssistantAttachment } from '@/types/api/assistant'
import type { PendingAttachment } from '../hooks/use-assistant-attachments'

/** "3 págs · 240 KB". */
function fileDetail(file: Pick<AssistantAttachment, 'pages' | 'size'>): string {
  const size =
    file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(file.size / 1024)} KB`
  return file.pages ? `${file.pages} pág${file.pages === 1 ? '' : 's'} · ${size}` : size
}

/** The photos and PDFs a question carried, in its bubble: each opens in a new tab. */
export function MessageAttachments({ files }: { files: AssistantAttachment[] }) {
  if (!files.length) return null
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {files.map(file =>
        file.kind === 'image' ? (
          <a
            key={file.id}
            href={apiAssetUrl(file.url)}
            target="_blank"
            rel="noreferrer"
            title={file.name}
            className="block size-20 overflow-hidden rounded-xl border border-line-2 bg-secondary shadow-xs transition-transform hover:scale-[1.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a signed, expiring API file: not for next/image */}
            <img src={apiAssetUrl(file.url)} alt={file.name} className="size-full object-cover" />
          </a>
        ) : (
          <a
            key={file.id}
            href={apiAssetUrl(file.url)}
            target="_blank"
            rel="noreferrer"
            className="flex max-w-[220px] items-center gap-2 rounded-xl border border-line-2 bg-background px-2.5 py-2 text-left shadow-xs transition-colors hover:border-iris-ring"
          >
            <FileText className="size-5 shrink-0 text-iris-ink" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-ink">{file.name}</span>
              <span className="block text-[12px] text-faint">{fileDetail(file)}</span>
            </span>
          </a>
        ),
      )}
    </div>
  )
}

/** The files waiting in the box to ask: uploading, ready, or why one was refused. */
export function PendingAttachments({
  files,
  onRemove,
}: {
  files: PendingAttachment[]
  onRemove: (key: string) => void
}) {
  if (!files.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 pb-2">
      {files.map(file => (
        <div
          key={file.key}
          title={file.error ?? file.name}
          className={cn(
            'group relative flex h-12 items-center gap-2 rounded-xl border bg-secondary/60 pr-7 text-[12px]',
            file.status === 'error' ? 'border-red-300 pl-2.5 dark:border-red-900' : 'border-line-2',
            file.preview ? 'pl-1' : 'pl-2.5',
          )}
        >
          {file.preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file
            <img src={file.preview} alt="" className="size-10 rounded-lg object-cover" />
          ) : file.status === 'error' ? (
            <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <FileText className="size-4 shrink-0 text-iris-ink" />
          )}
          <span className="flex max-w-[150px] min-w-0 flex-col">
            <span className="truncate font-medium text-ink">{file.name}</span>
            <span
              className={cn(
                'truncate text-[12px]',
                file.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-faint',
              )}
            >
              {file.status === 'uploading'
                ? 'Leyendo…'
                : file.status === 'error'
                  ? file.error
                  : file.attachment
                    ? fileDetail(file.attachment)
                    : ''}
            </span>
          </span>
          {file.status === 'uploading' && <Loader2 className="size-3.5 shrink-0 animate-spin text-faint" />}
          <button
            type="button"
            onClick={() => onRemove(file.key)}
            className="absolute top-1 right-1 grid size-5 place-items-center rounded-full text-faint hover:bg-background hover:text-ink"
          >
            <X className="size-3" />
            <span className="sr-only">Quitar {file.name}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
