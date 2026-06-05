<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_extractions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id')->nullable()->constrained()->nullOnDelete();
            $table->string('extraction_type');            // intent, ticket_fields, classification
            $table->jsonb('input_context_json');
            $table->jsonb('extracted_data_json');
            $table->string('model_used');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_extractions');
    }
};
