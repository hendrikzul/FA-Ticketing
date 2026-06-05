<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('symptoms')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('resolution')->nullable();
            $table->text('prevention')->nullable();
            $table->jsonb('related_ticket_ids')->nullable();
            $table->string('status')->default('draft');    // draft, pending_approval, published, archived
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->jsonb('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_articles');
    }
};
