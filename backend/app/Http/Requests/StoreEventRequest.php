<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id'       => ['required', 'exists:jobs,id'],
            'stage'        => ['sometimes', 'in:saved,applied,interview,technical_test,hr_interview,offer,rejected'],
            'stage_date'   => ['sometimes', 'date'],
            'event_type'   => ['required', 'string', 'in:interview,follow_up,phone_screen,technical_test,offer_deadline,assessment,networking,other'],
            'scheduled_at' => ['required', 'date'],
            'location'     => ['nullable', 'string', 'max:255'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
        ];
    }
}
