'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { MessageSquare, RefreshCw, Send } from 'lucide-react'

import { getDocumentComments, postDocumentComment } from '@/lib/api'
import { DocumentComment } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  documentId: number
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
]

function initials(fullname: string) {
  const parts = fullname.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function colorForUser(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length]
}

function Avatar({ userId, fullname }: { userId: number; fullname: string }) {
  return (
    <span
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorForUser(userId)}`}
      title={fullname}
    >
      {initials(fullname) || '?'}
    </span>
  )
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const CommentPanel: React.FC<Props> = ({ documentId }) => {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')

  const queryKey = ['document', documentId, 'comments']

  const {
    data: comments,
    isFetching,
    isLoading,
    refetch,
  } = useQuery<DocumentComment[], Error>({
    queryKey,
    queryFn: () => getDocumentComments(documentId, token ?? undefined),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  })

  const postMutation = useMutation({
    mutationFn: (content: string) => postDocumentComment(documentId, content, token ?? undefined),
    onSuccess: (newComment) => {
      queryClient.setQueryData<DocumentComment[]>(queryKey, (old) => [...(old ?? []), newComment])
      setInput('')
    },
    onError: (err: unknown) => alert('Could not post comment: ' + getErrorMessage(err)),
  })

  function send() {
    const content = input.trim()
    if (!content || postMutation.isPending) return
    postMutation.mutate(content)
  }

  return (
    <div className="panel flex min-h-[360px] min-w-0 flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <MessageSquare size={17} className="text-emerald-600" />
            Comments
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            title="Refresh comments"
            aria-label="Refresh comments"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : undefined} />
          </button>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Flag missing or incorrect extracted text -- visible to everyone on this document.
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4">
        {isLoading && (
          <div className="text-sm text-slate-500">Loading comments…</div>
        )}

        {!isLoading && (comments?.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
            No comments yet. Be the first to flag something.
          </div>
        )}

        {comments?.map((comment) => (
          <div key={comment.id} className="flex min-w-0 gap-2.5">
            <Avatar userId={comment.user_id} fullname={comment.author.fullname} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {comment.author.fullname}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatTimestamp(comment.created_at)}
                </span>
              </div>
              <div className="mt-0.5 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        {user ? (
          <div className="flex min-w-0 gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
              className="input min-w-0 flex-1"
              placeholder="e.g. the total on page 2 wasn't picked up"
              disabled={postMutation.isPending}
            />
            <button
              type="button"
              onClick={send}
              disabled={postMutation.isPending || !input.trim()}
              className="btn btn-primary shrink-0"
            >
              <Send size={16} />
              {postMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500">
            Log in to leave a comment.
          </div>
        )}
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export default CommentPanel
