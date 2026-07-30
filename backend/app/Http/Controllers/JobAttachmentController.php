<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttachmentRequest;
use App\Models\Job;
use App\Models\JobAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JobAttachmentController extends Controller
{
    public function index(Request $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $attachments = $job->attachments()->orderBy('created_at', 'desc')->get()->map(function ($a) {
                return [
                    'id'         => $a->id,
                    'file_name'  => $a->file_name,
                    'mime_type'  => $a->mime_type,
                    'file_size'  => $a->file_size,
                    'created_at' => $a->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $attachments,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(StoreAttachmentRequest $request, Job $job): JsonResponse
    {
        try {
            if ($request->user()->id !== $job->user_id) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('attachments', 'local');

            $attachment = $job->attachments()->create([
                'user_id'   => $request->user()->id,
                'file_name' => $originalName,
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully.',
                'data'    => [
                    'id'         => $attachment->id,
                    'file_name'  => $attachment->file_name,
                    'mime_type'  => $attachment->mime_type,
                    'file_size'  => $attachment->file_size,
                    'created_at' => $attachment->created_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, JobAttachment $attachment): mixed
    {
        if ($request->user()->id !== $attachment->job()->value('user_id')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        if (!Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    public function destroy(Request $request, JobAttachment $attachment): JsonResponse
    {
        try {
            if ($request->user()->id !== $attachment->job()->value('user_id')) {
                return response()->json(['message' => 'Permission denied.'], 403);
            }

            Storage::disk('local')->delete($attachment->file_path);
            $attachment->delete();

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
