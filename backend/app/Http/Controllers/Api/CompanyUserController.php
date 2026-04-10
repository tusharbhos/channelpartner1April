<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class CompanyUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeViewer($actor);

        $query = User::query()
            ->where('role', 'user')
            ->where('is_company_owner', false)
            ->orderByDesc('id');

        if (! $actor->isAdmin()) {
            $query->where('company_id', $actor->company_id);
        }

        if ($search = trim((string) $request->get('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        $list = $query->get();

        return response()->json([
            'data' => $list->map(fn(User $u) => $this->formatUser($u)),
            'total' => $list->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeManager($actor);

        $v = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'address' => ['nullable', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            'company_id' => $actor->company_id,
            'name' => $v['name'],
            'email' => $v['email'],
            'password' => Hash::make($v['password']),
            'company_name' => $actor->company_name,
            'rera_no' => $actor->rera_no,
            'phone' => $v['phone'] ?? null,
            'address' => $v['address'] ?? null,
            'role' => 'user',
            'is_company_owner' => false,
            'is_active' => $v['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Company user created successfully.',
            'data' => $this->formatUser($user),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeManager($actor);

        $user = $this->findCompanyUser($actor, $id);

        return response()->json(['data' => $this->formatUser($user)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeManager($actor);

        $user = $this->findCompanyUser($actor, $id);

        $v = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'confirmed', Password::min(8)],
        ]);

        if (isset($v['password'])) {
            $v['password'] = Hash::make($v['password']);
        }

        $user->update($v);

        return response()->json([
            'message' => 'Company user updated successfully.',
            'data' => $this->formatUser($user->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeManager($actor);

        $user = $this->findCompanyUser($actor, $id);
        $user->delete();

        return response()->json(['message' => 'Company user deleted successfully.']);
    }

    private function authorizeManager(User $actor): void
    {
        if (! $actor->isAdmin() && ! $actor->is_company_owner) {
            abort(403, 'Only company owner/admin can manage company users.');
        }

        if (! $actor->isAdmin() && ! $actor->company_id) {
            abort(422, 'Your account is not linked with a company.');
        }
    }

    private function authorizeViewer(User $actor): void
    {
        if (! $actor->isAdmin() && ! $actor->is_company_owner) {
            abort(403, 'Only company owner/admin can view company users.');
        }

        if (! $actor->isAdmin() && ! $actor->company_id) {
            abort(422, 'Your account is not linked with a company.');
        }
    }

    private function findCompanyUser(User $actor, int $id): User
    {
        return User::query()
            ->where('company_id', $actor->company_id)
            ->where('role', 'user')
            ->where('is_company_owner', false)
            ->findOrFail($id);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'company_id' => $user->company_id,
            'company_name' => $user->company_name,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'is_active' => (bool) $user->is_active,
            'created_at' => $user->created_at?->toDateTimeString(),
        ];
    }
}
