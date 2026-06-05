<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\Carbon;

class SLAService
{
    // SLA targets in minutes (configurable)
    private static array $targets = [
        'P1' => ['response' => 15, 'resolution' => 240],   // 15 min / 4 hours
        'P2' => ['response' => 60, 'resolution' => 1440],   // 1 hour / 1 day
        'P3' => ['response' => 240, 'resolution' => 4320],  // 4 hours / 3 days
        'P4' => ['response' => 1440, 'resolution' => 10080],// 1 day / 7 days
    ];

    /**
     * Check SLA status for a ticket.
     */
    public static function check(Ticket $ticket): array
    {
        $target = self::$targets[$ticket->priority] ?? self::$targets['P3'];

        $createdAt = Carbon::parse($ticket->created_at);
        $now = Carbon::now();
        $elapsedMinutes = $createdAt->diffInMinutes($now);

        $responseTarget = $target['response'];
        $resolutionTarget = $target['resolution'];

        // Response SLA: has anyone responded?
        $hasResponse = $ticket->status !== 'new';
        $responseBreach = false;
        $responseRemaining = 0;

        if (!$hasResponse) {
            $responseBreach = $elapsedMinutes > $responseTarget;
            $responseRemaining = max(0, $responseTarget - $elapsedMinutes);
        }

        // Resolution SLA
        $isResolved = in_array($ticket->status, ['resolved', 'closed']);
        $resolutionBreach = false;
        $resolutionRemaining = 0;

        if (!$isResolved) {
            $resolutionBreach = $elapsedMinutes > $resolutionTarget;
            $resolutionRemaining = max(0, $resolutionTarget - $elapsedMinutes);
        }

        return [
            'priority' => $ticket->priority,
            'created_at' => $ticket->created_at,
            'elapsed_minutes' => $elapsedMinutes,
            'response' => [
                'target_minutes' => $responseTarget,
                'breached' => $responseBreach,
                'remaining_minutes' => $responseRemaining,
                'met' => $hasResponse && !$responseBreach,
            ],
            'resolution' => [
                'target_minutes' => $resolutionTarget,
                'breached' => $resolutionBreach,
                'remaining_minutes' => $resolutionRemaining,
                'met' => $isResolved && !$resolutionBreach,
            ],
            'overall_status' => $responseBreach || $resolutionBreach ? 'breached' : 'on_track',
        ];
    }

    /**
     * Get tickets that need reminders (stale, SLA breach).
     */
    public static function getStaleTickets(): array
    {
        $stale = [];

        // No update in 24 hours for active tickets
        $activeTickets = Ticket::whereNotIn('status', ['resolved', 'closed'])
            ->where('updated_at', '<', Carbon::now()->subHours(24))
            ->get();

        foreach ($activeTickets as $ticket) {
            $stale[] = [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'title' => $ticket->title,
                'reason' => 'No update in 24 hours',
                'hours_stale' => Carbon::parse($ticket->updated_at)->diffInHours(Carbon::now()),
            ];
        }

        // SLA approaching breach (within 1 hour for P1, 4 hours for P2)
        $nearBreach = Ticket::whereNotIn('status', ['resolved', 'closed'])
            ->get()
            ->filter(function ($ticket) {
                $sla = self::check($ticket);
                if ($ticket->priority === 'P1' && $sla['resolution']['remaining_minutes'] < 60) return true;
                if ($ticket->priority === 'P2' && $sla['resolution']['remaining_minutes'] < 240) return true;
                return false;
            })
            ->map(fn($t) => [
                'ticket_id' => $t->id,
                'ticket_number' => $t->ticket_number,
                'title' => $t->title,
                'reason' => 'SLA approaching breach',
            ]);

        foreach ($nearBreach as $item) {
            $stale[] = $item;
        }

        return $stale;
    }
}
