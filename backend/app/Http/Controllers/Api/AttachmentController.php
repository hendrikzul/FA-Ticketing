<?php

namespace App\Http\Controllers\Api;

use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttachmentController extends \App\Http\Controllers\Controller
{
    /**
     * Serve the attachment file.
     */
    public function file(Attachment $attachment, Request $request): BinaryFileResponse
    {
        if (!$request->hasValidSignature()) {
            abort(401, 'Invalid or expired signature.');
        }

        $path = Storage::path($attachment->storage_path);

        if (!file_exists($path)) {
            abort(404, 'File not found.');
        }

        $mime = $attachment->mime_type ?? 'application/octet-stream';
        $isInline = str_starts_with($mime, 'image/') || str_starts_with($mime, 'video/') || $mime === 'application/pdf';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => $isInline ? 'inline' : 'attachment; filename="' . $attachment->filename . '"',
        ]);
    }

}
