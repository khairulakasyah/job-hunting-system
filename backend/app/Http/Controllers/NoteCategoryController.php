<?php

namespace App\Http\Controllers;

use App\Models\NoteCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $categories = $request->user()->noteCategories()
                ->with('notes')
                ->orderBy('position')
                ->get()
                ->map(function ($cat) {
                    return [
                        'id'        => $cat->id,
                        'name'      => $cat->name,
                        'color'     => $cat->color,
                        'position'  => $cat->position,
                        'notes'     => $cat->notes->map(function ($n) {
                            return [
                                'id'          => $n->id,
                                'title'       => $n->title,
                                'content'     => $n->content,
                                'position'    => $n->position,
                                'category_id' => $n->category_id,
                                'created_at'  => $n->created_at,
                                'updated_at'  => $n->updated_at,
                            ];
                        }),
                    ];
                });

            return response()->json(['success' => true, 'data' => $categories]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'  => ['required', 'string', 'max:255'],
                'color' => ['string', 'max:7'],
            ]);

            $maxPos = $request->user()->noteCategories()->max('position') ?? -1;

            $category = $request->user()->noteCategories()->create([
                'name'     => $validated['name'],
                'color'    => $validated['color'] ?? '#7C3AED',
                'position' => $maxPos + 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category created.',
                'data'    => $category,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, NoteCategory $noteCategory): JsonResponse
    {
        try {
            if ($request->user()->id !== $noteCategory->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'name'     => ['string', 'max:255'],
                'color'    => ['string', 'max:7'],
                'position' => ['integer', 'min:0'],
            ]);

            $noteCategory->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Category updated.',
                'data'    => $noteCategory->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, NoteCategory $noteCategory): JsonResponse
    {
        try {
            if ($request->user()->id !== $noteCategory->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $noteCategory->notes()->delete();
            $noteCategory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
