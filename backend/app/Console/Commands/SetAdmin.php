<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class SetAdmin extends Command
{
    protected $signature = 'admin:set {email : The email of the user to grant admin privileges}';
    protected $description = 'Grant admin privileges to a user by email';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("No user found with email: {$email}");
            return Command::FAILURE;
        }

        if ($user->is_admin) {
            $this->warn("User {$email} is already an admin.");
            return Command::SUCCESS;
        }

        $user->update(['is_admin' => true]);

        $this->info("Admin privileges granted to {$user->name} ({$user->email}).");
        return Command::SUCCESS;
    }
}
