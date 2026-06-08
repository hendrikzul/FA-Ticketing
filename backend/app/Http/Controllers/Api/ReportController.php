<?php

namespace App\Http\Controllers\Api;

use App\Services\SLAService;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends \App\Http\Controllers\Controller
{
    /**
     * Dashboard summary statistics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $tickets = Ticket::query();

        $totalTickets = $tickets->count();
        $openTickets = Ticket::whereNotIn('status', ['resolved', 'closed'])->count();
        $resolvedToday = Ticket::whereDate('resolved_at', today())->count();
        $breachedSLA = 0;

        // Count SLA breached
        $activeTickets = Ticket::whereNotIn('status', ['resolved', 'closed'])->get();
        foreach ($activeTickets as $ticket) {
            $sla = SLAService::check($ticket);
            if ($sla['overall_status'] === 'breached') {
                $breachedSLA++;
            }
        }

        // By priority
        $byPriority = Ticket::selectRaw('priority, count(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority');

        // By status
        $byStatus = Ticket::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // By category
        $byCategory = Ticket::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        // Recent activity
        $recentActivity = Ticket::with('reporter:id,name')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'ticket_number' => $t->ticket_number,
                'title' => $t->title,
                'status' => $t->status,
                'updated_at' => $t->updated_at,
            ]);

        return response()->json([
            'data' => [
                'summary' => [
                    'total_tickets' => $totalTickets,
                    'open_tickets' => $openTickets,
                    'resolved_today' => $resolvedToday,
                    'breached_sla' => $breachedSLA,
                ],
                'by_priority' => $byPriority,
                'by_status' => $byStatus,
                'by_category' => $byCategory,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * Get staff workload.
     */
    public function workload(): JsonResponse
    {
        $workload = \App\Models\User::withCount(['assignedTickets' => function ($q) {
            $q->whereNotIn('status', ['resolved', 'closed']);
        }])
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['staff', 'manager']))
            ->orderBy('assigned_tickets_count', 'desc')
            ->get(['id', 'name', 'username']);

        return response()->json(['data' => $workload]);
    }

    /**
     * Get stale/reminder tickets.
     */
    public function reminders(): JsonResponse
    {
        return response()->json(['data' => SLAService::getStaleTickets()]);
    }

    /**
     * Get SLA status for a ticket.
     */
    public function sla(Ticket $ticket): JsonResponse
    {
        return response()->json(['data' => SLAService::check($ticket)]);
    }
}
