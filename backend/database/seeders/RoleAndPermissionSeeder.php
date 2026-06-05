<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================
        // Create Permissions
        // ============================================
        $permissions = [
            // Admin
            ['name' => 'admin.access', 'label' => 'Access admin panel', 'group' => 'admin'],
            ['name' => 'users.manage', 'label' => 'Manage users', 'group' => 'admin'],
            ['name' => 'roles.manage', 'label' => 'Manage roles', 'group' => 'admin'],
            ['name' => 'system.settings', 'label' => 'Manage system settings', 'group' => 'admin'],
            ['name' => 'audit.view', 'label' => 'View audit logs', 'group' => 'admin'],

            // Conversation
            ['name' => 'conversation.create', 'label' => 'Create conversation', 'group' => 'conversation'],
            ['name' => 'conversation.read', 'label' => 'Read conversations', 'group' => 'conversation'],
            ['name' => 'conversation.update', 'label' => 'Update conversation', 'group' => 'conversation'],
            ['name' => 'message.send', 'label' => 'Send messages', 'group' => 'conversation'],
            ['name' => 'mention.create', 'label' => 'Mention users', 'group' => 'conversation'],

            // Ticket
            ['name' => 'ticket.create', 'label' => 'Create ticket', 'group' => 'ticket'],
            ['name' => 'ticket.read', 'label' => 'Read tickets', 'group' => 'ticket'],
            ['name' => 'ticket.update', 'label' => 'Update ticket', 'group' => 'ticket'],
            ['name' => 'ticket.assign', 'label' => 'Assign ticket', 'group' => 'ticket'],
            ['name' => 'ticket.status_change', 'label' => 'Change ticket status', 'group' => 'ticket'],

            // Division
            ['name' => 'division.create', 'label' => 'Create division', 'group' => 'division'],
            ['name' => 'division.manage', 'label' => 'Manage division members', 'group' => 'division'],

            // Knowledge Base
            ['name' => 'kb.create', 'label' => 'Create knowledge article', 'group' => 'kb'],
            ['name' => 'kb.publish', 'label' => 'Publish knowledge article', 'group' => 'kb'],

            // Reports
            ['name' => 'reports.view', 'label' => 'View reports', 'group' => 'reports'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // ============================================
        // Create Roles
        // ============================================
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['label' => 'Administrator', 'description' => 'System administrator with full access']
        );

        $managerRole = Role::firstOrCreate(
            ['name' => 'manager'],
            ['label' => 'Manager', 'description' => 'Division manager with team oversight']
        );

        $staffRole = Role::firstOrCreate(
            ['name' => 'staff'],
            ['label' => 'Staff', 'description' => 'Operational staff handling tickets and tasks']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['label' => 'User', 'description' => 'Regular user who creates requests']
        );

        $observerRole = Role::firstOrCreate(
            ['name' => 'observer'],
            ['label' => 'Observer', 'description' => 'Read-only viewer (CTO, CEO, Auditor)']
        );

        // ============================================
        // Assign Permissions to Roles
        // ============================================

        // Admin: all permissions
        $adminRole->permissions()->sync(Permission::pluck('id'));

        // Manager: manage team + tickets + reports
        $managerRole->permissions()->sync(
            Permission::whereIn('name', [
                'conversation.create', 'conversation.read', 'conversation.update',
                'message.send', 'mention.create',
                'ticket.create', 'ticket.read', 'ticket.update', 'ticket.assign', 'ticket.status_change',
                'division.create', 'division.manage',
                'kb.create', 'kb.publish',
                'reports.view',
            ])->pluck('id')
        );

        // Staff: handle tickets
        $staffRole->permissions()->sync(
            Permission::whereIn('name', [
                'conversation.create', 'conversation.read', 'conversation.update',
                'message.send', 'mention.create',
                'ticket.read', 'ticket.update', 'ticket.status_change',
                'kb.create',
            ])->pluck('id')
        );

        // User: basic
        $userRole->permissions()->sync(
            Permission::whereIn('name', [
                'conversation.create', 'conversation.read',
                'message.send', 'mention.create',
                'ticket.create', 'ticket.read',
            ])->pluck('id')
        );

        // Observer: read-only
        $observerRole->permissions()->sync(
            Permission::whereIn('name', [
                'conversation.read',
                'ticket.read',
            ])->pluck('id')
        );

        // ============================================
        // Create Default Users
        // ============================================
        if (!User::where('email', 'admin@aicop.local')->exists()) {
            $admin = User::create([
                'name' => 'System Admin',
                'email' => 'admin@aicop.local',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
            $admin->roles()->attach($adminRole);
        }

        if (!User::where('email', 'manager@aicop.local')->exists()) {
            $manager = User::create([
                'name' => 'John Manager',
                'email' => 'manager@aicop.local',
                'username' => 'john.manager',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
            $manager->roles()->attach($managerRole);
        }

        if (!User::where('email', 'staff@aicop.local')->exists()) {
            $staff = User::create([
                'name' => 'Sarah Staff',
                'email' => 'staff@aicop.local',
                'username' => 'sarah.staff',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
            $staff->roles()->attach($staffRole);
        }

        if (!User::where('email', 'user@aicop.local')->exists()) {
            $regular = User::create([
                'name' => 'Regular User',
                'email' => 'user@aicop.local',
                'username' => 'user',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
            $regular->roles()->attach($userRole);
        }

        if (!User::where('email', 'observer@aicop.local')->exists()) {
            $observer = User::create([
                'name' => 'Observer User',
                'email' => 'observer@aicop.local',
                'username' => 'observer',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);
            $observer->roles()->attach($observerRole);
        }
    }
}
