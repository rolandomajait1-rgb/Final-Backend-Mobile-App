<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class FixArticleImages extends Command
{
    protected $signature = 'articles:fix-images {--dry-run : Show what would be done without making changes}';

    protected $description = 'Fix article images by assigning available local images to articles with missing images';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        // Get articles with missing images
        $articles = Article::whereNotNull('featured_image')->get();
        $articlesWithMissingImages = [];

        foreach ($articles as $article) {
            $rawImagePath = $article->getRawOriginal('featured_image');
            $fullPath = storage_path('app/public/'.$rawImagePath);
            if (! file_exists($fullPath)) {
                $articlesWithMissingImages[] = $article;
            }
        }

        if (empty($articlesWithMissingImages)) {
            $this->info('All articles have valid images!');

            return Command::SUCCESS;
        }

        $count = count($articlesWithMissingImages);
        $this->warn("Found {$count} article(s) with missing images");
        $this->newLine();

        // Get available images in storage
        $storagePath = storage_path('app/public/articles');
        if (! File::exists($storagePath)) {
            $this->error('Storage path does not exist: '.$storagePath);

            return Command::FAILURE;
        }

        $availableImages = File::files($storagePath);

        if (empty($availableImages)) {
            $this->error('No images found in storage/app/public/articles');

            return Command::FAILURE;
        }

        $this->info('Found '.count($availableImages).' available images in storage');
        $this->newLine();

        // Assign images
        $fixed = 0;
        foreach ($articlesWithMissingImages as $index => $article) {
            if ($index >= count($availableImages)) {
                break;
            }

            $imageFile = $availableImages[$index];
            $newPath = 'articles/'.$imageFile->getFilename();
            $rawImagePath = $article->getRawOriginal('featured_image');

            $this->line("Article ID {$article->id}: {$article->title}");
            $this->line("  Old: {$rawImagePath}");
            $this->line("  New: {$newPath}");

            if (! $dryRun) {
                $article->featured_image = $newPath;
                $article->save();
                $fixed++;
            }

            $this->newLine();
        }

        if ($dryRun) {
            $count = count($articlesWithMissingImages);
            $this->info("Would fix {$count} article(s)");
            $this->line('Run without --dry-run to apply changes');
        } else {
            $this->info("Fixed {$fixed} article(s)");
        }

        return Command::SUCCESS;
    }
}
