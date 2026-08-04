import React, { useCallback, useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  accept?: string
  maxSizeBytes?: number
}

// Backend (documents.py) only accepts: .pdf, .txt, .docx -- and enforces a 10MB cap server-side
export const FileDropzone: React.FC<Props> = ({ onFile, accept = 'pdf|txt|docx', maxSizeBytes = 10 * 1024 * 1024 }) => {
  const [isDrag, setIsDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (accept && !accept.split('|').includes(ext)) {
        alert(`File type not allowed. Accepted: ${accept.replace(/\|/g, ', ')}`)
        return
      }
      if (file.size > maxSizeBytes) {
        alert(`File is too large (max ${(maxSizeBytes / 1024 / 1024).toFixed(1)} MB)`)
        return
      }
      onFile(file)
    },
    [onFile, accept, maxSizeBytes]
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setIsDrag(true) }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setIsDrag(false)}
        onDrop={(e) => { e.preventDefault(); setIsDrag(false); handleFiles(e.dataTransfer.files) }}
        className={`border-dashed border-2 rounded-md p-8 text-center ${isDrag ? 'border-accent' : 'border-slate-200'}`}>
        <p className="text-sm text-slate-600">Drag & drop a file here, or click to browse</p>
        <p className="text-xs text-slate-400 mt-2">Accepted: pdf, txt, docx. Max {(maxSizeBytes / 1024 / 1024).toFixed(0)}MB</p>
        <input ref={inputRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
    </div>
  )
}

export default FileDropzone
