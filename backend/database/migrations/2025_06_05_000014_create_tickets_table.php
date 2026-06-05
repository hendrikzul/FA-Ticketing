<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('ticket_number')->unique();     // TKT-0001
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('priority')->default('P3');     // P1, P2, P3, P4
            $table->string('status')->default('new');      // new, triaged, assigned, working, waiting_user, waiting_vendor, resolved, closed
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('assigned_team_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->jsonb('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('priority');
            $table->index('assigned_user_id');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
