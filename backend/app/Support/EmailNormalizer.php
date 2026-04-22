<?php

namespace App\Support;

class EmailNormalizer
{
    /**
     * Trim, remove all whitespace (common paste/keyboard mistakes), lowercase.
     */
    public static function normalize(?string $email): string
    {
        if ($email === null || $email === '') {
            return '';
        }

        return strtolower(preg_replace('/\s+/u', '', trim($email)));
    }
}
