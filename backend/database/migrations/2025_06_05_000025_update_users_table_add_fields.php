<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('name')->nullable();
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar_url')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('remember_token');
            $table->foreignId('division_id')->nullable()->after('is_active')->constrained('divisions')->nullOnDelete();
            $table->jsonb('preferences')->nullable()->after('division_id');
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropColumn(['username', 'phone', 'avatar_url', 'is_active', 'division_id', 'preferences']);
            $table->dropSoftDeletes();
        });
    }
};
