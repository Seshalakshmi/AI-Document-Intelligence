import React from 'react'
import { DocumentChunk } from '@/types'

export const ChunkList: React.FC<{ chunks: DocumentChunk[] }> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) return <div className="text-sm text-slate-500">No chunks available</div>

  return (
    <div className="space-y-3">
      {chunks.map((chunk) => (
        <article key={chunk.id} className="overflow-hidden rounded border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2">
            <div className="text-xs font-medium text-slate-700">Chunk #{chunk.chunk_index}</div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
              {chunk.token_count != null && <span>{chunk.token_count} tokens</span>}
              {chunk.start_char != null && chunk.end_char != null && (
                <span>
                  Characters {chunk.start_char}-{chunk.end_char}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{chunk.content}</div>
        </article>
      ))}
    </div>
  )
}

export default ChunkList
