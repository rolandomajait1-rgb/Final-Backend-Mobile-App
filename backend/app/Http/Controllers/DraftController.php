<?php

namespace App\Http\Controllers;

use App\Models\Draft;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class DraftController extends Controller
{
    public function index(): JsonResponse
    {
        if (Auth::user()->isAdmin()) {
            $drafts = Draft::with('author.user')->paginate(10);
        } else {
            $drafts = Draft::with('author.user')->where('author_id', Auth::user()->author->id)->paginate(10);
        }

        return response()->json($drafts);
    }

    public function create(): View
    {
        return view('drafts.create');
    }

    public function store(Request $request): Response
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $draft = Draft::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'author_id' => Auth::user()->author->id,
        ]);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'model_type' => 'Draft',
            'model_id' => $draft->id,
            'new_values' => $draft->toArray(),
        ]);

        return redirect()->route('drafts.index')->with('success', 'Draft created successfully.');
    }

    public function show(Draft $draft): View
    {
        return view('drafts.show', compact('draft'));
    }

    public function edit(Draft $draft): View
    {
        return view('drafts.edit', compact('draft'));
    }

    public function update(Request $request, Draft $draft): Response
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $oldValues = $draft->toArray();

        $draft->update($request->all());

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'Draft',
            'model_id' => $draft->id,
            'old_values' => $oldValues,
            'new_values' => $draft->toArray(),
        ]);

        return redirect()->route('drafts.index')->with('success', 'Draft updated successfully.');
    }

    public function destroy(Draft $draft): Response
    {
        $oldValues = $draft->toArray();

        $draft->delete();

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'deleted',
            'model_type' => 'Draft',
            'model_id' => $draft->id,
            'old_values' => $oldValues,
        ]);

        return redirect()->route('drafts.index')->with('success', 'Draft deleted successfully.');
    }
}
