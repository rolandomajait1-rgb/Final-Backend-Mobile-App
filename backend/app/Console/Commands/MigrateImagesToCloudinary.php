<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Services\CloudinaryService;
use Illuminate\Console\Command;

class MigrateImagesToCloudinary extends Command
{
    protected $signature = 'articles:migrate-images-to-cloudinary';

    protected $description = 'Migrate existing local article images to Cloudinary';

    public function __construct(private CloudinaryService $cloudinaryService)
    {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('Starting migration of local images to Cloudinary...');

        // Find all articles with local image paths (not starting with http)
        $articles = Article::whereNotNull('featured_image')
            ->where('featured_image', 'not like', 'http%')
            ->get();

        if ($articles->isEmpty()) {
            $this->info('No local images found to migrate.');

            return 0;
        }

        $this->info("Found {$articles->count()} articles with local images.");

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $bar = $this->output->createProgressBar($articles->count());
        $bar->start();

        foreach ($articles as $article) {
            $localPath = $article->getRawOriginal('featured_image');
            $fullPath = storage_path('app/public/'.$localPath);

            // Check if file exists
            if (! file_exists($fullPath)) {
                $this->newLine();
                $this->warn("Skipping article #{$article->id}: File not found at {$fullPath}");
                $skipped++;
                $bar->advance();

                continue;
            }

            try {
                // Create UploadedFile instance from existing file
                $uploadedFile = new \Illuminate\Http\UploadedFile(
                    $fullPath,
                    basename($fullPath),
                    mime_content_type($fullPath),
                    null,
                    true
                );

                // Upload to Cloudinary
                $cloudinaryUrl = $this->cloudinaryService->uploadImage($uploadedFile);

                // Update article
                $article->update(['featured_image' => $cloudinaryUrl]);

                $migrated++;
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("Failed to migrate article #{$article->id}: {$e->getMessage()}");
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info('Migration Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $migrated],
                ['Skipped (file not found)', $skipped],
                ['Failed', $failed],
                ['Total', $articles->count()],
            ]
        );

        return 0;
    }
}
