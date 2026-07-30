import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Search, X, Eye, Download, Filter, ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { jobService, Job, PaginatedJobs } from '@/services/jobService'
import { JobModal }     from './JobModal'
import { JobViewModal } from './JobViewModal'
import { DeleteModal }  from './DeleteModal'
import { Pagination }   from '@/components/ui/Pagination'
import { StatusBadge }  from '@/components/ui/StatusBadge'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

type StatusFilter = '' | 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All',       value: ''          },
  { label: 'Saved',     value: 'saved'     },
  { label: 'Applied',   value: 'applied'   },
  { label: 'Interview', value: 'interview' },
  { label: 'Offer',     value: 'offer'     },
  { label: 'Rejected',  value: 'rejected'  },
]

export function JobsPage() {
  const [result, setResult]             = useState<PaginatedJobs | null>(null)
  const [jobs, setJobs]                 = useState<Job[]>([])
  const [currentPage, setCurrentPage]   = useState(1)
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [perPage, setPerPage]           = useState(10)
  const [selectedIds, setSelectedIds]   = useState<number[]>([])
  const [showFilters, setShowFilters]   = useState(false)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [deletingId, setDeletingId]     = useState<number | null>(null)
  const [bulkStatus, setBulkStatus]     = useState('')
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])

  // Modals
  const [viewModalOpen, setViewModalOpen]     = useState(false)
  const [editModalOpen, setEditModalOpen]     = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedJob, setSelectedJob]         = useState<Job | null>(null)

  const fetchJobs = useCallback(async (page: number, searchTerm: string, status: StatusFilter, platform?: string, date_from?: string, date_to?: string, perPageVal?: number) => {
    try {
      setLoading(true)
      const data = await jobService.getAll(page, searchTerm, status, undefined, platform, date_from, date_to, perPageVal)
      setResult(data)
      setJobs(data.data)
    } catch {
      setError('Failed to load jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setCurrentPage(1) }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchJobs(currentPage, search, statusFilter, platformFilter || undefined, dateFrom || undefined, dateTo || undefined, perPage)
  }, [currentPage, search, statusFilter, platformFilter, dateFrom, dateTo, perPage, fetchJobs])

  useEffect(() => {
    jobService.getPlatforms().then(setAvailablePlatforms).catch(() => {})
  }, [])

  const handlePageChange   = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleStatusFilter = (status: StatusFilter) => { setStatusFilter(status); setCurrentPage(1) }
  const clearSearch        = () => { setSearchInput(''); setSearch(''); setCurrentPage(1) }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length) { setSelectedIds([]) }
    else { setSelectedIds(jobs.map(j => j.id)) }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    try {
      await jobService.bulkDelete(selectedIds)
      setSelectedIds([])
      await fetchJobs(currentPage, search, statusFilter)
      toast.success(`${selectedIds.length} job${selectedIds.length > 1 ? 's' : ''} deleted`)
    } catch {
      toast.error('Failed to delete selected jobs.')
    }
  }

  const handleBulkStatus = async () => {
    if (!selectedIds.length || !bulkStatus) return
    try {
      await jobService.bulkUpdateStatus(selectedIds, bulkStatus)
      const label = statusFilters.find(f => f.value === bulkStatus)?.label ?? bulkStatus
      setSelectedIds([])
      setBulkStatus('')
      await fetchJobs(currentPage, search, statusFilter)
      toast.success(`Moved ${selectedIds.length} job${selectedIds.length > 1 ? 's' : ''} to ${label}`)
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await jobService.exportCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export jobs.')
    }
  }

  const clearAllFilters = () => {
    setPlatformFilter('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setSearchInput('')
    setSearch('')
    setCurrentPage(1)
  }

  const hasActiveFilters = !!(search || statusFilter || platformFilter || dateFrom || dateTo)

  // Open view modal
  const openView = (job: Job) => { setSelectedJob(job); setViewModalOpen(true) }

  // From view → edit
  const openEditFromView = () => { setViewModalOpen(false); setEditModalOpen(true) }

  // From view → delete
  const openDeleteFromView = () => { setViewModalOpen(false); setDeleteModalOpen(true) }

  // Add new
  const openCreate = () => { setSelectedJob(null); setEditModalOpen(true) }

  useKeyboardShortcuts({
    onNewJob: openCreate,
    onSearch: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onEscape: () => {
      if (viewModalOpen) setViewModalOpen(false)
      if (editModalOpen) setEditModalOpen(false)
      if (deleteModalOpen) setDeleteModalOpen(false)
    },
  })

  const handleDelete = async () => {
    if (!selectedJob) return
    setDeletingId(selectedJob.id)
    try {
      await jobService.delete(selectedJob.id)
      setDeleteModalOpen(false)
      setSelectedJob(null)
      await fetchJobs(currentPage, search, statusFilter)
    } catch {
      setError('Failed to delete job.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {result ? `${result.total} application${result.total !== 1 ? 's' : ''} tracked` : 'Track all your job applications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Job
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Search + Filter */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by company, job title, or location..."
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors" />
            {searchInput && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 flex-wrap">
            {statusFilters.map(f => (
              <button key={f.value} onClick={() => handleStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === f.value ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/10 border-primary/30 text-primary-light' : 'bg-surface border-border text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
            <Filter className="w-3.5 h-3.5" /> Filters
            {hasActiveFilters && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-end gap-3 p-4 bg-surface border border-border rounded-xl">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Platform</label>
              <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setCurrentPage(1) }}
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary transition-colors">
                <option value="">All Platforms</option>
                {availablePlatforms.map(p => (
                  <option key={p} value={p} className="bg-surface text-slate-200">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }}
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }}
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary transition-colors" />
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters}
                className="px-3 py-2 bg-surface2 hover:bg-white/5 text-slate-400 text-xs font-medium rounded-lg border border-border transition-colors">
                Clear
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm text-slate-200 font-medium">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-primary transition-colors">
              <option value="">Change status...</option>
              {statusFilters.filter(f => f.value).map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            {bulkStatus && (
              <button onClick={handleBulkStatus}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors">
                Apply
              </button>
            )}
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-xl">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-4 w-10">
                    <div className="w-3.5 h-3.5 bg-surface2 rounded" />
                  </th>
                  {['Company', 'Job Title', 'Location', 'Platform', 'Salary', 'Status', 'Date', ''].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                      <td key={j} className="px-5 py-4">
                        <div className={`h-4 rounded ${j === 7 ? 'w-12' : 'w-20'} bg-surface2`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-surface2 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-slate-500" />
            </div>
            {search || statusFilter ? (
              <>
                <p className="text-slate-300 font-medium">No results found</p>
                <p className="text-slate-500 text-sm mt-1 mb-4">Try adjusting your search or filter</p>
                <button onClick={() => { clearSearch(); handleStatusFilter('') }}
                  className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors">
                  <X className="w-4 h-4" /> Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">No jobs yet</p>
                <p className="text-slate-500 text-sm mt-1 mb-4">Start tracking your applications</p>
                <button onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add your first job
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-4 w-10">
                    <input type="checkbox" checked={jobs.length > 0 && selectedIds.length === jobs.length}
                      onChange={toggleSelectAll}
                      className="rounded border-border bg-surface2 text-primary w-3.5 h-3.5" />
                  </th>
                  {['Company', 'Job Title', 'Location', 'Platform', 'Salary', 'Status', 'Date', ''].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job, i) => (
                  <motion.tr key={job.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`hover:bg-white/2 transition-colors ${selectedIds.includes(job.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selectedIds.includes(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="rounded border-border bg-surface2 text-primary w-3.5 h-3.5" />
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-200">{job.company_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{job.job_title}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{job.location}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 capitalize">{job.job_platform}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {job.salary}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => openView(job)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-border transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {result && (
              <Pagination currentPage={result.current_page} lastPage={result.last_page}
                total={result.total} perPage={result.per_page} onPageChange={handlePageChange}
                perPageValue={perPage} onPerPageChange={v => { setPerPage(v); setCurrentPage(1) }} />
            )}
          </div>
        )}
      </motion.div>

      {/* View Modal */}
      <JobViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        onEdit={openEditFromView}
        onDelete={openDeleteFromView}
        job={selectedJob}
      />

      {/* Edit/Create Modal */}
      <JobModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => fetchJobs(currentPage, search, statusFilter)}
        job={selectedJob}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false) }}
        onConfirm={handleDelete}
        loading={deletingId !== null}
        jobName={selectedJob ? `${selectedJob.job_title} at ${selectedJob.company_name}` : ''}
      />
    </div>
  )
}