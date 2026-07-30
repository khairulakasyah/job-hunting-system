<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user()->id),
            ],
            'resume_url'          => ['nullable', 'string', 'max:2048'],
            'portfolio_url'       => ['nullable', 'string', 'max:2048'],
            'linkedin_url'        => ['nullable', 'string', 'max:2048'],
            'github_url'          => ['nullable', 'string', 'max:2048'],
            'preferred_platform'  => ['nullable', 'string', 'max:255'],
            'preferred_location'  => ['nullable', 'string', 'max:255'],
            'salary_expectation'  => ['nullable', 'string', 'max:255'],
            'target_role'         => ['nullable', 'string', 'max:255'],
            'onboarding_completed' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.unique'   => 'This email is already taken.',
        ];
    }
}