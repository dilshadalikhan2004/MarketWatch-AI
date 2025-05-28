
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BellRing, Save, Moon, Sun } from 'lucide-react'; // Added Moon and Sun
import { useToast } from "@/hooks/use-toast";

const USERNAME_KEY = 'marketwatch_username';
const EMAIL_KEY = 'marketwatch_email';
const MARKET_ALERTS_KEY = 'marketwatch_market_alerts_enabled';
const NEWS_DIGEST_KEY = 'marketwatch_news_digest_enabled';
const THEME_KEY = 'marketwatch_theme';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  const [marketAlertsEnabled, setMarketAlertsEnabled] = useState(false);
  const [newsDigestEnabled, setNewsDigestEnabled] = useState(true);
  const [isDarkModeActive, setIsDarkModeActive] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load saved settings from localStorage
    const savedUsername = localStorage.getItem(USERNAME_KEY);
    const savedEmail = localStorage.getItem(EMAIL_KEY);
    const savedMarketAlerts = localStorage.getItem(MARKET_ALERTS_KEY);
    const savedNewsDigest = localStorage.getItem(NEWS_DIGEST_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedUsername) setUsername(savedUsername);
    else setUsername('current_username'); 

    if (savedEmail) setEmail(savedEmail);
    else setEmail('current_email@example.com'); 
    
    if (savedMarketAlerts) setMarketAlertsEnabled(JSON.parse(savedMarketAlerts));
    if (savedNewsDigest) setNewsDigestEnabled(JSON.parse(savedNewsDigest));
    else setNewsDigestEnabled(true); // Default to true if not found

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkModeActive(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkModeActive(false);
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleUpdateProfile = () => {
    if (!isMounted) return;
    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(EMAIL_KEY, email);
    toast({
      title: "Profile Updated",
      description: "Your username and email have been saved.",
    });
  };
  
  const handleMarketAlertsChange = (checked: boolean) => {
    if (!isMounted) return;
    setMarketAlertsEnabled(checked);
    localStorage.setItem(MARKET_ALERTS_KEY, JSON.stringify(checked));
    toast({
      title: "Notification Settings Updated",
      description: `Market Down Alerts ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleNewsDigestChange = (checked: boolean) => {
    if (!isMounted) return;
    setNewsDigestEnabled(checked);
    localStorage.setItem(NEWS_DIGEST_KEY, JSON.stringify(checked));
     toast({
      title: "Notification Settings Updated",
      description: `Investment News Updates ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleDarkModeChange = (checked: boolean) => {
    if (!isMounted) return;
    setIsDarkModeActive(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
     toast({
      title: "Appearance Updated",
      description: `Dark mode ${checked ? 'enabled' : 'disabled'}.`,
    });
  };
  
  if (!isMounted) {
    // Render a skeleton or null until settings are loaded from localStorage to avoid hydration issues
    return null; 
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and application settings."
        icon={User}
      />

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details. Changes are saved locally.</CardDescription>
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
            <Button onClick={handleUpdateProfile} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Update Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose which notifications you'd like to receive. Preferences are saved locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="marketAlerts" className="font-medium">
                  Market Down Alerts
                </Label>
                <p className="text-xs text-muted-foreground">Receive alerts when the market shows significant downturns.</p>
              </div>
              <Switch
                id="marketAlerts"
                checked={marketAlertsEnabled}
                onCheckedChange={handleMarketAlertsChange}
                aria-label="Toggle market down alerts"
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="newsDigest" className="font-medium">
                  Investment News Updates
                </Label>
                <p className="text-xs text-muted-foreground">Get periodic updates with recent news regarding investments and stocks.</p>
              </div>
              <Switch
                id="newsDigest"
                checked={newsDigestEnabled}
                onCheckedChange={handleNewsDigestChange}
                aria-label="Toggle investment news updates"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDarkModeActive ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="darkMode" className="font-medium">
                Dark Mode
              </Label>
              <Switch
                id="darkMode"
                checked={isDarkModeActive}
                onCheckedChange={handleDarkModeChange}
                aria-label="Toggle dark mode"
              />
            </div>
             <p className="text-xs text-muted-foreground mt-2 px-3">
              Toggle to switch between light and dark themes. Your preference is saved locally.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default SettingsPage;
