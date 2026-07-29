<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name'    => ['required', 'string', 'max:255'],
            'job_title'       => ['required', 'string', 'max:255'],
            'location'        => ['required', 'string', 'max:255'],
            'status'          => ['sometimes', 'in:saved,applied,interview,offer,rejected'],
            'url'             => ['nullable', 'url', 'max:500'],
            'job_description' => ['nullable', 'string'],
            'salary'          => ['nullable', 'string', 'max:255'],
            'job_platform'    => ['sometimes', 'in:linkedin,indeed,jobstreet,hiredly'],
            'applied_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required' => 'Company name is required.',
            'job_title.required' => 'Job title is required.',
            'location.required' => 'Location is required.',
        ];
    }
}