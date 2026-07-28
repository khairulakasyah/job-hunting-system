<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ScrapeController extends Controller
{
    public function scrape(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'url'],
        ]);

        $response = Http::timeout(30)->post('http://127.0.0.1:5000/scrape', [
            'url' => $request->url,
        ]);

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Scraper failed. Make sure the Flask server is running.',
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
            'data'    => $data['data'],
        ]);
    }
}