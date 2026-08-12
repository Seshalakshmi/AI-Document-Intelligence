// 'use client'
// import React, { use, useState } from 'react'
// import { useAuth } from '@/hooks/useAuth'
// import * as api from '@/lib/api'
// import { Document, DocumentChunk, ExtractedInvoiceData } from '@/types'
// import StatusBadge from '@/components/ui/StatusBadge'
// import ChunkList from '@/components/ui/ChunkList'
// import ConfidenceBadge from '@/components/ui/ConfidenceBadge'
// import ChatPanel from '@/components/ui/ChatPanel'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { Download, FileText, CheckCircle2 } from 'lucide-react'

// export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = use(params)
//   const documentId = Number(id)
//   const { token, user } = useAuth()
//   const queryClient = useQueryClient()
//   const [thumbnailFailed, setThumbnailFailed] = useState(false)

//   const { data: doc, isLoading, isError, error } = useQuery<Document, Error>({
//     queryKey: ['document', documentId, token],
//     queryFn: () => api.getDocument(documentId, token ?? undefined),
//     enabled: !!token,
//     refetchInterval: (query) => {
//       const data = query.state.data
//       if (!data) return 3000
//       return data.status === 'vectorized' || data.status === 'failed' ? false : 3000
//     },
//   })

//   const isSettled = doc?.status === 'vectorized' || doc?.status === 'failed'

//   const { data: chunks } = useQuery<DocumentChunk[], Error>({
//     queryKey: ['document', documentId, 'chunks', token],
//     queryFn: () => api.getDocumentChunks(documentId, token ?? undefined),
//     enabled: !!doc,
//     refetchInterval: isSettled ? false : 5000,
//   })

//   const { data: extracted } = useQuery<ExtractedInvoiceData | null, Error>({
//     queryKey: ['document', documentId, 'extracted', token],
//     queryFn: () => api.getExtractedData(documentId, token ?? undefined),
//     enabled: !!doc,
//     refetchInterval: isSettled ? false : 5000,
//   })

//   // console.log(extracted)

//   const vectorizeMutation = useMutation({
//     mutationFn: () => api.vectorizeDocument(documentId, token ?? undefined),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document', documentId, token] }),
//     onError: (err: unknown) => alert('Vectorization failed: ' + getErrorMessage(err)),
//   })

//   const reviewMutation = useMutation({
//     mutationFn: () => {
//       if (!user) throw new Error('You must be logged in to review a document.')
//       // Sending an empty update object is intentional -- the backend's
//       // review route defaults every field to its current value when the
//       // key is absent, so this only flips is_reviewed + records the
//       // reviewer, without touching any extracted values.
//       return api.reviewInvoiceData(documentId, user.id, {}, token ?? undefined)
//     },
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document', documentId, 'extracted', token] }),
//     onError: (err: unknown) => alert('Marking as reviewed failed: ' + getErrorMessage(err)),
//   })

//   if (isLoading) return <div className="container">Loading…</div>
//   if (isError) return <div className="container text-red-600">{(error as Error)?.message}</div>
//   if (!doc) return <div className="container">Document not found</div>

//   const canVectorize = doc.status === 'chunked' || doc.status === 'vectorized'
//   const showThumbnail = ['.pdf', '.png', '.jpg', '.jpeg'].includes(doc.file_type) && !thumbnailFailed
//   const documentUrl = api.getDocumentDownloadUrl(documentId)

//   return (
//     <div className="container grid grid-cols-3 gap-6">
//       <div className="col-span-2">
//         <div className="border rounded p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-medium">{doc.original_filename}</h3>
//               <div className="text-xs text-slate-500">{doc.file_type} • {doc.file_size ?? '?'} bytes</div>
//             </div>
//             <div className="flex items-center gap-3">
//               <StatusBadge status={doc.status} />
//               {canVectorize && (
//                 <button
//                   onClick={() => vectorizeMutation.mutate()}
//                   disabled={vectorizeMutation.isPending}
//                   className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded disabled:opacity-50"
//                 >
//                   {vectorizeMutation.isPending ? 'Vectorizing…' : doc.status === 'vectorized' ? 'Re-vectorize' : 'Vectorize'}
//                 </button>
//               )}
//             </div>
//           </div>

