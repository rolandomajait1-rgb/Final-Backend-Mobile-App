<?php

namespace App\Constants;

class UserRole
{
    public const ADMIN = 'admin';
    public const MODERATOR = 'moderator';
    public const EDITOR = 'editor';
    public const AUTHOR = 'author';
    public const SUBSCRIBER = 'subscriber';
    public const USER = 'user';

    public static function all(): array
    {
        return [
            self::ADMIN,
            self::MODERATOR,
            self::EDITOR,
            self::AUTHOR,
            self::SUBSCRIBER,
            self::USER,
        ];
    }

    public static function isValid(string $role): bool
    {
        return in_array($role, self::all(), true);
    }
}
