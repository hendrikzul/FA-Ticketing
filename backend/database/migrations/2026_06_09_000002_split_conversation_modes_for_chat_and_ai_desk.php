<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('conversation_mode')->default('ai')->after('status');
        });

        DB::table('conversations')
            ->whereNull('conversation_mode')
            ->update(['conversation_mode' => 'ai']);
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('conversation_mode');
        });
    }
};
