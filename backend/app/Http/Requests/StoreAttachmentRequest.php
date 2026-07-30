<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,xlsx,xls,txt,csv,png,jpg,jpeg,gif,zip',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.max'      => 'File size must not exceed 10MB.',
            'file.mimes'    => 'File type must be one of: pdf, doc, docx, xlsx, csv, txt, png, jpg, jpeg, gif, zip.',
        ];
    }
}
