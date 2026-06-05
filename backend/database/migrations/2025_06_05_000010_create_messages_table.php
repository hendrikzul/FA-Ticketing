<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('sender_type');               // user, staff, ai, system
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->string('message_type')->default('text'); // text, file, image, action, event
            $table->text('body_text')->nullable();
            $table->jsonb('body_json')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
