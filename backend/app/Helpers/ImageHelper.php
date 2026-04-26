<?php

namespace App\Helpers;

class ImageHelper
{
    /**
     * Get the La Verdad Herald logo as a base64 data URI
     * 
     * @return string
     */
    public static function getLogoDataUri(): string
    {
        $logoPath = public_path('images/logo.png');
        
        if (!file_exists($logoPath)) {
            return '';
        }
        
        $imageData = base64_encode(file_get_contents($logoPath));
        $mimeType = mime_content_type($logoPath);
        
        return "data:{$mimeType};base64,{$imageData}";
    }
}
