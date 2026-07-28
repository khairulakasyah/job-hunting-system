import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Search, X, Eye } from 'lucide-react'
import { jobService, Job, PaginatedJobs } from '@/services/jobService'
import { JobModal }     from './JobModal'
import { JobViewModal } from './JobViewModal'
import { DeleteModal }  from './DeleteModal'
import { Pagination }   from '@/components/ui/Pagination'
import { StatusBadge }  from '@/components/ui/StatusBadge'

type StatusFilter = '' | 'applied' | 'interview' | 'offer' | 'rejected'

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All',       value: ''          },
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
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [deletingId, setDeletingId]     = useState<number | null>(null)

  // Modals
  const [viewModalOpen, setViewModalOpen]     = useState(false)
  const [editModalOpen, setEditModalOpen]     = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedJob, setSelectedJob]         = useState<Job | null>(null)

  const fetchJobs = useCallback(async (page: number, searchTerm: string, status: StatusFilter) => {
    try {
      setLoading(true)
      const data = await jobService.getAll(page, searchTerm, status)
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
    fetchJobs(currentPage, search, statusFilter)
  }, [currentPage, search, statusFilter, fetchJobs])

  const handlePageChange   = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleStatusFilter = (status: StatusFilter) => { setStatusFilter(status); setCurrentPage(1) }
  const clearSearch        = () => { setSearchInput(''); setSearch(''); setCurrentPage(1) }

  // Open view modal
  const openView = (job: Job) => { setSelectedJob(job); setViewModalOpen(true) }

  // From view → edit
  const openEditFromView = () => { setViewModalOpen(false); setEditModalOpen(true) }

  // From view → delete
  const openDeleteFromView = () => { setViewModalOpen(false); setDeleteModalOpen(true) }

  // Add new
  const openCreate = () => { setSelectedJob(null); setEditModalOpen(true) }

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
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Search + Filter */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by company, job title, or location..."
            className="w-full bg-orbit-surface border border-orbit-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-orbit-surface border border-orbit-border rounded-xl p-1">
          {statusFilters.map(f => (
            <button key={f.value} onClick={() => handleStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === f.value ? 'bg-orbit-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orbit-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-orbit-surface2 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-slate-500" />
            </div>
            {search || statusFilter ? (
              <>
                <p className="text-slate-300 font-medium">No results found</p>
                <p className="text-slate-500 text-sm mt-1 mb-4">Try adjusting your search or filter</p>
                <button onClick={() => { clearSearch(); handleStatusFilter('') }}
                  className="flex items-center gap-2 px-4 py-2 bg-orbit-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-orbit-border transition-colors">
                  <X className="w-4 h-4" /> Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">No jobs yet</p>
                <p className="text-slate-500 text-sm mt-1 mb-4">Start tracking your applications</p>
                <button onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add your first job
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-orbit-border">
                  {['Company', 'Job Title', 'Location', 'Platform', 'Salary', 'Status', 'Date', ''].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orbit-border">
                {jobs.map((job, i) => (
                  <motion.tr key={job.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="hover:bg-white/2 transition-colors">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-orbit-border transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {result && (
              <Pagination currentPage={result.current_page} lastPage={result.last_page}
                total={result.total} perPage={result.per_page} onPageChange={handlePageChange} />
            )}
          </>
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