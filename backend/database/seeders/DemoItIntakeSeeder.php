<?php

namespace Database\Seeders;

use App\Models\AiSummary;
use App\Models\Conversation;
use App\Models\ConversationState;
use App\Models\Division;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoItIntakeSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@aicop.local')->first();
        $manager = User::where('email', 'manager@aicop.local')->first();
        $staff = User::where('email', 'staff@aicop.local')->first();
        $requester = User::where('email', 'user@aicop.local')->first();
        $observer = User::where('email', 'observer@aicop.local')->first();

        if (!$admin || !$manager || !$staff || !$requester || !$observer) {
            return;
        }

        $serviceDesk = Division::updateOrCreate(
            ['slug' => 'it-service-desk'],
            [
                'name' => 'IT Service Desk',
                'description' => 'Front-door team for intake, triage, and follow-up.',
                'manager_id' => $manager->id,
                'is_active' => true,
            ]
        );

        $platform = Division::updateOrCreate(
            ['slug' => 'platform-engineering'],
            [
                'name' => 'Platform Engineering',
                'description' => 'Builds, bugfixes, and maintains internal systems.',
                'manager_id' => $manager->id,
                'is_active' => true,
            ]
        );

        $serviceDesk->members()->syncWithoutDetaching([$manager->id, $staff->id]);
        $platform->members()->syncWithoutDetaching([$manager->id, $staff->id]);

        $this->seedBugfixConversation($requester, $staff, $observer, $serviceDesk);
        $this->seedDevelopmentConversation($requester, $manager, $platform);
        $this->seedMaintenanceConversation($requester, $staff, $serviceDesk);
        $this->seedHumanChatConversation($admin, $manager, $observer);
    }

    private function seedBugfixConversation(User $requester, User $staff, User $observer, Division $serviceDesk): void
    {
        $conversation = Conversation::updateOrCreate(
            ['title' => 'Checkout page returns HTTP 500 for staff refunds'],
            [
                'created_by' => $requester->id,
                'status' => 'active',
                'conversation_mode' => 'ai',
                'is_private' => false,
                'last_activity_at' => now()->subHours(2),
            ]
        );

        $conversation->participants()->syncWithoutDetaching([
            $requester->id => ['role' => 'owner'],
            $staff->id => ['role' => 'participant'],
        ]);
        $conversation->watchers()->syncWithoutDetaching([
            $observer->id => ['is_active' => true],
        ]);

        $this->ensureMessage($conversation->id, $requester->id, 'Saat proses refund order, checkout page muncul 500 sejak pagi ini.');
        $this->ensureMessage($conversation->id, $staff->id, 'Kami triage dulu. Tolong konfirmasi browser dan waktu kejadian terakhir.');

        ConversationState::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'object_type' => 'ticket',
                'category' => 'payments',
                'priority' => 'P1',
                'status' => 'triaged',
                'assigned_team_id' => $serviceDesk->id,
                'assigned_user_id' => $staff->id,
                'needs_ticket' => true,
                'ticket_type' => 'bugfix',
                'approval_required' => false,
                'current_summary' => 'Refund checkout flow fails with HTTP 500 for staff operations. Impact is active and blocks refund handling.',
                'missing_fields_json' => ['browser_version'],
                'last_activity_at' => now()->subHours(2),
            ]
        );

        Ticket::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'title' => 'Fix refund checkout HTTP 500',
                'description' => 'Refund checkout crashes with HTTP 500 during staff operations.',
                'ticket_type' => 'bugfix',
                'category' => 'payments',
                'priority' => 'P1',
                'status' => 'triaged',
                'is_draft' => true,
                'approval_required' => false,
                'reported_by' => $requester->id,
                'assigned_team_id' => $serviceDesk->id,
                'assigned_user_id' => $staff->id,
            ]
        );

        AiSummary::updateOrCreate(
            ['conversation_id' => $conversation->id, 'summary_type' => 'ticket'],
            ['summary_text' => 'Bugfix intake drafted for checkout refund failure. Missing browser version before active execution.']
        );
    }

    private function seedDevelopmentConversation(User $requester, User $manager, Division $platform): void
    {
        $conversation = Conversation::updateOrCreate(
            ['title' => 'Need approval flow for vendor invoice uploads'],
            [
                'created_by' => $requester->id,
                'status' => 'active',
                'conversation_mode' => 'ai',
                'is_private' => false,
                'last_activity_at' => now()->subDay(),
            ]
        );

        $conversation->participants()->syncWithoutDetaching([
            $requester->id => ['role' => 'owner'],
            $manager->id => ['role' => 'participant'],
        ]);

        $this->ensureMessage($conversation->id, $requester->id, 'Kami butuh flow approval sebelum invoice vendor bisa diupload ke finance.');
        $this->ensureMessage($conversation->id, $manager->id, 'Scope development sudah cukup jelas. Kita siapkan approval draft dulu.');

        ConversationState::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'object_type' => 'ticket',
                'category' => 'workflow',
                'priority' => 'P2',
                'status' => 'waiting_approval',
                'assigned_team_id' => $platform->id,
                'assigned_user_id' => $manager->id,
                'needs_ticket' => true,
                'ticket_type' => 'development',
                'approval_required' => true,
                'current_summary' => 'Development request to add approval gate before vendor invoice upload.',
                'missing_fields_json' => ['approval_owner', 'target_launch_date'],
                'last_activity_at' => now()->subDay(),
            ]
        );

        Ticket::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'title' => 'Build vendor invoice approval flow',
                'description' => 'Add approval workflow before finance invoice uploads are accepted.',
                'ticket_type' => 'development',
                'category' => 'workflow',
                'priority' => 'P2',
                'status' => 'waiting_approval',
                'is_draft' => true,
                'approval_required' => true,
                'reported_by' => $requester->id,
                'assigned_team_id' => $platform->id,
                'assigned_user_id' => $manager->id,
            ]
        );

        AiSummary::updateOrCreate(
            ['conversation_id' => $conversation->id, 'summary_type' => 'ticket'],
            ['summary_text' => 'Development intake ready as draft. Waiting for approval owner and target launch date.']
        );
    }

    private function seedMaintenanceConversation(User $requester, User $staff, Division $serviceDesk): void
    {
        $conversation = Conversation::updateOrCreate(
            ['title' => 'Quarterly maintenance window for internal VPN'],
            [
                'created_by' => $requester->id,
                'status' => 'active',
                'conversation_mode' => 'ai',
                'is_private' => false,
                'last_activity_at' => now()->subDays(2),
            ]
        );

        $conversation->participants()->syncWithoutDetaching([
            $requester->id => ['role' => 'owner'],
            $staff->id => ['role' => 'participant'],
        ]);

        $this->ensureMessage($conversation->id, $requester->id, 'Butuh maintenance VPN internal minggu ini, mohon jadwalkan downtime.');
        $this->ensureMessage($conversation->id, $staff->id, 'Kami siapkan maintenance ticket dan window komunikasinya.');

        ConversationState::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'object_type' => 'ticket',
                'category' => 'infrastructure',
                'priority' => 'P3',
                'status' => 'queued',
                'assigned_team_id' => $serviceDesk->id,
                'assigned_user_id' => $staff->id,
                'needs_ticket' => true,
                'ticket_type' => 'maintenance',
                'approval_required' => false,
                'current_summary' => 'Scheduled VPN maintenance with communication and downtime window required.',
                'missing_fields_json' => ['maintenance_window'],
                'last_activity_at' => now()->subDays(2),
            ]
        );

        Ticket::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'title' => 'Schedule quarterly VPN maintenance',
                'description' => 'Prepare and execute maintenance window for internal VPN.',
                'ticket_type' => 'maintenance',
                'category' => 'infrastructure',
                'priority' => 'P3',
                'status' => 'queued',
                'is_draft' => false,
                'approval_required' => false,
                'reported_by' => $requester->id,
                'assigned_team_id' => $serviceDesk->id,
                'assigned_user_id' => $staff->id,
            ]
        );

        AiSummary::updateOrCreate(
            ['conversation_id' => $conversation->id, 'summary_type' => 'ticket'],
            ['summary_text' => 'Maintenance intake accepted and queued. Needs explicit maintenance window before execution.']
        );
    }

    private function seedHumanChatConversation(User $admin, User $manager, User $observer): void
    {
        $conversation = Conversation::updateOrCreate(
            ['title' => 'John Manager'],
            [
                'created_by' => $admin->id,
                'status' => 'active',
                'conversation_mode' => 'human',
                'is_private' => true,
                'last_activity_at' => now()->subMinutes(45),
            ]
        );

        $conversation->participants()->syncWithoutDetaching([
            $admin->id => ['role' => 'owner'],
            $manager->id => ['role' => 'participant'],
        ]);
        $conversation->watchers()->syncWithoutDetaching([
            $observer->id => ['is_active' => true],
        ]);

        $this->ensureMessage($conversation->id, $admin->id, 'Mas John, bugfix refund sudah saya triage. Nanti saya update lagi setelah log production lengkap.');
        $this->ensureMessage($conversation->id, $manager->id, 'Siap, kalau impact meluas langsung escalate ke AI Desk supaya ticket draft-nya cepat lengkap.');

        ConversationState::updateOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'object_type' => 'chat',
                'last_activity_at' => now()->subMinutes(45),
            ]
        );
    }

    private function ensureMessage(int $conversationId, int $senderId, string $bodyText): void
    {
        Message::firstOrCreate(
            [
                'conversation_id' => $conversationId,
                'sender_id' => $senderId,
                'body_text' => $bodyText,
            ],
            [
                'sender_type' => 'user',
                'message_type' => 'text',
            ]
        );
    }
}
