<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobTimelineController extends Controller
{
    // Fixed stage order
    const STAGES = [
        'saved',
        'applied',
        'interview',
        'technical_test',
        'hr_interview',
        'offer',
        'rejected',
    ];

    public function index(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Timeline retrieved successfully.',
                'data'    => $job->timelines,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function advance(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $request->validate([
                'stage'      => ['required', 'string', 'in:' . implode(',', self::STAGES)],
                'stage_date' => ['required', 'date'],
            ]);

            // Upsert — if stage already exists update date, else insert
            $timeline = $job->timelines()->updateOrCreate(
                ['stage'      => $request->stage],
                ['stage_date' => $request->stage_date]
            );

            // Sync job status to match current stage
            $statusMap = [
                'saved'          => 'applied',
                'applied'        => 'applied',
                'interview'      => 'interview',
                'technical_test' => 'interview',
                'hr_interview'   => 'interview',
                'offer'          => 'offer',
                'rejected'       => 'rejected',
            ];

            $job->update(['status' => $statusMap[$request->stage] ?? 'applied']);

            return response()->json([
                'success' => true,
                'message' => 'Stage updated.',
                'data'    => $timeline,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function reset(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            // Delete all stages except saved
            $job->timelines()->where('stage', '!=', 'saved')->delete();

            // Reset job status
            $job->update(['status' => 'applied']);

            return response()->json([
                'success' => true,
                'message' => 'Timeline reset to Saved.',
                'data'    => $job->timelines,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}