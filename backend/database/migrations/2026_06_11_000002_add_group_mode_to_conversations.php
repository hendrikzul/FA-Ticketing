<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop existing check constraint if any, then add new one allowing 'group'
        DB::statement("ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_conversation_mode_check");
        DB::statement("ALTER TABLE conversations ADD CONSTRAINT conversations_conversation_mode_check CHECK (conversation_mode IN ('ai','human','direct','group'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_conversation_mode_check");
        DB::statement("ALTER TABLE conversations ADD CONSTRAINT conversations_conversation_mode_check CHECK (conversation_mode IN ('ai','human','direct'))");
    }
};
