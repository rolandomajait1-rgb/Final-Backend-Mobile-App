<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasColumn('authors', 'name')) {
            Schema::table('authors', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    public function down()
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->string('name')->nullable();
        });
    }
};
