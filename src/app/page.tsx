"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AreaChart, Bot, TrendingUp, Newspaper } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, this would go to a login page or trigger a modal
    router.push('/dashboard');
  };

  const handleSignUp = () => {
    // In a real app, this would go to a sign-up page or trigger a modal
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-background text-center p-6 selection:bg-primary/20 selection:text-primary">
      <header className="mb-12 pt-12">
        <AreaChart className="h-20 w-20 sm:h-24 sm:w-24 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          MarketWatch AI
        </h1>
        <p className="mt-4 sm:mt-6 text-md sm:text-lg leading-7 sm:leading-8 text-muted-foreground max-w-xl sm:max-w-2xl mx-auto">
          Your intelligent partner for navigating the stock market. Get AI-powered insights, track your simulated portfolio, analyze news sentiment, and stay informed.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-12 sm:mb-16">
        <Button size="lg" onClick={handleLogin} className="w-full sm:w-auto px-8 py-3 text-lg">
          Login
        </Button>
        <Button size="lg" variant="outline" onClick={handleSignUp} className="w-full sm:w-auto px-8 py-3 text-lg">
          Sign Up
        </Button>
      </div>

      <section className="w-full max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-foreground">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-card-foreground">Portfolio Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Manage and monitor your simulated stock investments in one place with dynamic updates.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-card-foreground">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Leverage our AI assistant for market queries, investment ideas, and financial advice.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <Newspaper className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-card-foreground">Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Understand market mood by analyzing sentiment from real-time news articles.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MarketWatch AI. All rights reserved.</p>
        <p className="mt-1">For demonstration and simulation purposes only.</p>
      </footer>
    </div>
  );
}
