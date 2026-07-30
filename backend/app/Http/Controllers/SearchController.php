<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\GeneralNote;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        try {
            $request->validate(['q' => 'required|string|max:200']);
            $q = $request->q;
            $userId = $request->user()->id;

            $jobs = Job::where('user_id', $userId)
                ->where('active_status', Job::ACTIVE)
                ->where(function ($query) use ($q) {
                    $lq = mb_strtolower($q);
                    $query->whereRaw('LOWER(company_name) LIKE ?', ["%{$lq}%"])
                        ->orWhereRaw('LOWER(job_title) LIKE ?', ["%{$lq}%"])
                        ->orWhereRaw('LOWER(location) LIKE ?', ["%{$lq}%"]);
                })
                ->limit(5)
                ->get(['id', 'company_name', 'job_title', 'status']);

            $notes = GeneralNote::where('user_id', $userId)
                ->where(function ($query) use ($q) {
                    $lq = mb_strtolower($q);
                    $query->whereRaw('LOWER(title) LIKE ?', ["%{$lq}%"])
                        ->orWhereRaw('LOWER(content) LIKE ?', ["%{$lq}%"]);
                })
                ->limit(5)
                ->get(['id', 'title', 'content', 'category_id']);

            $templates = EmailTemplate::where('user_id', $userId)
                ->where(function ($query) use ($q) {
                    $lq = mb_strtolower($q);
                    $query->whereRaw('LOWER(name) LIKE ?', ["%{$lq}%"])
                        ->orWhereRaw('LOWER(subject) LIKE ?', ["%{$lq}%"]);
                })
                ->limit(3)
                ->get(['id', 'name', 'subject']);

            return response()->json([
                'success' => true,
                'data' => [
                    'jobs' => $jobs,
                    'notes' => $notes,
                    'templates' => $templates,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
