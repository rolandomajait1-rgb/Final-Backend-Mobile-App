<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\View\View;

class AboutController extends Controller
{
    public function index(): View
    {
        $staff = Staff::with('user')->get();

        return view('about.index', compact('staff'));
    }
}
