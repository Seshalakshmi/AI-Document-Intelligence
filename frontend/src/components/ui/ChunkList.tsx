import React from 'react'
import { DocumentChunk } from '../../types'

export const ChunkList: React.FC<{ chunks: DocumentChunk[] }> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) return <div className="text-sm text-slate-500">No chunks available</div>
  return (
    <ul className="space-y-2">
      {chunks.map((c) => (
        <li key={c.id} className="border rounded p-3 bg-slate-50">
          <div className="text-xs text-slate-500">Chunk #{c.chunk_index}</div>
          <div className="mt-1 text-sm whitespace-pre-wrap">{c.chunk_text}</div>
        </li>
      ))}
    </ul>
  )
}

export default ChunkList
