<?php

namespace App\Http\Controllers;

use App\Constants\UserRole;
use App\Models\User;
use App\Support\EmailNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;

class UserController extends Controller
{
    public function getCurrentUser(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updateProfileApi(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();

        $user->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    public function checkAdminAccess(Request $request): JsonResponse
    {
        return response()->json([
            'has_access' => $request->user()->isAdmin(),
            'role' => $request->user()->role,
        ]);
    }

    public function index(): View
    {
        $users = User::paginate(10);

        return view('users.index', compact('users'));
    }

    public function create(): View
    {
        return view('users.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:' . implode(',', UserRole::all()),
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function show(User $user): View
    {
        return view('users.show', compact('user'));
    }

    public function edit(User $user): View
    {
        return view('users.edit', compact('user'));
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:' . implode(',', UserRole::all()),
        ]);

        $user->update($request->only(['name', 'email', 'role']));

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }

    public function getModerators(): JsonResponse
    {
        $moderators = User::where('role', UserRole::MODERATOR)->get();

        return response()->json($moderators);
    }

    public function addModerator(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|regex:/^[^\s@]+@(student\.)?laverdad\.edu\.ph$/',
        ]);

        $normalizedEmail = EmailNormalizer::normalize($request->email);

        $user = User::where('email', $normalizedEmail)->first();

        if (! $user) {
            $tempPassword = Str::password(12);
            $user = User::create([
                'name'              => explode('@', $normalizedEmail)[0],
                'email'             => $normalizedEmail,
                'password'          => Hash::make($tempPassword),
                'role'              => UserRole::MODERATOR,
                'email_verified_at' => now(), // auto-verify so they can log in
            ]);

            return response()->json([
                'message'       => 'Moderator account created. Temporary password: ' . $tempPassword,
                'temp_password' => $tempPassword,
            ], 201);
        }

        if ($user->role === UserRole::MODERATOR) {
            return response()->json(['message' => 'User is already a moderator'], 400);
        }

        $user->update(['role' => UserRole::MODERATOR]);

        return response()->json(['message' => 'Moderator added successfully']);
    }

    public function removeModerator($id): JsonResponse
    {
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        // Prevent self-demotion
        if ($user->id === $currentUser->id) {
            return response()->json(['message' => 'Cannot remove your own moderator role'], 403);
        }

        // Prevent demoting admins
        if ($user->role === UserRole::ADMIN) {
            return response()->json(['message' => 'Cannot demote admin users'], 403);
        }

        if ($user->role !== UserRole::MODERATOR) {
            return response()->json(['message' => 'User is not a moderator'], 400);
        }

        $user->update(['role' => UserRole::USER]);

        return response()->json(['message' => 'Moderator removed successfully']);
    }
}
