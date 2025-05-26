"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircleQuestion, User, Bot, Send, Loader2, Sparkles, Info } from "lucide-react";
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getInvestmentAdviceAction } from "@/lib/actions/assistant";
import type { AiInvestmentAssistantOutput } from "@/ai/flows/ai-investment-assistant";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const assistantFormSchema = z.object({
  query: z.string().min(5, "Query must be at least 5 characters long.").max(500, "Query must be at most 500 characters long."),
});
type AssistantFormData = z.infer<typeof assistantFormSchema>;

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssistantFormData>({
    resolver: zodResolver(assistantFormSchema),
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const initialMessage: Message = {
    id: 'initial-ai-message',
    text: "Hello! I'm your AI Investment Assistant. How can I help you with the market or stocks today?",
    sender: 'ai',
    timestamp: new Date(),
  };

  useEffect(() => {
    setMessages([initialMessage]);
  }, []);


  const onSubmit: SubmitHandler<AssistantFormData> = async (data) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: data.query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    reset();

    const result = await getInvestmentAdviceAction({ query: data.query });
    setIsLoading(false);

    if ('error' in result) {
      toast({ title: "AI Assistant Error", description: result.error, variant: "destructive" });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: `Sorry, I encountered an error: ${result.error}`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } else if (result) {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        text: result.answer,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } else {
      toast({ title: "AI Assistant Error", description: "An unexpected error occurred.", variant: "destructive" });
       const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: "Sorry, I couldn't process your request due to an unexpected error.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] md:max-h-[calc(100vh-10rem)]"> {/* Adjust max height based on your layout */}
      <PageHeader 
        title="AI Investment Assistant" 
        icon={MessageCircleQuestion}
        description="Ask questions about the market, stocks, or investment strategies."
      />

      <Card className="flex-grow flex flex-col shadow-xl overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Chat with AI Assistant
          </CardTitle>
          <CardDescription>Get AI-powered insights for your investment decisions.</CardDescription>
        </CardHeader>
        
        <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Info className="h-12 w-12 mb-4 opacity-50" />
              <p>No messages yet. Start by asking a question below.</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]",
                message.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={message.sender === 'user' ? 'https://placehold.co/40x40.png?text=U' : 'https://placehold.co/40x40.png?text=AI'} data-ai-hint={message.sender === 'user' ? "user avatar" : "ai avatar"}/>
                <AvatarFallback>{message.sender === "user" ? "U" : "AI"}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm shadow",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border" 
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={cn("text-xs mt-1", message.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left')}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
           {isLoading && (
             <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] mr-auto">
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src='https://placehold.co/40x40.png?text=AI' data-ai-hint="ai avatar" />
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 text-sm shadow bg-card border">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
           )}
        </ScrollArea>
        
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
            <Input
              id="query"
              placeholder="Ask about a stock, e.g., 'What's the outlook for AAPL?'"
              className="flex-grow"
              autoComplete="off"
              {...register("query")}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} size="icon" aria-label="Send message">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          {errors.query && <p className="text-sm text-destructive mt-1">{errors.query.message}</p>}
        </div>
      </Card>
    </div>
  );
}
