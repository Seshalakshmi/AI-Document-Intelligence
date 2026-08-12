import React, { useCallback, useRef, useState } from 'react'
import { FileUp, UploadCloud } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
  accept?: string
  maxSizeBytes?: number
}

export const FileDropzone: React.FC<Props> = ({
  onFile,
  accept = 'pdf|txt|docx|png|jpg|jpeg',
  maxSizeBytes = 10 * 1024 * 1024,
}) => {
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
        alert(`File is too large. Max ${(maxSizeBytes / 1024 / 1024).toFixed(1)} MB.`)
        return
      }
      onFile(file)
    },
    [onFile, accept, maxSizeBytes]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        setIsDrag(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDrag(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDrag(false)
        handleFiles(event.dataTransfer.files)
      }}
      className={`flex min-h-80 flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
        isDrag ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
        {isDrag ? <UploadCloud size={26} /> : <FileUp size={26} />}
      </div>
      <div className="mt-5 text-base font-semibold text-slate-950">Drop your document here</div>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Drag and drop a file, or click anywhere in this area to browse from your computer.
      </p>
      <div className="mt-5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
        Accepted: {accept.replace(/\|/g, ', ')}. Max {(maxSizeBytes / 1024 / 1024).toFixed(0)}MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}

export default FileDropzone
