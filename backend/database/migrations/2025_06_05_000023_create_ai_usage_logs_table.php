<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider');                // ollama, openai, anthropic, gemini
            $table->string('model');                   // qwen3:4b, gpt-4.1, etc
            $table->string('task_type');               // classification, summary, extraction, etc
            $table->integer('input_tokens')->default(0);
            $table->integer('output_tokens')->default(0);
            $table->decimal('estimated_cost', 10, 6)->default(0);
            $table->integer('latency_ms')->default(0);
            $table->string('status')->default('success'); // success, error, rate_limited
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['user_id', 'created_at']);
            $table->index(['provider', 'model']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
    }
};