//           {doc.description && (
//             <p className="mt-3 text-sm text-slate-600 italic">{doc.description}</p>
//           )}

//           {/* <section className="mt-5 space-y-5">
//             <div>
//               <h4 className="text-sm font-medium">Detailed Information</h4>
//               <p className="mt-1 text-xs text-slate-500">Raw extracted data from this document.</p>
//             </div>
            
//             <div>{doc.raw_text ?? 'No text extracted yet.'}</div>
//           </section> */}

//           {/* <details className="mt-4">
//             <summary className="text-sm font-medium cursor-pointer">Raw extracted text</summary>
//             <pre className="mt-2 p-3 bg-slate-50 rounded max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">{doc.raw_text ?? 'No text extracted yet.'}</pre>
//           </details> */}

//           <section className="mt-5 space-y-5">
//             <div>
//               <h4 className="text-sm font-medium">Detailed Information</h4>
//               <p className="mt-1 text-xs text-slate-500">Structured extracted chunks from this document.</p>
//             </div>

//             <ChunkList chunks={chunks ?? []} />
//           </section>
//         </div>

//         <div className="mt-4">
//           <div className="mb-2 text-xs text-slate-500">Global chat searches across all vectorized documents.</div>
//           <ChatPanel />
//         </div>
//       </div>

//       <aside className="space-y-4">
//         {/* Metadata */}
//         <div className="border rounded p-4">
//           <h4 className="text-sm font-medium">Metadata</h4>
//           <div className="mt-2 text-sm text-slate-600 space-y-1">
//             <div>Uploaded: {new Date(doc.created_at).toLocaleString()}</div>
//           </div>
//         </div>

//         {/* Extracted invoice data -- small clean table */}
//         <div className="border rounded p-4">
//           <div className="flex items-center justify-between">
//             <h5 className="text-sm font-medium">Extracted Invoice Data</h5>
//             {extracted?.is_reviewed && (
//               <span className="inline-flex items-center gap-1 text-xs text-green-700">
//                 <CheckCircle2 size={14} /> Reviewed
//               </span>
//             )}
//           </div>

//           {extracted ? (
//             <>
//               <table className="w-full mt-3 text-sm border-collapse">
//                 <tbody>
//                   {[
//                     ['Supplier', extracted.supplier_name],
//                     ['Invoice #', extracted.invoice_number],
//                     ['Invoice date', extracted.invoice_date],
//                     ['Subtotal', extracted.subtotal != null ? `${extracted.subtotal} ${extracted.currency ?? ''}` : null],
//                     ['Tax', extracted.tax_amount != null ? `${extracted.tax_amount} ${extracted.currency ?? ''}` : null],
//                     ['Total', extracted.total_amount != null ? `${extracted.total_amount} ${extracted.currency ?? ''}` : null],
//                     ['Payment terms', extracted.payment_terms],
//                   ].map(([label, value]) => (
//                     <tr key={label} className="border-b last:border-0">
//                       <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{label}</td>
//                       <td className="py-1.5 text-right font-medium">{value ?? '—'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               <div className="mt-3 flex items-center justify-between">
//                 {!extracted.is_reviewed && <ConfidenceBadge value={extracted.confidence_score} />}
//                 {!extracted.is_reviewed && (
//                   <button
//                     onClick={() => reviewMutation.mutate()}
//                     disabled={reviewMutation.isPending}
//                     className="
//                       rounded-md
//                       bg-white
//                       px-3.5
//                       py-2.5
//                       text-sm
//                       font-semibold
//                       text-gray-900
//                       shadow-xs
//                       transition-colors
//                       hover:bg-gray-100
//                       focus-visible:outline-2
//                       focus-visible:outline-offset-2
//                       focus-visible:outline-white
//                       disabled:cursor-not-allowed
//                       disabled:opacity-50
//                       disabled:hover:bg-white
//                     "
//                   >
//                     {reviewMutation.isPending ? "Marking…" : "Mark as Reviewed"}
//                   </button>
//                 )}
//               </div>
//               {extracted.is_reviewed && extracted.reviewed_at && (
//                 <div className="mt-2 text-xs text-slate-400">
//                   Reviewed {new Date(extracted.reviewed_at).toLocaleString()}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="text-sm text-slate-500 mt-2">No extracted data available yet.</div>
//           )}
//         </div>

