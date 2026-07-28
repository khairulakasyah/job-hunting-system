<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobRequest;
use App\Http\Requests\UpdateJobRequest;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->jobs()
            ->where('active_status', 2)
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'ilike', "%{$search}%")
                    ->orWhere('job_title', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $jobs = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Jobs retrieved successfully.',
            'data' => $jobs,
        ]);
    }

    public function store(StoreJobRequest $request): JsonResponse
    {
        $job = $request->user()->jobs()->create($request->validated());

        // Auto-insert saved stage with today's date
        $job->timelines()->create([
            'stage' => 'saved',
            'stage_date' => now()->toDateString(),
        ]);

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

        // Soft delete — set active_status to 1
        $job->update(['active_status' => 1]);

        return response()->json([
            'success' => true,
            'message' => 'Job deleted successfully.',
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $jobs = $request->user()->jobs()->where('active_status', 2);

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