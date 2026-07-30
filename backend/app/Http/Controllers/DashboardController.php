<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Monthly trends
        $monthlyTrends = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->get(['created_at'])
            ->groupBy(fn($j) => $j->created_at->format('Y-m'))
            ->map(fn($g, $m) => ['month' => $m, 'count' => $g->count()])
            ->sortBy('month')
            ->values();

        // Platform breakdown
        $platformBreakdown = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->selectRaw('COALESCE(job_platform, \'other\') as platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get();

        // Status distribution
        $statusDistribution = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        // Upcoming events
        $upcomingEvents = JobTimeline::whereHas('job', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('active_status', Job::ACTIVE);
            })
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '>=', now())
            ->with('job:id,company_name,job_title')
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get()
            ->map(fn($tl) => [
                'id' => $tl->id,
                'job_id' => $tl->job_id,
                'company_name' => $tl->job->company_name,
                'job_title' => $tl->job->job_title,
                'stage' => $tl->stage,
                'scheduled_at' => $tl->scheduled_at,
                'event_type' => $tl->event_type,
                'location' => $tl->location,
                'meeting_link' => $tl->meeting_link,
            ]);

        // Recent activity
        $recentJobs = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->latest()
            ->limit(10)
            ->get(['id', 'company_name', 'job_title', 'status', 'created_at'])
            ->map(fn($j) => [
                'type' => 'job_created',
                'description' => "Added {$j->job_title} at {$j->company_name}",
                'status' => $j->status,
                'created_at' => $j->created_at,
            ]);

        $recentTimelines = JobTimeline::whereHas('job', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('active_status', Job::ACTIVE);
            })
            ->with('job:id,company_name,job_title')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($tl) => [
                'type' => $tl->scheduled_at ? 'event_scheduled' : 'stage_advanced',
                'description' => $tl->scheduled_at
                    ? "{$tl->stage} at {$tl->job->company_name} scheduled"
                    : "Moved {$tl->job->job_title} at {$tl->job->company_name} to {$tl->stage}",
                'status' => $tl->stage,
                'created_at' => $tl->created_at,
            ]);

        $recentActivity = collect($recentJobs)
            ->merge($recentTimelines)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        // ── Analytics ──────────────────────────────────────────────────────

        // Average days per stage transition
        $avgDaysPerStage = [
            'saved_to_applied' => $this->avgDaysBetween($userId, 'saved', 'applied'),
            'applied_to_interview' => $this->avgDaysBetween($userId, 'applied', 'interview'),
            'interview_to_offer' => $this->avgDaysBetween($userId, 'interview', 'offer'),
            'applied_to_rejected' => $this->avgDaysBetween($userId, 'applied', 'rejected'),
        ];

        // Success rate
        $totalJobs = Job::where('user_id', $userId)->where('active_status', Job::ACTIVE)->count();
        $offers = Job::where('user_id', $userId)->where('active_status', Job::ACTIVE)->where('status', 'offer')->count();
        $successRate = $totalJobs > 0 ? round(($offers / $totalJobs) * 100, 1) : 0;

        // Platform success rates
        $platformSuccess = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->selectRaw("COALESCE(job_platform, 'other') as platform, COUNT(*) as total, SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers")
            ->groupBy('platform')
            ->get()
            ->map(fn($p) => [
                'platform' => $p->platform,
                'total' => $p->total,
                'offers' => (int) $p->offers,
                'rate' => $p->total > 0 ? round(((int) $p->offers / $p->total) * 100, 1) : 0,
            ]);

        // Weekly activity distribution
        $dayOrder = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3, 'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];
        $weeklyActivity = JobTimeline::whereHas('job', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('active_status', Job::ACTIVE);
            })
            ->get(['created_at'])
            ->groupBy(fn($t) => $t->created_at->format('l'))
            ->map(fn($g, $day) => ['day_name' => $day, 'count' => $g->count()])
            ->sortBy(fn($item) => $dayOrder[$item['day_name']] ?? 99)
            ->values();

        // Status duration — avg days jobs spend in each status
        $statusDuration = [];
        $stages = ['saved', 'applied', 'interview', 'offer', 'rejected'];

        $allTimelines = JobTimeline::whereHas('job', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('active_status', Job::ACTIVE);
            })
            ->whereIn('stage', $stages)
            ->whereNotNull('stage_date')
            ->get(['id', 'job_id', 'stage', 'stage_date']);

        $grouped = $allTimelines->groupBy('stage');
        $byJob = $allTimelines->groupBy('job_id');

        foreach ($stages as $stage) {
            $timelines = $grouped->get($stage);
            if (!$timelines || $timelines->isEmpty()) {
                $statusDuration[$stage] = null;
                continue;
            }

            $totalDays = $timelines->sum(function ($tl) use ($stage, $stages, $byJob) {
                $date = $tl->stage_date;
                $stageIndex = array_search($stage, $stages);
                $nextStage = $stages[$stageIndex + 1] ?? null;

                if ($nextStage) {
                    $jobTimelines = $byJob->get($tl->job_id);
                    if ($jobTimelines) {
                        $nextTl = $jobTimelines->firstWhere('stage', $nextStage);
                        if ($nextTl && $nextTl->stage_date) {
                            return $date->diffInDays($nextTl->stage_date);
                        }
                    }
                }

                return $date->diffInDays(now());
            });

            $statusDuration[$stage] = round($totalDays / $timelines->count(), 1);
        }

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data retrieved successfully.',
            'data' => [
                'monthly_trends' => $monthlyTrends,
                'platform_breakdown' => $platformBreakdown,
                'status_distribution' => $statusDistribution,
                'upcoming_events' => $upcomingEvents,
                'recent_activity' => $recentActivity,
                'avg_days_per_stage' => $avgDaysPerStage,
                'success_rate' => $successRate,
                'platform_success' => $platformSuccess,
                'weekly_activity' => $weeklyActivity,
                'status_duration' => $statusDuration,
            ],
        ]);
    }

    private function avgDaysBetween(int $userId, string $from, string $to): ?float
    {
        $jobs = Job::where('user_id', $userId)
            ->where('active_status', Job::ACTIVE)
            ->whereHas('timelines', fn($q) => $q->where('stage', $from))
            ->whereHas('timelines', fn($q) => $q->where('stage', $to))
            ->with(['timelines' => fn($q) => $q->whereIn('stage', [$from, $to])])
            ->get();

        if ($jobs->isEmpty()) return null;

        $totalDays = $jobs->sum(function ($job) use ($from, $to) {
            $fromDate = $job->timelines->firstWhere('stage', $from)?->stage_date;
            $toDate = $job->timelines->firstWhere('stage', $to)?->stage_date;
            return $fromDate && $toDate ? $fromDate->diffInDays($toDate) : 0;
        });

        return round($totalDays / $jobs->count(), 1);
    }
}
