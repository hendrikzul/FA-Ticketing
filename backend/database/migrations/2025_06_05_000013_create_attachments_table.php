<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('filename');
            $table->string('mime_type')->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->string('storage_path');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();

            $table->index('conversation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
