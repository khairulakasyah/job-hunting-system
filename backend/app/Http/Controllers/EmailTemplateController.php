<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $templates = $request->user()->emailTemplates()
                ->orderBy('name')
                ->get()
                ->map(function ($t) {
                    return [
                        'id'         => $t->id,
                        'name'       => $t->name,
                        'subject'    => $t->subject,
                        'body'       => $t->body,
                        'variables'  => $t->variables,
                        'created_at' => $t->created_at,
                        'updated_at' => $t->updated_at,
                    ];
                });

            return response()->json(['success' => true, 'data' => $templates]);
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
                'name'      => ['required', 'string', 'max:255'],
                'subject'   => ['required', 'string', 'max:255'],
                'body'      => ['required', 'string'],
                'variables' => ['nullable', 'array'],
                'variables.*' => ['string'],
            ]);

            $template = $request->user()->emailTemplates()->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully.',
                'data'    => $template,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        try {
            if ($request->user()->id !== $emailTemplate->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            return response()->json(['success' => true, 'data' => $emailTemplate]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        try {
            if ($request->user()->id !== $emailTemplate->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'name'      => ['string', 'max:255'],
                'subject'   => ['string', 'max:255'],
                'body'      => ['string'],
                'variables' => ['nullable', 'array'],
                'variables.*' => ['string'],
            ]);

            $emailTemplate->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully.',
                'data'    => $emailTemplate->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        try {
            if ($request->user()->id !== $emailTemplate->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $emailTemplate->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
