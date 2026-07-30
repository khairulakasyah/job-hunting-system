<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobRequest;
use App\Http\Requests\UpdateJobRequest;
use App\Models\Job;
use App\Models\JobTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->jobs()
            ->where('active_status', Job::ACTIVE)
            ->latest();

        if ($request->filled('search')) {
            $search = mb_strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(company_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(job_title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(location) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('platform')) {
            $platforms = explode(',', $request->platform);
            $query->whereIn('job_platform', $platforms);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min(max((int) ($request->per_page ?? 10), 1), 100);
        $jobs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Jobs retrieved successfully.',
            'data' => $jobs,
        ]);
    }

    public function store(StoreJobRequest $request): JsonResponse
    {
        $job = $request->user()->jobs()->create($request->validated());

        $today = now()->toDateString();
        $appliedDate = $request->applied_date ?? $today;

        // Always insert saved
        $job->timelines()->create([
            'stage' => 'saved',
            'stage_date' => $today,
        ]);

        // If status is applied (or any stage beyond saved), also insert applied
        $statusStageMap = [
            'applied' => 'applied',
            'interview' => 'interview',
            'offer' => 'offer',
            'rejected' => 'rejected',
        ];

        if (isset($statusStageMap[$request->status]) && $request->status !== 'saved') {
            $job->timelines()->create([
                'stage' => $statusStageMap[$request->status],
                'stage_date' => $appliedDate,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Job created successfully.',
            'data' => $job,
        ], 201);
    }

    public function show(Request $request, Job $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Permission denied.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Job retrieved successfully.',
            'data' => $job,
        ]);
    }

    public function update(UpdateJobRequest $request, Job $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Permission denied.',
            ], 403);
        }

        $job->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Job updated successfully.',
            'data' => $job,
        ]);
    }

    public function destroy(Request $request, Job $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Permission denied.',
            ], 403);
        }

        // Soft delete � set active_status to 1
        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job deleted successfully.',
        ]);
    }

    public function kanban(Request $request): JsonResponse
    {
        $jobs = $request->user()->jobs()
            ->where('active_status', Job::ACTIVE)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Jobs retrieved successfully.',
            'data' => $jobs,
        ]);
    }

    public function updateStatus(Request $request, Job $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id) {
            return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
        }

        $request->validate([
            'status' => ['required', 'string', 'in:saved,applied,interview,offer,rejected'],
        ]);

        $status = $request->status;
        $job->update(['status' => $status]);

        $timelineStage = $status === 'saved' ? 'saved' : ($status === 'interview' ? 'interview' : $status);
        $job->timelines()->updateOrCreate(
            ['stage' => $timelineStage],
            ['stage_date' => now()->toDateString()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully.',
            'data' => $job,
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer|exists:jobs,id']);

        $request->user()->jobs()->whereIn('id', $request->ids)->delete();

        return response()->json(['success' => true, 'message' => 'Jobs deleted successfully.']);
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:jobs,id',
            'status' => 'required|string|in:saved,applied,interview,offer,rejected',
        ]);

        $request->user()->jobs()->whereIn('id', $request->ids)->update(['status' => $request->status]);

        return response()->json(['success' => true, 'message' => 'Status updated successfully.']);
    }

    public function export(Request $request): StreamedResponse
    {
        $jobs = $request->user()->jobs()
            ->where('active_status', Job::ACTIVE)
            ->orderBy('created_at', 'desc')
            ->get();

        $headers = ['Company Name', 'Job Title', 'Location', 'Salary', 'Platform', 'Status', 'Applied Date', 'URL', 'Created At'];
        $filename = 'jobs-export-' . now()->format('Y-m-d') . '.csv';

        $callback = function () use ($headers, $jobs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($jobs as $job) {
                fputcsv($file, [
                    $job->company_name,
                    $job->job_title,
                    $job->location,
                    $job->salary,
                    $job->job_platform,
                    $job->status,
                    $job->applied_date?->format('Y-m-d') ?? '',
                    $job->url,
                    $job->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return new StreamedResponse($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function platforms(Request $request): JsonResponse
    {
        $platforms = $request->user()->jobs()
            ->where('active_status', Job::ACTIVE)
            ->whereNotNull('job_platform')
            ->distinct()
            ->pluck('job_platform')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $platforms,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $jobs = $request->user()->jobs()->where('active_status', Job::ACTIVE);

        return response()->json([
            'success' => true,
            'message' => 'Stats retrieved successfully.',
            'data' => [
                'total' => (clone $jobs)->count(),
                'applied' => (clone $jobs)->where('status', 'applied')->count(),
                'interview' => (clone $jobs)->where('status', 'interview')->count(),
                'offer' => (clone $jobs)->where('status', 'offer')->count(),
                'rejected' => (clone $jobs)->where('status', 'rejected')->count(),
            ],
        ]);
    }
}
