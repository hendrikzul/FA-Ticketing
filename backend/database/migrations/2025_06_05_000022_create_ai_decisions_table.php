<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id')->nullable()->constrained()->nullOnDelete();
            $table->string('decision_type');           // create_ticket, suggest_action, classify
            $table->jsonb('decision_context');
            $table->jsonb('decision_output');
            $table->boolean('was_accepted')->nullable();
            $table->string('model_used');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_decisions');
    }
};
