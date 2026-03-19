<?php

namespace App\Http\Controllers;

use App\Constants\UserRole;
use App\Models\Log;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function store(Request $request): Response
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

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'model_type' => 'User',
            'model_id' => $user->id,
            'new_values' => $user->toArray(),
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

    public function update(Request $request, User $user): Response
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:' . implode(',', UserRole::all()),
        ]);

        $oldValues = $user->toArray();

        $user->update($request->only(['name', 'email', 'role']));

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $user->toArray(),
        ]);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): Response
    {
        $oldValues = $user->toArray();

        $user->delete();

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'deleted',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $oldValues,
        ]);

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
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            $tempPassword = Str::password(12);
            $user = User::create([
                'name'              => explode('@', $request->email)[0],
                'email'             => $request->email,
                'password'          => Hash::make($tempPassword),
                'role'              => UserRole::MODERATOR,
                'email_verified_at' => now(), // auto-verify so they can log in
            ]);

            Log::create([
                'user_id'    => Auth::id(),
                'action'     => 'created',
                'model_type' => 'User',
                'model_id'   => $user->id,
                'new_values' => $user->toArray(),
            ]);

            return response()->json([
                'message'       => 'Moderator account created. Temporary password: ' . $tempPassword,
                'temp_password' => $tempPassword,
            ], 201);
        }

        if ($user->role === UserRole::MODERATOR) {
            return response()->json(['message' => 'User is already a moderator'], 400);
        }

        $oldValues = $user->toArray();
        $user->update(['role' => UserRole::MODERATOR]);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $user->toArray(),
        ]);

        return response()->json(['message' => 'Moderator added successfully']);
    }

    public function removeModerator($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->role !== UserRole::MODERATOR) {
            return response()->json(['message' => 'User is not a moderator'], 400);
        }

        $oldValues = $user->toArray();
        $user->update(['role' => UserRole::USER]);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $user->toArray(),
        ]);

        return response()->json(['message' => 'Moderator removed successfully']);
    }
}
