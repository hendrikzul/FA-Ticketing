<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('incident_number')->unique();  // INC-0001
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('severity')->default('minor');  // critical, major, minor
            $table->string('status')->default('open');     // open, investigating, resolved, closed
            $table->string('impact')->nullable();          // affected services
            $table->foreignId('commander_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('detected_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
