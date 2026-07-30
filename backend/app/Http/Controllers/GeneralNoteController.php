<?php

namespace App\Http\Controllers;

use App\Models\GeneralNote;
use App\Models\NoteCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneralNoteController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'category_id' => ['required', 'exists:note_categories,id'],
                'title'       => ['required', 'string', 'max:255'],
                'content'     => ['nullable', 'string'],
            ]);

            $category = NoteCategory::findOrFail($validated['category_id']);
            if ($request->user()->id !== $category->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $maxPos = $category->notes()->max('position') ?? -1;

            $note = $category->notes()->create([
                'user_id'     => $request->user()->id,
                'title'       => $validated['title'],
                'content'     => $validated['content'] ?? '',
                'position'    => $maxPos + 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Note created.',
                'data'    => $note,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, GeneralNote $generalNote): JsonResponse
    {
        try {
            if ($request->user()->id !== $generalNote->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'title'   => ['string', 'max:255'],
                'content' => ['nullable', 'string'],
            ]);

            $generalNote->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Note updated.',
                'data'    => $generalNote->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function move(Request $request, GeneralNote $generalNote): JsonResponse
    {
        try {
            if ($request->user()->id !== $generalNote->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'category_id' => ['required', 'exists:note_categories,id'],
                'position'    => ['required', 'integer', 'min:0'],
            ]);

            $targetCategory = NoteCategory::findOrFail($validated['category_id']);
            if ($request->user()->id !== $targetCategory->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $oldCategoryId = $generalNote->category_id;
            $oldPosition   = $generalNote->position;

            // Re-index old category positions (remove gap)
            GeneralNote::where('category_id', $oldCategoryId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            // Update note
            $generalNote->update([
                'category_id' => $validated['category_id'],
                'position'    => $validated['position'],
            ]);

            // Re-index target category positions (make space / no gaps)
            GeneralNote::where('category_id', $validated['category_id'])
                ->where('id', '!=', $generalNote->id)
                ->where('position', '>=', $validated['position'])
                ->increment('position');

            return response()->json([
                'success' => true,
                'message' => 'Note moved.',
                'data'    => $generalNote->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, GeneralNote $generalNote): JsonResponse
    {
        try {
            if ($request->user()->id !== $generalNote->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $categoryId = $generalNote->category_id;
            $position   = $generalNote->position;

            $generalNote->delete();

            // Re-index positions
            GeneralNote::where('category_id', $categoryId)
                ->where('position', '>', $position)
                ->decrement('position');

            return response()->json([
                'success' => true,
                'message' => 'Note deleted.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
