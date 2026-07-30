<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Job;
use App\Models\JobTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from' => ['required', 'date'],
                'to'   => ['required', 'date'],
            ]);

            $events = JobTimeline::whereHas('job', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)
                  ->where('active_status', Job::ACTIVE);
            })

            ->whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [$request->from, $request->to])
            ->with('job')
            ->orderBy('scheduled_at')
            ->get()
            ->map(function ($tl) {
                return [
                    'id'           => $tl->id,
                    'title'        => $tl->event_type
                        ? ucwords(str_replace('_', ' ', $tl->event_type)) . ' | ' . $tl->job->company_name
                        : $tl->stage . ' | ' . $tl->job->company_name,
                    'start'        => $tl->scheduled_at,
                    'allDay'       => false,
                    'extendedProps' => [
                        'job_id'       => $tl->job_id,
                        'job_title'    => $tl->job->job_title,
                        'company'      => $tl->job->company_name,
                        'stage'        => $tl->stage,
                        'event_type'   => $tl->event_type,
                        'location'     => $tl->location,
                        'meeting_link' => $tl->meeting_link,
                        'status'       => $tl->job->status,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Events retrieved successfully.',
                'data'    => $events,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        try {
            $job = Job::where('user_id', $request->user()->id)
                ->where('id', $request->job_id)
                ->where('active_status', Job::ACTIVE)
                ->firstOrFail();

            $timeline = $job->timelines()->create([
                'stage'        => $request->stage ?? 'applied',
                'stage_date'   => $request->stage_date ?? now()->toDateString(),
                'event_type'   => $request->event_type,
                'scheduled_at' => $request->scheduled_at,
                'location'     => $request->location,
                'meeting_link' => $request->meeting_link,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Event created successfully.',
                'data'    => $timeline->load('job'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(UpdateEventRequest $request, JobTimeline $timeline): JsonResponse
    {
        try {
            if ($request->user()->id !== $timeline->job()->value('user_id')) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $timeline->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Event updated successfully.',
                'data'    => $timeline->fresh()->load('job'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, JobTimeline $timeline): JsonResponse
    {
        try {
            if ($request->user()->id !== $timeline->job()->value('user_id')) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $timeline->delete();

            return response()->json([
                'success' => true,
                'message' => 'Event deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
