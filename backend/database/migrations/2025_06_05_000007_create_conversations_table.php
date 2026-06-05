<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->string('status')->default('active'); // active, resolved, closed, archived
            $table->string('object_type')->nullable();   // ticket, task, incident, null
            $table->unsignedBigInteger('object_id')->nullable();
            $table->boolean('is_private')->default(false);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
