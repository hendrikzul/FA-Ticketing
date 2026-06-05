<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('summary_type');               // conversation, ticket, resolution, rca
            $table->text('summary_text');
            $table->jsonb('memory_json')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->index(['conversation_id', 'summary_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_summaries');
    }
};
