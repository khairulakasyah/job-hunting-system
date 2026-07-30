<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ScrapeController extends Controller
{
    public function scrape(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'url' => ['required', 'url'],
            ]);

            $scraperUrl = config('services.scraper.url', 'http://scraper:5000');

            try {
                $response = Http::timeout(30)->post("{$scraperUrl}/scrape", [
                    'url' => $request->url,
                ]);
            } catch (ConnectionException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scraper service is not reachable. Make sure the Flask server is running.',
                ], 503);
            }

            if (!$response->successful()) {
                $body = $response->json();
                return response()->json([
                    'success' => false,
                    'message' => $body['message'] ?? 'Scraper service returned an error.',
                ], 422);
            }

            $data = $response->json();

            if (!$data['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Could not scrape this URL.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Job data scraped successfully.',
                'data' => $data['data'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}