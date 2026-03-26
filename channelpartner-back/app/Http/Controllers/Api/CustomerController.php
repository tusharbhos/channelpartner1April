<?php
// app/Http/Controllers/Api/CustomerController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Customer::with('user:id,name,email');
        if (! $user->isAdmin()) $query->where('user_id', $user->id);

        if ($search = $request->get('search')) {
            $query->where(fn($q) => $q
                ->where('nickname',    'like', "%{$search}%")
                ->orWhere('secret_code', 'like', "%{$search}%")
                ->orWhere('name',       'like', "%{$search}%")
                ->orWhere('phone',      'like', "%{$search}%")
            );
        }

        $list = $query->orderBy('created_at', 'desc')->get();
        
        // Transform data to include projects
        $list->transform(function($customer) {
            $customer->projects = $customer->projects ?? [];
            return $customer;
        });
        
        return response()->json(['data' => $list, 'total' => $list->count()]);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $query = Customer::whereNotNull('meeting_date')
                         ->where('meeting_date', '>=', now()->toDateString());
        if (! $request->user()->isAdmin()) $query->where('user_id', $request->user()->id);
        return response()->json(['data' => $query->orderBy('meeting_date')->get()]);
    }

    public function generateCode(): JsonResponse
    {
        do { $code = 'CP-' . strtoupper(Str::random(6)); }
        while (Customer::where('secret_code', $code)->exists());
        return response()->json(['secret_code' => $code]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'nickname'     => ['required', 'string', 'max:100'],
            'secret_code'  => ['required', 'string', 'max:50', 'unique:customers,secret_code'],
            'name'         => ['nullable', 'string', 'max:255'],
            'phone'        => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'address'      => ['nullable', 'string'],
            'notes'        => ['nullable', 'string'],
            'status'       => ['nullable', 'in:active,inactive,converted'],
        ]);

        $customer = Customer::create([
            ...$v, 
            'user_id' => $request->user()->id, 
            'status' => $v['status'] ?? 'active',
            'projects' => [] // Initialize empty projects array
        ]);
        
        return response()->json(['message' => 'Customer added.', 'data' => $customer->load('user:id,name,email')], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $customer = $this->findOwned($request, $id)->load('user:id,name,email');
        $customer->projects = $customer->projects ?? [];
        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = $this->findOwned($request, $id);

        $v = $request->validate([
            'nickname'     => ['sometimes', 'string', 'max:100'],
            'name'         => ['nullable', 'string', 'max:255'],
            'phone'        => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'address'      => ['nullable', 'string'],
            'notes'        => ['nullable', 'string'],
            'status'       => ['nullable', 'in:active,inactive,converted'],
        ]);

        $customer->update($v);
        return response()->json(['message' => 'Customer updated.', 'data' => $customer->fresh('user:id,name,email')]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->findOwned($request, $id)->delete();
        return response()->json(['message' => 'Customer deleted.']);
    }

    // New endpoint to schedule meeting for a project
    public function scheduleMeeting(Request $request, int $id): JsonResponse
    {
        $customer = $this->findOwned($request, $id);
        
        $v = $request->validate([
            'meeting_date' => ['required', 'date', 'after_or_equal:today'],
            'meeting_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'project_name' => ['required', 'string', 'max:255'],
        ]);
        
        // Validate 30-min slot
        $this->assertValidSlot($v['meeting_time']);
        
        // Check for conflicts with other projects of same customer
        $this->assertNoConflictForProjects($customer, $v['meeting_date'], $v['meeting_time']);
        
        // Add/Update project meeting
        $customer->addProjectMeeting([
            'project_name' => $v['project_name'],
            'meeting_date' => $v['meeting_date'],
            'meeting_time' => $v['meeting_time'],
            'scheduled_at' => now()->toDateTimeString(),
        ]);
        
        // For backward compatibility, also update single meeting fields
        $customer->update([
            'meeting_date' => $v['meeting_date'],
            'meeting_time' => $v['meeting_time'],
            'project_name' => $v['project_name'],
        ]);
        
        return response()->json([
            'message' => 'Meeting scheduled successfully!',
            'data' => $customer->fresh('user:id,name,email')
        ]);
    }

    // New endpoint to get all project meetings for a customer
    public function getProjectMeetings(Request $request, int $id): JsonResponse
    {
        $customer = $this->findOwned($request, $id);
        return response()->json([
            'data' => [
                'customer' => $customer->nickname,
                'projects' => $customer->projects ?? [],
                'upcoming' => $customer->getUpcomingMeetings(),
                'completed' => $customer->getCompletedMeetings(),
            ]
        ]);
    }

    // New endpoint to update a specific project meeting
    public function updateProjectMeeting(Request $request, int $id, string $projectName): JsonResponse
    {
        $customer = $this->findOwned($request, $id);
        
        $v = $request->validate([
            'meeting_date' => ['required', 'date', 'after_or_equal:today'],
            'meeting_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
        ]);
        
        $this->assertValidSlot($v['meeting_time']);
        $this->assertNoConflictForProjects($customer, $v['meeting_date'], $v['meeting_time'], $projectName);
        
        $customer->updateProjectMeeting($projectName, [
            'meeting_date' => $v['meeting_date'],
            'meeting_time' => $v['meeting_time'],
            'updated_at' => now()->toDateTimeString(),
        ]);
        
        return response()->json([
            'message' => 'Project meeting updated successfully!',
            'data' => $customer->fresh()
        ]);
    }

    // New endpoint to delete a project meeting
    public function deleteProjectMeeting(Request $request, int $id, string $projectName): JsonResponse
    {
        $customer = $this->findOwned($request, $id);
        $customer->removeProjectMeeting($projectName);
        
        return response()->json([
            'message' => 'Project meeting removed successfully!',
            'data' => $customer->fresh()
        ]);
    }

    // ── Helpers ───────────────────────────────────────────

    private function findOwned(Request $request, int $id): Customer
    {
        $q = Customer::query();
        if (! $request->user()->isAdmin()) $q->where('user_id', $request->user()->id);
        return $q->findOrFail($id);
    }

    private function assertValidSlot(string $time): void
    {
        $mins = (int) explode(':', $time)[1];
        if (! in_array($mins, [0, 30], true)) {
            abort(422, 'Meeting time must be on a 30-minute slot (e.g. 10:00 or 10:30).');
        }
    }

    private function assertNoConflictForProjects(Customer $customer, string $date, string $time, ?string $excludeProject = null): void
    {
        $newMins = $this->toMins($time);
        $projects = $customer->projects ?? [];
        
        foreach ($projects as $project) {
            if ($excludeProject && $project['project_name'] === $excludeProject) continue;
            if (!isset($project['meeting_date']) || !isset($project['meeting_time'])) continue;
            if ($project['meeting_date'] !== $date) continue;
            
            if (abs($this->toMins($project['meeting_time']) - $newMins) < 30) {
                abort(422,
                    "Time conflict: Project \"{$project['project_name']}\" has a meeting at {$this->fmt12($project['meeting_time'])} on this date. " .
                    "Please choose a time at least 30 minutes apart."
                );
            }
        }
    }

    private function toMins(string $t): int
    {
        [$h, $m] = array_map('intval', explode(':', $t));
        return $h * 60 + $m;
    }

    private function fmt12(string $t): string
    {
        [$h, $m] = array_map('intval', explode(':', $t));
        return sprintf('%d:%02d %s', $h % 12 ?: 12, $m, $h >= 12 ? 'PM' : 'AM');
    }
}