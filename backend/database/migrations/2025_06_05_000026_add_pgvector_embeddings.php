<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // pgvector extension will be enabled in Phase 5 (Scale)
        // DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        // Add embedding column to tickets for semantic search
        Schema::table('tickets', function (Blueprint $table) {
            // Vector(768) - matches many embedding models
            // Using text as fallback if vector type not available
            $table->text('embedding_text')->nullable()->comment('Text content used for embedding generation');
        });

        // Add embedding column to knowledge_articles
        Schema::table('knowledge_articles', function (Blueprint $table) {
            $table->text('embedding_text')->nullable();
        });

        // Add embedding column to messages
        Schema::table('messages', function (Blueprint $table) {
            $table->text('embedding_text')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('embedding_text');
        });
        Schema::table('knowledge_articles', function (Blueprint $table) {
            $table->dropColumn('embedding_text');
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('embedding_text');
        });
    }
};