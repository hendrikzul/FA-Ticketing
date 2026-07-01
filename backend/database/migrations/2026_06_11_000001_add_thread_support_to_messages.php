<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('conversation_id');
            $table->foreign('parent_id')->references('id')->on('messages')->nullOnDelete();
            $table->unsignedInteger('thread_reply_count')->default(0)->after('parent_id');
            $table->index(['parent_id']);
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['parent_id']);
            $table->dropColumn('parent_id');
            $table->dropColumn('thread_reply_count');
        });
    }
};
