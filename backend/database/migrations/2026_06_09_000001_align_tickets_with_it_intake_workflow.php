<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ticket_type')->nullable()->after('description');
            $table->boolean('is_draft')->default(true)->after('status');
            $table->boolean('approval_required')->default(false)->after('is_draft');

            $table->index('ticket_type');
        });

        Schema::table('conversation_states', function (Blueprint $table) {
            $table->boolean('needs_ticket')->nullable()->after('object_type');
            $table->string('ticket_type')->nullable()->after('category');
            $table->boolean('approval_required')->nullable()->after('ticket_type');
        });
    }

    public function down(): void
    {
        Schema::table('conversation_states', function (Blueprint $table) {
            $table->dropColumn(['needs_ticket', 'ticket_type', 'approval_required']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['ticket_type']);
            $table->dropColumn(['ticket_type', 'is_draft', 'approval_required']);
        });
    }
};
