<?php

namespace App\Http\Controllers;

use App\Models\Draft;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DraftController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            $drafts = Draft::with('author.user')->paginate(10);
        } else {
            $author = $user->author;
            if (! $author) {
                return response()->json(['error' => 'Author profile not found for this user'], 404);
            }
            $drafts = Draft::with('author.user')->where('author_id', $author->id)->paginate(10);
        }

        return response()->json($drafts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $author = Auth::user()->author;
        if (! $author) {
            return response()->json(['error' => 'Author profile not found for this user'], 404);
        }

        $draft = Draft::create([
            'title'     => $validated['title'],
            'content'   => $validated['content'],
            'author_id' => $author->id,
        ]);

        Log::create([
            'user_id'    => Auth::id(),
            'action'     => 'created',
            'model_type' => 'Draft',
            'model_id'   => $draft->id,
            'new_values' => $draft->toArray(),
        ]);

        return response()->json($draft->load('author.user'), 201);
    }

    public function show(Draft $draft): JsonResponse
    {
        return response()->json($draft->load('author.user'));
    }

    public function update(Request $request, Draft $draft): JsonResponse
    {
        $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $oldValues = $draft->toArray();

        $draft->update($request->only(['title', 'content']));

        Log::create([
            'user_id'    => Auth::id(),
            'action'     => 'updated',
            'model_type' => 'Draft',
            'model_id'   => $draft->id,
            'old_values' => $oldValues,
            'new_values' => $draft->toArray(),
        ]);

        return response()->json($draft->load('author.user'));
    }

    public function destroy(Draft $draft): JsonResponse
    {
        $oldValues = $draft->toArray();

        $draft->delete();

        Log::create([
            'user_id'    => Auth::id(),
            'action'     => 'deleted',
            'model_type' => 'Draft',
            'model_id'   => $draft->id,
            'old_values' => $oldValues,
        ]);

        return response()->json(['message' => 'Draft deleted successfully']);
    }
}
