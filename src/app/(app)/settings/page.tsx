"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Palette, Lock } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('current_username');
  const [email, setEmail] = useState('current_email@example.com');
  // const [password, setPassword] = useState(''); // Password fields are usually not pre-filled or directly managed like this
  const [darkMode, setDarkMode] = useState(false); // Assuming initial state is light mode

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    // In a real app, you'd also apply the theme change here
    // For example, by adding/removing a 'dark' class to the HTML element
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // And persist this preference (e.g., localStorage)
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for changing password (e.g., showing a modal, API call)
    console.log('Change password requested');
    // toast({ title: "Password Change", description: "Password change functionality not implemented yet." });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and application settings."
        icon={User}
      />

      <div className="grid gap-6 md:grid-cols-1"> {/* Simplified to single column for now */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="changePassword">Password</Label>
              <Button
                id="changePassword"
                variant="outline"
                onClick={handleChangePassword}
                className="w-full sm:w-auto"
              >
                <Lock className="mr-2 h-4 w-4" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="font-medium">
                Dark Mode
              </Label>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
                aria-label="Toggle dark mode"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Toggle to switch between light and dark themes.
            </p>
          </CardContent>
        </Card>

        {/* Add more setting sections as needed, e.g., Notifications, API Keys */}
      </div>
    </div>
  );
};

export default SettingsPage;
