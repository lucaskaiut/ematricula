<?php

declare(strict_types=1);

namespace App\Modules\Dashboard\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Person\Domain\Models\Person;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 7);
        if ($days < 1) {
            $days = 1;
        }
        if ($days > 60) {
            $days = 60;
        }

        $today = CarbonImmutable::today();
        $until = $today->addDays($days);

        $pending = (clone Invoice::query())
            ->where('status', InvoiceStatus::Pending);

        $overdue = (clone $pending)
            ->whereDate('due_date', '<', $today->toDateString());

        $dueSoon = (clone $pending)
            ->whereDate('due_date', '>=', $today->toDateString())
            ->whereDate('due_date', '<=', $until->toDateString());

        $paidThisMonth = (clone Invoice::query())
            ->where('status', InvoiceStatus::Paid)
            ->whereDate('paid_at', '>=', $today->startOfMonth()->toDateString())
            ->whereDate('paid_at', '<=', $today->endOfMonth()->toDateString());

        $kpis = [
            'overdue' => $this->kpiFromQuery($overdue),
            'due_soon' => $this->kpiFromQuery($dueSoon),
            'paid_this_month' => $this->kpiFromQuery($paidThisMonth),
        ];

        $upcomingInvoices = Invoice::query()
            ->with(['subscription.enrollment.student', 'subscription.plan'])
            ->where('status', InvoiceStatus::Pending)
            ->whereDate('due_date', '>=', $today->toDateString())
            ->whereDate('due_date', '<=', $until->toDateString())
            ->orderBy('due_date')
            ->orderBy('id')
            ->limit(8)
            ->get()
            ->map(fn (Invoice $i) => [
                'id' => $i->id,
                'amount' => $this->formatDecimalAmount($i->amount),
                'due_date' => $i->due_date?->toDateString(),
                'status' => $i->status->value,
                'enrollment_id' => $i->subscription?->enrollment_id,
                'student' => $i->subscription?->enrollment?->student
                    ? [
                        'id' => $i->subscription->enrollment->student->id,
                        'full_name' => $i->subscription->enrollment->student->full_name,
                    ]
                    : null,
                'plan' => $i->subscription?->plan
                    ? [
                        'id' => $i->subscription->plan->id,
                        'name' => $i->subscription->plan->name,
                    ]
                    : null,
            ])
            ->values();

        $delinquentStudents = $this->delinquentStudents($today)
            ->take(8)
            ->values();

        return response()->json([
            'data' => [
                'range' => [
                    'today' => $today->toDateString(),
                    'until' => $until->toDateString(),
                    'days' => $days,
                ],
                'kpis' => $kpis,
                'lists' => [
                    'upcoming_invoices' => $upcomingInvoices,
                    'delinquent_students' => $delinquentStudents,
                ],
            ],
        ]);
    }

    /**
     * @return array{count:int, amount_sum:string}
     */
    private function kpiFromQuery(Builder $query): array
    {
        $row = (clone $query)
            ->selectRaw('COUNT(*) as c, COALESCE(SUM(amount), 0) as s')
            ->first();

        $count = (int) ($row?->c ?? 0);
        $sum = (string) ($row?->s ?? '0');

        return [
            'count' => $count,
            'amount_sum' => number_format((float) $sum, 2, '.', ''),
        ];
    }

    private function formatDecimalAmount(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $n = is_numeric($value) ? (float) $value : null;
        if ($n === null) {
            return null;
        }

        return number_format($n, 2, '.', '');
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{student: array{id:int, full_name:string}, overdue: array{count:int, amount_sum:string}, next_due_date: string|null}>
     */
    private function delinquentStudents(CarbonImmutable $today)
    {
        $rows = Invoice::query()
            ->selectRaw('enrollments.student_person_id as student_id')
            ->selectRaw('COUNT(invoices.id) as overdue_count')
            ->selectRaw('COALESCE(SUM(invoices.amount), 0) as overdue_amount_sum')
            ->selectRaw('MIN(invoices.due_date) as first_overdue_due_date')
            ->join('subscriptions', 'subscriptions.id', '=', 'invoices.subscription_id')
            ->join('enrollments', 'enrollments.id', '=', 'subscriptions.enrollment_id')
            ->where('invoices.status', InvoiceStatus::Pending)
            ->whereDate('invoices.due_date', '<', $today->toDateString())
            ->groupBy('enrollments.student_person_id')
            ->orderByDesc(DB::raw('overdue_amount_sum'))
            ->orderByDesc(DB::raw('overdue_count'))
            ->limit(20)
            ->get();

        $studentIds = $rows->pluck('student_id')->filter()->values()->all();
        if (! is_array($studentIds) || count($studentIds) === 0) {
            return collect();
        }

        $students = Person::query()
            ->select(['id', 'full_name'])
            ->whereIn('id', $studentIds)
            ->get()
            ->keyBy('id');

        return $rows
            ->map(function ($r) use ($students) {
                $student = $students->get((int) $r->student_id);
                if (! $student) {
                    return null;
                }

                return [
                    'student' => [
                        'id' => (int) $student->id,
                        'full_name' => (string) $student->full_name,
                    ],
                    'overdue' => [
                        'count' => (int) $r->overdue_count,
                        'amount_sum' => number_format((float) $r->overdue_amount_sum, 2, '.', ''),
                    ],
                    'next_due_date' => $r->first_overdue_due_date
                        ? CarbonImmutable::parse((string) $r->first_overdue_due_date)->toDateString()
                        : null,
                ];
            })
            ->filter()
            ->values();
    }
}

