<?php

namespace App\Http\Helpers;

class PaginationHelper
{
    /**
     * Validate and constrain pagination parameters
     *
     * @param int $limit Default limit
     * @param int $min Minimum allowed limit
     * @param int $max Maximum allowed limit
     * @return int Validated limit
     */
    public static function validateLimit(int $limit = 10, int $min = 1, int $max = 100): int
    {
        return min(max($limit, $min), $max);
    }

    /**
     * Validate and constrain page number
     *
     * @param int $page Page number
     * @return int Validated page number
     */
    public static function validatePage(int $page = 1): int
    {
        return max($page, 1);
    }

    /**
     * Validate per_page parameter from request
     *
     * @param mixed $perPage Value from request
     * @param int $default Default value
     * @param int $max Maximum allowed
     * @return int Validated per_page
     */
    public static function validatePerPage($perPage, int $default = 10, int $max = 100): int
    {
        return self::validateLimit((int) $perPage, 1, $max) ?: $default;
    }
}
