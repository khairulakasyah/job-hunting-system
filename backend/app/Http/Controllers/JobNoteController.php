<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobNoteController extends Controller
{
    public function index(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $notes = $job->notes()
                ->orderBy('pinned', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($n) {
                    return [
                        'id'         => $n->id,
                        'content'    => $n->content,
                        'pinned'     => $n->pinned,
                        'created_at' => $n->created_at,
                        'updated_at' => $n->updated_at,
                    ];
                });

            return response()->json(['success' => true, 'data' => $notes]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'content' => ['required', 'string', 'max:10000'],
                'pinned'  => ['boolean'],
            ]);

            $note = $job->notes()->create([
                'user_id' => $request->user()->id,
                'content' => $validated['content'],
                'pinned'  => $validated['pinned'] ?? false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Note created successfully.',
                'data'    => [
                    'id'         => $note->id,
                    'content'    => $note->content,
                    'pinned'     => $note->pinned,
                    'created_at' => $note->created_at,
                    'updated_at' => $note->updated_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, JobNote $note): JsonResponse
    {
        try {
            if ($request->user()->id !== $note->job()->value('user_id')) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'content' => ['string', 'max:10000'],
                'pinned'  => ['boolean'],
            ]);

            $note->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Note updated successfully.',
                'data'    => [
                    'id'         => $note->id,
                    'content'    => $note->content,
                    'pinned'     => $note->pinned,
                    'created_at' => $note->created_at,
                    'updated_at' => $note->updated_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, JobNote $note): JsonResponse
    {
        try {
            if ($request->user()->id !== $note->job()->value('user_id')) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $note->delete();

            return response()->json([
                'success' => true,
                'message' => 'Note deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
