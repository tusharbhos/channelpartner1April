<?php
// app/Models/Customer.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nickname',
        'secret_code',
        'name',
        'phone',
        'address',
        'projects',
        'meeting_date',
        'meeting_time',
        'project_name',
        'notes',
        'status',
        'is_active',
    ];

    protected $casts = [
        'meeting_date' => 'date:Y-m-d',
        'projects' => 'array',  // Automatically cast JSON to array
        'is_active' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Accessors ─────────────────────────────────────────

    public function getMeetingDateAttribute($value): ?string
    {
        return $value ? \Carbon\Carbon::parse($value)->format('Y-m-d') : null;
    }

    // Helper to get all projects
    public function getProjectsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    // Helper to add a project meeting
    public function addProjectMeeting(array $meetingData): void
    {
        $projects = $this->projects ?? [];

        // Check if project already exists
        $existingIndex = null;
        foreach ($projects as $index => $project) {
            if ($project['project_name'] === $meetingData['project_name']) {
                $existingIndex = $index;
                break;
            }
        }

        if ($existingIndex !== null) {
            // Update existing project meeting
            $projects[$existingIndex] = array_merge($projects[$existingIndex], $meetingData);
        } else {
            // Add new project meeting
            $projects[] = $meetingData;
        }

        $this->projects = $projects;
        $this->save();
    }

    // Helper to remove a project meeting
    public function removeProjectMeeting(string $projectName): void
    {
        $projects = $this->projects ?? [];
        $this->projects = array_filter($projects, function ($project) use ($projectName) {
            return $project['project_name'] !== $projectName;
        });
        $this->save();
    }

    // Helper to update a project meeting
    public function updateProjectMeeting(string $projectName, array $meetingData): void
    {
        $projects = $this->projects ?? [];
        foreach ($projects as $index => $project) {
            if ($project['project_name'] === $projectName) {
                $projects[$index] = array_merge($project, $meetingData);
                break;
            }
        }
        $this->projects = $projects;
        $this->save();
    }

    // Helper to get upcoming meetings
    public function getUpcomingMeetings()
    {
        $projects = $this->projects ?? [];
        $today = now()->toDateString();

        return array_filter($projects, function ($project) use ($today) {
            return isset($project['meeting_date']) && $project['meeting_date'] >= $today;
        });
    }

    // Helper to get completed meetings
    public function getCompletedMeetings()
    {
        $projects = $this->projects ?? [];
        $today = now()->toDateString();

        return array_filter($projects, function ($project) use ($today) {
            return isset($project['meeting_date']) && $project['meeting_date'] < $today;
        });
    }
}
