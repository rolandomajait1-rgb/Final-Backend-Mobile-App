<?php

namespace App\Http\Controllers;

use App\Constants\UserRole;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = Staff::with('user')->paginate(10);

        return response()->json($staff);
    }

    public function create(): View
    {
        return view('staff.create');
    }

    public function store(Request $request): Response
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:' . implode(',', [UserRole::ADMIN, UserRole::MODERATOR, UserRole::EDITOR]),
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        Staff::create([
            'user_id' => $user->id,
            'role' => $request->role,
        ]);

        return redirect()->route('staff.index')->with('success', 'Staff member created successfully.');
    }

    public function show(Staff $staff): View
    {
        return view('staff.show', compact('staff'));
    }

    public function edit(Staff $staff): View
    {
        return view('staff.edit', compact('staff'));
    }

    public function update(Request $request, Staff $staff): Response
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $staff->user_id,
            'role' => 'required|in:' . implode(',', [UserRole::ADMIN, UserRole::MODERATOR, UserRole::EDITOR]),
        ]);

        $oldValues = [
            'name' => $staff->user->name,
            'email' => $staff->user->email,
            'role' => $staff->role,
        ];

        $staff->user->update([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
        ]);

        $staff->update(['role' => $request->role]);

        return redirect()->route('staff.index')->with('success', 'Staff member updated successfully.');
    }

    public function destroy(Staff $staff): Response
    {
        $oldValues = [
            'name' => $staff->user->name,
            'email' => $staff->user->email,
            'role' => $staff->role,
        ];

        $staff->user->delete();
        $staff->delete();

        return redirect()->route('staff.index')->with('success', 'Staff member deleted successfully.');
    }
}
