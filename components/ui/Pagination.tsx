import Link from 'next/link'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  basePath: string
  searchParams?: Record<string, string>
}

export function Pagination({ page, pageSize, total, basePath, searchParams = {} }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function buildHref(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) })
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 mt-2">
      <p className="text-sm text-gray-500">
        {from}–{to} sur {total} résultat{total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ← Précédent
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 cursor-not-allowed">
            ← Précédent
          </span>
        )}
        <span className="px-3 py-1.5 text-sm text-gray-500">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Suivant →
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 cursor-not-allowed">
            Suivant →
          </span>
        )}
      </div>
    </div>
  )
}
