<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;

class CheckArticleImages extends Command
{
    protected $signature = 'articles:check-images {--limit=5 : Number of articles to check} {--all : Check all articles}';

    protected $description = 'Check article images and verify file existence';

    public function handle()
    {
        $this->info('Checking Article Images');
        $this->info('=======================');
        $this->newLine();

        try {
            $limit = $this->option('all') ? null : (int) $this->option('limit');
            $query = Article::select(['id', 'title', 'featured_image']);

            if ($limit) {
                $query->take($limit);
            }

            $articles = $query->get();

            if ($articles->isEmpty()) {
                $this->warn('No articles found in database.');

                return Command::SUCCESS;
            }

            $this->info("Checking {$articles->count()} article(s)...");
            $this->newLine();

            $stats = ['total' => 0, 'with_image' => 0, 'exists' => 0, 'missing' => 0];

            foreach ($articles as $article) {
                $stats['total']++;
                $result = $this->displayArticleInfo($article);

                if ($result['has_image']) {
                    $stats['with_image']++;
                    if ($result['exists']) {
                        $stats['exists']++;
                    } else {
                        $stats['missing']++;
                    }
                }
            }

            $this->displayStoragePaths();
            $this->displayStatistics($stats);

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to check articles: '.$e->getMessage());

            return Command::FAILURE;
        }
    }

    private function displayArticleInfo(Article $article): array
    {
        $rawImagePath = $article->getRawOriginal('featured_image');

        $this->line("Article ID: {$article->id}");
        $this->line("Title: {$article->title}");
        $this->line('Featured Image Path: '.($rawImagePath ?: '<fg=yellow>NULL</>'));
        $this->line('Featured Image URL: '.($article->featured_image_url ?: '<fg=yellow>NULL</>'));

        $result = ['has_image' => false, 'exists' => false];

        if ($rawImagePath) {
            $result['has_image'] = true;
            $result['exists'] = $this->checkFileExistence($rawImagePath);
        }

        $this->newLine();

        return $result;
    }

    private function checkFileExistence(string $imagePath): bool
    {
        $fullPath = storage_path('app/public/'.$imagePath);
        $exists = file_exists($fullPath);

        if ($exists) {
            $this->line('File exists locally: <fg=green>YES</>');

            // Check file size
            $size = filesize($fullPath);
            $sizeFormatted = $this->formatBytes($size);
            $this->line("File size: {$sizeFormatted}");
        } else {
            $this->line('File exists locally: <fg=red>NO</>');
            $this->line("Expected path: <fg=yellow>{$fullPath}</>");
        }

        return $exists;
    }

    private function displayStoragePaths(): void
    {
        $this->info('Storage Configuration:');
        $this->line('Storage path: '.storage_path('app/public'));
        $this->line('Public path: '.public_path('storage'));

        // Check if symlink exists
        $symlinkExists = is_link(public_path('storage'));
        $symlinkStatus = $symlinkExists ? '<fg=green>EXISTS</>' : '<fg=red>MISSING</>';
        $this->line("Symlink status: {$symlinkStatus}");

        if (! $symlinkExists) {
            $this->newLine();
            $this->warn('⚠ Storage symlink is missing!');
            $this->line('Run: <fg=cyan>php artisan storage:link</>');
        }

        $this->newLine();
    }

    private function displayStatistics(array $stats): void
    {
        $this->info('Statistics:');
        $this->line("Total articles checked: {$stats['total']}");
        $this->line("Articles with images: {$stats['with_image']}");
        $this->line("Images found: <fg=green>{$stats['exists']}</>");

        if ($stats['missing'] > 0) {
            $this->line("Images missing: <fg=red>{$stats['missing']}</>");
        } else {
            $this->line("Images missing: {$stats['missing']}");
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2).' '.$units[$pow];
    }
}
