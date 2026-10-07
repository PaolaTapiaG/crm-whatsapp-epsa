<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CrmAuditLog;
use App\Models\User;
use App\Services\CrmAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CrmAuthController extends Controller
{
    public function session(Request $request, CrmAuth $auth)
    {
        if (!config('crm.auth_enabled')) {
            return response()->json(['enabled' => false, 'user' => null]);
        }

        $user = $auth->userFromToken($request->bearerToken());
        if (!$user) return response()->json(['enabled' => true, 'user' => null], 401);

        return response()->json(['enabled' => true, 'user' => $user->only('id', 'name', 'email', 'role')]);
    }

    public function login(Request $request, CrmAuth $auth)
    {
        if (!config('crm.auth_enabled')) return response()->json(['error' => 'El acceso por usuarios todavía no está activado.'], 503);
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !$user->active || !Hash::check($data['password'], $user->password)) {
            return response()->json(['error' => 'Correo o contraseña incorrectos.'], 422);
        }

        $token = $auth->issueToken($user);
        CrmAuditLog::create(['user_id' => $user->id, 'action' => 'session.login']);
        return response()->json(['token' => $token, 'user' => $user->only('id', 'name', 'email', 'role')]);
    }

    public function logout(Request $request, CrmAuth $auth)
    {
        CrmAuditLog::create(['user_id' => $request->user()?->id, 'action' => 'session.logout']);
        $auth->revokeToken($request->bearerToken());
        return response()->json(['success' => true]);
    }

    public function users()
    {
        if (!config('crm.auth_enabled')) return response()->json(['error' => 'El acceso por usuarios todavía no está activado.'], 503);
        return response()->json(['data' => User::select('id', 'name', 'email', 'role', 'active')->orderBy('name')->get()]);
    }

    public function team()
    {
        if (!config('crm.auth_enabled')) return response()->json(['data' => []]);
        return response()->json(['data' => User::select('id', 'name', 'role')->where('active', true)->orderBy('name')->get()]);
    }

    public function createUser(Request $request)
    {
        if (!config('crm.auth_enabled')) return response()->json(['error' => 'El acceso por usuarios todavía no está activado.'], 503);
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:12',
            'role' => 'required|in:admin,secretary',
        ]);
        $user = User::create($data);
        CrmAuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'user.create',
            'entity_type' => 'user',
            'entity_id' => (string) $user->id,
            'details' => ['role' => $user->role],
        ]);
        return response()->json(['data' => $user->only('id', 'name', 'email', 'role', 'active')], 201);
    }

    public function audit()
    {
        if (!config('crm.auth_enabled')) return response()->json(['data' => []]);
        return response()->json(['data' => CrmAuditLog::with('user:id,name')->latest()->limit(50)->get()]);
    }
}
