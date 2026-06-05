<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('object_type')->nullable();    // ticket, task, incident
            $table->string('title')->nullable();
            $table->string('category')->nullable();
            $table->string('priority')->nullable();        // P1, P2, P3, P4
            $table->string('status')->nullable();          // open, in_progress, resolved, closed
            $table->foreignId('assigned_team_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('current_summary')->nullable();
            $table->jsonb('missing_fields_json')->nullable();
            $table->jsonb('extracted_fields_json')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_states');
    }
};
