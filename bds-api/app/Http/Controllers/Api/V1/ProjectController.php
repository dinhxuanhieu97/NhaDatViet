<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $projects = Project::query()
            ->with(['province:id,name,slug', 'district:id,name,slug'])
            ->when($request->query('q'), fn ($q, $kw) => $q->where('name', 'like', "%{$kw}%"))
            ->when($request->query('province_id'), fn ($q, $id) => $q->where('province_id', $id))
            ->when($request->query('district_id'), fn ($q, $id) => $q->where('district_id', $id))
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->withCount(['properties' => fn ($q) => $q->public()])
            ->orderByDesc('is_featured')
            ->orderBy('name')
            ->paginate(min((int) $request->query('per_page', 20), 50))
            ->withQueryString();

        return ProjectResource::collection($projects);
    }

    public function show(Project $project): ProjectResource
    {
        $project->load(['province:id,name,slug', 'district:id,name,slug'])
            ->loadCount(['properties' => fn ($q) => $q->public()]);

        return new ProjectResource($project);
    }
}
