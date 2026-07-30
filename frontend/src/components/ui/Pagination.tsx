import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  lastPage:    number
  total:       number
  perPage:     number
  onPageChange: (page: number) => void
  perPageValue?: number
  onPerPageChange?: (value: number) => void
}

export function Pagination({ currentPage, lastPage, total, perPage, onPageChange, perPageValue, onPerPageChange }: PaginationProps) {
  if (lastPage <= 1 && !perPageValue) return null

  const from  = (currentPage - 1) * perPage + 1
  const to    = Math.min(currentPage * perPage, total)

  // Build page numbers to show
  const pages: (number | 'dots')[] = []

  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3)              pages.push('dots')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < lastPage - 2)   pages.push('dots')
    pages.push(lastPage)
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-orbit-border">
      {/* Info + per-page */}
        <div className="flex items-center gap-3">
          {onPerPageChange && (
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-medium text-slate-500">Rows</label>
              <select value={perPageValue} onChange={e => onPerPageChange(Number(e.target.value))}
                className="bg-orbit-surface2 border border-orbit-border rounded px-1.5 py-1 text-xs text-slate-200 outline-none focus:border-orbit-primary transition-colors">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
          <p className="text-xs text-slate-500 hidden sm:block">
            Showing <span className="text-slate-300 font-medium">{from}–{to}</span> of{' '}
            <span className="text-slate-300 font-medium">{total}</span>
          </p>
        </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pages.map((page, i) =>
          page === 'dots' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-600 text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors
                ${page === currentPage
                  ? 'bg-orbit-primary text-white'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }
              `}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}