<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyContact;
use App\Models\PropertyReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('report.view'), 403);

        $byStatus = Property::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'properties' => [
                'total' => Property::count(),
                'pending' => (int) ($byStatus[PropertyStatus::Pending->value] ?? 0),
                'published' => (int) ($byStatus[PropertyStatus::Published->value] ?? 0),
                'rejected' => (int) ($byStatus[PropertyStatus::Rejected->value] ?? 0),
                'expired' => (int) ($byStatus[PropertyStatus::Expired->value] ?? 0),
                'new_today' => Property::whereDate('created_at', today())->count(),
                'new_this_week' => Property::where('created_at', '>=', now()->subWeek())->count(),
            ],
            'users' => [
                'total' => User::count(),
                'new_today' => User::whereDate('created_at', today())->count(),
                'by_role' => User::query()
                    ->join('model_has_roles', function ($join) {
                        $join->on('users.id', '=', 'model_has_roles.model_id')
                            ->where('model_has_roles.model_type', '=', User::class);
                    })
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->selectRaw('roles.name as role, count(*) as total')
                    ->groupBy('roles.name')
                    ->pluck('total', 'role'),
                'suspended' => User::where('status', 'suspended')->count(),
            ],
            'engagement' => [
                'total_views' => (int) Property::sum('views_count'),
                'contacts_today' => PropertyContact::whereDate('created_at', today())->count(),
                'pending_reports' => PropertyReport::where('status', 'pending')->count(),
            ],
        ]);
    }

    /** Danh sách tin bị báo cáo, ưu tiên tin nhiều báo cáo nhất. */
    public function reports(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('report.view'), 403);

        $reports = PropertyReport::query()
            ->with(['property:id,title,slug,status', 'reporter:id,name,email'])
            ->when(
                $request->query('status'),
                fn ($q, $s) => $q->where('status', $s),
                fn ($q) => $q->where('status', 'pending')
            )
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($reports);
    }

    public function handleReport(Request $request, PropertyReport $report): JsonResponse
    {
        abort_unless($request->user()->can('property.moderate'), 403);

        $data = $request->validate([
            'status' => ['required', 'in:reviewed,dismissed'],
        ]);

        $report->update([
            'status' => $data['status'],
            'handled_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Đã xử lý báo cáo.']);
    }
}
