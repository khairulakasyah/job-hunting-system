<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
        }

        try {
            // Monthly trends — all users
            $monthlyTrends = Job::where('active_status', Job::ACTIVE)
                ->get(['created_at'])
                ->groupBy(fn($j) => $j->created_at->format('Y-m'))
                ->map(fn($g, $m) => ['month' => $m, 'count' => $g->count()])
                ->sortBy('month')
                ->values();

            // Platform breakdown — all users
            $platformBreakdown = Job::where('active_status', Job::ACTIVE)
                ->selectRaw('COALESCE(job_platform, \'other\') as platform, COUNT(*) as count')
                ->groupBy('platform')
                ->get();

            // Status distribution — all users
            $statusDistribution = Job::where('active_status', Job::ACTIVE)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get();

            // Upcoming events — all users
            $upcomingEvents = JobTimeline::whereHas('job', fn($q) => $q->where('active_status', Job::ACTIVE))
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

            // Recent activity — all users
            $recentJobs = Job::where('active_status', Job::ACTIVE)
                ->latest()
                ->limit(10)
                ->get(['id', 'company_name', 'job_title', 'status', 'created_at'])
                ->map(fn($j) => [
                    'type' => 'job_created',
                    'description' => "Added {$j->job_title} at {$j->company_name}",
                    'status' => $j->status,
                    'created_at' => $j->created_at,
                ]);

            $recentTimelines = JobTimeline::whereHas('job', fn($q) => $q->where('active_status', Job::ACTIVE))
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

            // Analytics — all users
            $totalJobs = Job::where('active_status', Job::ACTIVE)->count();
            $offers = Job::where('active_status', Job::ACTIVE)->where('status', 'offer')->count();
            $successRate = $totalJobs > 0 ? round(($offers / $totalJobs) * 100, 1) : 0;

            $platformSuccess = Job::where('active_status', Job::ACTIVE)
                ->selectRaw("COALESCE(job_platform, 'other') as platform, COUNT(*) as total, SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers")
                ->groupBy('platform')
                ->get()
                ->map(fn($p) => [
                    'platform' => $p->platform,
                    'total' => $p->total,
                    'offers' => (int) $p->offers,
                    'rate' => $p->total > 0 ? round(((int) $p->offers / $p->total) * 100, 1) : 0,
                ]);

            $dayOrder = ['Monday' => 0, 'Tuesday' => 1, 'Wednesday' => 2, 'Thursday' => 3, 'Friday' => 4, 'Saturday' => 5, 'Sunday' => 6];
            $weeklyActivity = JobTimeline::whereHas('job', fn($q) => $q->where('active_status', Job::ACTIVE))
                ->get(['created_at'])
                ->groupBy(fn($t) => $t->created_at->format('l'))
                ->map(fn($g, $day) => ['day_name' => $day, 'count' => $g->count()])
                ->sortBy(fn($item) => $dayOrder[$item['day_name']] ?? 99)
                ->values();

            $stages = ['saved', 'applied', 'interview', 'offer', 'rejected'];
            $allTimelines = JobTimeline::whereHas('job', fn($q) => $q->where('active_status', Job::ACTIVE))
                ->whereIn('stage', $stages)
                ->whereNotNull('stage_date')
                ->get(['id', 'job_id', 'stage', 'stage_date']);
            $grouped = $allTimelines->groupBy('stage');
            $byJob = $allTimelines->groupBy('job_id');
            $statusDuration = [];
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

            $avgDaysPerStage = [
                'saved_to_applied' => $this->avgDaysBetween('saved', 'applied'),
                'applied_to_interview' => $this->avgDaysBetween('applied', 'interview'),
                'interview_to_offer' => $this->avgDaysBetween('interview', 'offer'),
                'applied_to_rejected' => $this->avgDaysBetween('applied', 'rejected'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Admin dashboard data retrieved successfully.',
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function services(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
        }

        try {
            $services = [
                $this->check('app', 'Laravel Backend', function () {
                    return [
                        'status' => 'ok',
                        'detail' => sprintf(
                            'env=%s, debug=%s, laravel=%s, php=%s',
                            config('app.env'),
                            config('app.debug') ? 'on' : 'off',
                            app()->version(),
                            PHP_VERSION
                        ),
                    ];
                }),
                $this->check('database', 'Database (PostgreSQL)', function () {
                    $connection = DB::connection();
                    $connection->select('SELECT 1');
                    $migrations = Schema::hasTable('migrations') ? (int) DB::table('migrations')->count() : 0;
                    return [
                        'status' => 'ok',
                        'detail' => sprintf(
                            'driver=%s, database=%s, migrations=%d',
                            $connection->getDriverName(),
                            $connection->getDatabaseName(),
                            $migrations
                        ),
                    ];
                }),
                $this->check('scraper', 'Job Scraper', function () {
                    $url = rtrim((string) config('services.scraper.url', 'http://scraper:5000'), '/');
                    $response = Http::timeout(5)->get("{$url}/health");
                    if (!$response->successful()) {
                        return ['status' => 'error', 'detail' => "GET {$url}/health returned HTTP {$response->status()}"];
                    }
                    return ['status' => 'ok', 'detail' => "GET {$url}/health OK"];
                }),
                $this->check('ai', 'AI Cover Letter (Groq)', function () {
                    $apiKey = config('services.ai.key');
                    if (!$apiKey) {
                        return ['status' => 'unconfigured', 'detail' => 'AI_API_KEY is not configured in the environment.'];
                    }
                    $response = Http::withToken($apiKey)->timeout(5)->get('https://api.groq.com/openai/v1/models');
                    if (!$response->successful()) {
                        return ['status' => 'error', 'detail' => "Groq API returned HTTP {$response->status()}"];
                    }
                    $count = count($response->json('data') ?? []);
                    return ['status' => 'ok', 'detail' => "API key valid — {$count} models available"];
                }),
                $this->check('mail', 'Mail (SMTP)', function () {
                    $mailer = config('mail.default');
                    if ($mailer === 'log') {
                        return ['status' => 'warning', 'detail' => 'Mailer is set to log — emails are not actually sent. Set MAIL_MAILER=smtp to enable.'];
                    }
                    $host = config("mail.mailers.{$mailer}.host");
                    $from = config('mail.from.address');
                    $user = config("mail.mailers.{$mailer}.username");
                    return [
                        'status' => 'ok',
                        'detail' => sprintf('mailer=%s, host=%s, from=%s, auth=%s', $mailer, $host, $from, $user ? 'yes' : 'no'),
                    ];
                }),
                $this->check('frontend', 'Frontend (Vercel)', function () {
                    $url = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
                    $response = Http::timeout(5)->get($url);
                    return ['status' => $response->successful() ? 'ok' : 'error', 'detail' => "GET {$url} returned HTTP {$response->status()}"];
                }),
                $this->check('storage', 'Storage (Attachments)', function () {
                    $testFile = 'healthcheck_' . uniqid() . '.tmp';
                    Storage::disk('local')->put($testFile, 'ok');
                    $exists = Storage::disk('local')->exists($testFile);
                    Storage::disk('local')->delete($testFile);
                    return ['status' => $exists ? 'ok' : 'error', 'detail' => 'disk=local, write test ' . ($exists ? 'passed' : 'failed')];
                }),
            ];

            $statuses = array_column($services, 'status');
            $overall = in_array('error', $statuses, true)
                ? 'error'
                : (in_array('warning', $statuses, true) || in_array('unconfigured', $statuses, true) ? 'degraded' : 'ok');

            return response()->json([
                'success' => true,
                'message' => 'Service status retrieved successfully.',
                'data' => [
                    'checked_at' => now()->toIso8601String(),
                    'overall' => $overall,
                    'services' => $services,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function check(string $key, string $label, callable $callback): array
    {
        $start = microtime(true);
        try {
            $result = $callback();
            return [
                'key' => $key,
                'label' => $label,
                'status' => $result['status'] ?? 'error',
                'latency_ms' => (int) round((microtime(true) - $start) * 1000),
                'detail' => $result['detail'] ?? null,
            ];
        } catch (\Throwable $e) {
            return [
                'key' => $key,
                'label' => $label,
                'status' => 'error',
                'latency_ms' => (int) round((microtime(true) - $start) * 1000),
                'detail' => $e->getMessage(),
            ];
        }
    }

    private function avgDaysBetween(string $from, string $to): ?float
    {
        $jobs = Job::where('active_status', Job::ACTIVE)
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
