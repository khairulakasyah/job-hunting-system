<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function coverLetter(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'job_id' => ['required', 'integer', 'exists:jobs,id'],
            ]);

            $job = Job::where('id', $request->job_id)
                ->where('user_id', $request->user()->id)
                ->where('active_status', Job::ACTIVE)
                ->firstOrFail();

            $apiKey = config('services.ai.key');
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI API key is not configured. Set AI_API_KEY in .env',
                ], 500);
            }

            $user = $request->user();
            $profileLines = array_filter([
                $user->target_role ? "Target Role: {$user->target_role}" : null,
                $user->preferred_location ? "Preferred Location: {$user->preferred_location}" : null,
                $user->salary_expectation ? "Salary Expectation: {$user->salary_expectation}" : null,
            ]);
            $profileContext = implode("\n", $profileLines);

            $userPrompt = "Write a professional cover letter for the position of {$job->job_title} at {$job->company_name}.";

            if ($job->job_description) {
                $userPrompt .= "\n\nJob Description:\n{$job->job_description}";
            }

            if ($profileContext) {
                $userPrompt .= "\n\nCandidate Profile:\n{$profileContext}";
            }

            $userPrompt .= "\n\nWrite the cover letter in a professional tone, addressing the hiring manager. Include the candidate's name as {$user->name}. Keep it concise (max 400 words). Format with proper paragraphs.";

            $response = Http::withToken($apiKey)
                ->timeout(60)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.1-8b-instant',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a professional cover letter writer. Write concise, impactful cover letters.'],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'max_tokens' => 800,
                    'temperature' => 0.7,
                ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                $errorMsg = $response->json('error.message') ?? "AI service returned status {$response->status()}";
                return response()->json([
                    'success' => false,
                    'message' => "AI generation failed: {$errorMsg}",
                ], 422);
            }

            $text = $response->json('choices.0.message.content');

            if (!$text) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI returned an empty response. Please try again.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data' => ['cover_letter' => $text],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