//         {/* Preview + download */}
//         <div className="border rounded p-4">
//           <div className="aspect-[3/4] bg-slate-50 rounded flex items-center justify-center overflow-hidden">
//             {showThumbnail ? (
//               <img
//                 src={api.getDocumentThumbnailUrl(documentId)}
//                 alt={`${doc.original_filename} preview`}
//                 className="w-full h-full object-contain"
//                 onError={() => setThumbnailFailed(true)}
//               />
//             ) : (
//               <FileText size={48} className="text-slate-300" />
//             )}
//           </div>
//           <a
//             href={documentUrl}
//             download={doc.original_filename}
//             className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 border rounded text-sm font-medium hover:bg-slate-50"
//           >
//             <Download size={14} />
//             Download original
//           </a>
//         </div>

//       </aside>
//     </div>
//   )
// }

// function getErrorMessage(error: unknown) {
//   return error instanceof Error ? error.message : 'Unknown error'
// }


'use client'

import React, { use, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import {
  Document,
  DocumentChunk,
  ExtractedInvoiceData,
} from '@/types'

import StatusBadge from '@/components/ui/StatusBadge'
import ChunkList from '@/components/ui/ChunkList'
import ConfidenceBadge from '@/components/ui/ConfidenceBadge'
import ChatPanel from '@/components/ui/ChatPanel'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Download,
  FileText,
  CheckCircle2,
} from 'lucide-react'

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const documentId = Number(id)

  const { token, user } = useAuth()

  const queryClient = useQueryClient()

  const [thumbnailFailed, setThumbnailFailed] = useState(false)

  /*
   * =========================================================
   * Document
   * =========================================================
   */

  const {
    data: doc,
    isLoading,
    isError,
    error,
  } = useQuery<Document, Error>({
    queryKey: ['document', documentId, token],

    queryFn: () =>
      api.getDocument(
        documentId,
        token ?? undefined
      ),

    enabled: !!token,

    refetchInterval: (query) => {
      const data = query.state.data

      if (!data) return 3000

      return data.status === 'vectorized' ||
        data.status === 'failed'
        ? false
        : 3000
    },
  })

  /*
   * =========================================================
   * Document status
   * =========================================================
   */

  const isSettled =
    doc?.status === 'vectorized' ||
    doc?.status === 'failed'

  /*
   * =========================================================
   * Chunks
   * =========================================================
   */

  const {
    data: chunks,
  } = useQuery<DocumentChunk[], Error>({
    queryKey: [
      'document',
      documentId,
      'chunks',
      token,
    ],

    queryFn: () =>
      api.getDocumentChunks(
        documentId,
        token ?? undefined
      ),

    enabled: !!doc,

    refetchInterval: isSettled
      ? false
      : 5000,
  })

  /*
   * =========================================================
   * Extracted invoice data
   *
   * This is the authoritative invoice data.
   * ChunkList receives this same object so it does not
   * independently guess invoice values from raw chunk text.
   * =========================================================
   */

  const {
    data: extracted,
  } = useQuery<ExtractedInvoiceData | null, Error>({
    queryKey: [
      'document',
      documentId,
      'extracted',
      token,
    ],

    queryFn: () =>
      api.getExtractedData(
        documentId,
        token ?? undefined
      ),

    enabled: !!doc,

    refetchInterval: isSettled
      ? false
      : 5000,
  })

  /*
   * =========================================================
   * Vectorize mutation
   * =========================================================
   */

  const vectorizeMutation = useMutation({
    mutationFn: () =>
      api.vectorizeDocument(
        documentId,
        token ?? undefined
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'document',
          documentId,
          token,
        ],
      })
    },

    onError: (err: unknown) =>
      alert(
        'Vectorization failed: ' +
          getErrorMessage(err)
      ),
  })

  /*
   * =========================================================
   * Review mutation
   * =========================================================
   */

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!user) {
        throw new Error(
          'You must be logged in to review a document.'
        )
      }

      /*
       * Sending an empty update object is intentional.
       *
       * The backend review route keeps the current extracted
       * values and only changes the review state.
       */

      return api.reviewInvoiceData(
        documentId,
        user.id,
        {},
        token ?? undefined
      )
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'document',
          documentId,
          'extracted',
          token,
        ],
      })
    },

    onError: (err: unknown) =>
      alert(
        'Marking as reviewed failed: ' +
          getErrorMessage(err)
      ),
  })

  /*
   * =========================================================
   * Loading / errors
   * =========================================================
   */

  if (isLoading) {
    return (
      <div className="container">
        Loading…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container text-red-600">
        {(error as Error)?.message}
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="container">
        Document not found
      </div>
    )
  }

  /*
   * =========================================================
   * Display helpers
   * =========================================================
   */

  const canVectorize =
    doc.status === 'chunked' ||
    doc.status === 'vectorized'

  const showThumbnail =
    [
      '.pdf',
      '.png',
      '.jpg',
      '.jpeg',
    ].includes(doc.file_type) &&
    !thumbnailFailed

  const documentUrl =
    api.getDocumentDownloadUrl(documentId)

  /*
   * =========================================================
   * Render
   * =========================================================
   */

  return (
    <div className="container grid grid-cols-3 gap-6">

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="col-span-2">

        <div className="border rounded p-4">

          {/* -------------------------------------------------
              Document header
          ------------------------------------------------- */}

          <div className="flex items-center justify-between">

            <div>

              <h3 className="text-lg font-medium">
                {doc.original_filename}
              </h3>

              <div className="text-xs text-slate-500">
                {doc.file_type} •{' '}
                {doc.file_size ?? '?'} bytes
              </div>

            </div>

            <div className="flex items-center gap-3">

              <StatusBadge
                status={doc.status}
              />

              {canVectorize && (
                <button
                  onClick={() =>
                    vectorizeMutation.mutate()
                  }
                  disabled={
                    vectorizeMutation.isPending
                  }
                  className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded disabled:opacity-50"
                >
                  {vectorizeMutation.isPending
                    ? 'Vectorizing…'
                    : doc.status === 'vectorized'
                      ? 'Re-vectorize'
                      : 'Vectorize'}
                </button>
              )}

            </div>

          </div>

          {/* -------------------------------------------------
              Description
          ------------------------------------------------- */}

          {doc.description && (
            <p className="mt-3 text-sm text-slate-600 italic">
              {doc.description}
            </p>
          )}

          {/* -------------------------------------------------
              Detailed Information
          ------------------------------------------------- */}

          <section className="mt-5 space-y-5">

            <div>

              <h4 className="text-sm font-medium">
                Detailed Information
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Structured extracted chunks from this document.
              </p>

            </div>

            {/*
             * IMPORTANT:
             *
             * chunks = raw chunk data
             * extracted = authoritative invoice data
             *
             * ChunkList now uses extracted instead of trying
             * to parse invoice values from chunk.content.
             */}

            <ChunkList
              chunks={chunks ?? []}
              extracted={extracted}
            />

          </section>

        </div>

        {/* ---------------------------------------------------
            Global Chat
        --------------------------------------------------- */}

        <div className="mt-4">

          <div className="mb-2 text-xs text-slate-500">
            Global chat searches across all vectorized documents.
          </div>

          <ChatPanel />

        </div>

      </div>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="space-y-4">

        {/* ---------------------------------------------------
            Metadata
        --------------------------------------------------- */}

        <div className="border rounded p-4">

          <h4 className="text-sm font-medium">
            Metadata
          </h4>

          <div className="mt-2 text-sm text-slate-600 space-y-1">

            <div>
              Uploaded:{' '}
              {new Date(
                doc.created_at
              ).toLocaleString()}
            </div>

          </div>

        </div>

        {/* ---------------------------------------------------
            Extracted Invoice Data
        --------------------------------------------------- */}

        <div className="border rounded p-4">

          <div className="flex items-center justify-between">

            <h5 className="text-sm font-medium">
              Extracted Invoice Data
            </h5>

            {extracted?.is_reviewed && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 size={14} />
                Reviewed
              </span>
            )}

          </div>

          {extracted ? (
            <>

              <table className="w-full mt-3 text-sm border-collapse">

                <tbody>

                  {[
                    [
                      'Supplier',
                      extracted.supplier_name,
                    ],

                    [
                      'Invoice #',
                      extracted.invoice_number,
                    ],

                    [
                      'Invoice date',
                      extracted.invoice_date,
                    ],

                    [
                      'Subtotal',
                      extracted.subtotal != null
                        ? `${extracted.subtotal} ${
                            extracted.currency ?? ''
                          }`
                        : null,
                    ],

                    [
                      'Tax',
                      extracted.tax_amount != null
                        ? `${extracted.tax_amount} ${
                            extracted.currency ?? ''
                          }`
                        : null,
                    ],

                    [
                      'Total',
                      extracted.total_amount != null
                        ? `${extracted.total_amount} ${
                            extracted.currency ?? ''
                          }`
                        : null,
                    ],

                    [
                      'Payment terms',
                      extracted.payment_terms,
                    ],
                  ].map(
                    ([label, value]) => (
                      <tr
                        key={label}
                        className="border-b last:border-0"
                      >

                        <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">
                          {label}
                        </td>

                        <td className="py-1.5 text-right font-medium">
                          {value ?? '—'}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {/* ------------------------------------------------
                  Review controls
              ------------------------------------------------ */}

              <div className="mt-3 flex items-center justify-between">

                {!extracted.is_reviewed && (
                  <ConfidenceBadge
                    value={
                      extracted.confidence_score
                    }
                  />
                )}

                {!extracted.is_reviewed && (
                  <button
                    onClick={() =>
                      reviewMutation.mutate()
                    }
                    disabled={
                      reviewMutation.isPending
                    }
                    className="
                      rounded-md
                      bg-white
                      px-3.5
                      py-2.5
                      text-sm
                      font-semibold
                      text-gray-900
                      shadow-xs
                      transition-colors
                      hover:bg-gray-100
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-white
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      disabled:hover:bg-white
                    "
                  >
                    {reviewMutation.isPending
                      ? 'Marking…'
                      : 'Mark as Reviewed'}
                  </button>
                )}

              </div>

              {/* ------------------------------------------------
                  Reviewed timestamp
              ------------------------------------------------ */}

              {extracted.is_reviewed &&
                extracted.reviewed_at && (
                  <div className="mt-2 text-xs text-slate-400">
                    Reviewed{' '}
                    {new Date(
                      extracted.reviewed_at
                    ).toLocaleString()}
                  </div>
                )}

            </>
          ) : (
            <div className="text-sm text-slate-500 mt-2">
              No extracted data available yet.
            </div>
          )}

        </div>

        {/* ---------------------------------------------------
            Preview + download
        --------------------------------------------------- */}

        <div className="border rounded p-4">

          <div className="aspect-[3/4] bg-slate-50 rounded flex items-center justify-center overflow-hidden">

            {showThumbnail ? (
              <img
                src={api.getDocumentThumbnailUrl(
                  documentId
                )}
                alt={`${doc.original_filename} preview`}
                className="w-full h-full object-contain"
                onError={() =>
                  setThumbnailFailed(true)
                }
              />
            ) : (
              <FileText
                size={48}
                className="text-slate-300"
              />
            )}

          </div>

          <a
            href={documentUrl}
            download={doc.original_filename}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 border rounded text-sm font-medium hover:bg-slate-50"
          >

            <Download size={14} />

            Download original

          </a>

        </div>

      </aside>

    </div>
  )
}

/*
 * ===========================================================
 * Error helper
 * ===========================================================
 */

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unknown error'
}