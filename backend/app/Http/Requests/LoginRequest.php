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
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim($this->email ?? '')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // For web login, require laverdad email (both @laverdad.edu.ph and @student.laverdad.edu.ph)
        if ($this->is('login')) {
            return [
                'email' => ['required', 'email', 'regex:/^[^\s@]+@(student\.)?laverdad\.edu\.ph$/'],
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
            'email.regex' => 'Use a @laverdad.edu.ph or @student.laverdad.edu.ph email address to access this system.',
        ];
    }
}
