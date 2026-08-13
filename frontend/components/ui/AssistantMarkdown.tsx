'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AssistantMarkdownProps = {
  content: string
}

export default function AssistantMarkdown({
  content,
}: AssistantMarkdownProps) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden text-sm leading-6 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-xl font-bold text-slate-950 first:mt-0">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-semibold text-slate-950 first:mt-0">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-900 first:mt-0">
              {children}
            </h3>
          ),

          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-900 first:mt-0">
              {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="my-2 break-words leading-6 text-slate-700">
              {children}
            </p>
          ),

          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1.5 pl-5">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1.5 pl-5">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="break-words pl-1 leading-6 text-slate-700">
              {children}
            </li>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-slate-950">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="text-slate-600">
              {children}
            </em>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-md border-l-4 border-slate-300 bg-slate-50 px-4 py-2 text-slate-600">
              {children}
            </blockquote>
          ),

          hr: () => (
            <hr className="my-5 border-0 border-t border-slate-200" />
          ),

          table: ({ children }) => (
            <div className="my-4 w-full max-w-full overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[640px] border-collapse bg-white text-left text-sm">
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-slate-50">
              {children}
            </thead>
          ),

          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100">
              {children}
            </tbody>
          ),

          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-slate-50/70">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="px-4 py-3 align-top text-slate-700">
              <div className="max-w-[280px] break-words">
                {children}
              </div>
            </td>
          ),

          code: ({ children, className }) => {
            const isBlock = Boolean(className)

            if (isBlock) {
              return (
                <code className="block whitespace-pre text-xs leading-5 text-slate-100">
                  {children}
                </code>
              )
            }

            return (
              <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800">
                {children}
              </code>
            )
          },

          pre: ({ children }) => (
            <pre className="my-4 max-w-full overflow-x-auto rounded-lg bg-slate-950 p-4">
              {children}
            </pre>
          ),

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}