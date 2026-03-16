<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // For web login, require laverdad email
        if ($this->is('login')) {
            return [
                'email' => 'required|email|ends_with:@student.laverdad.edu.ph',
                'password' => 'required',
            ];
        }

        // For API login, allow any email
        return [
            'email' => 'required|email',
            'password' => 'required',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.ends_with' => 'Use a laverdad email addresses to access this system.',
        ];
    }
}
