
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, Send, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInvestmentAdviceAction } from '@/lib/actions/assistant';
import type { AiInvestmentAssistantOutput } from '@/ai/flows/ai-investment-assistant';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if(scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Initial welcome message from assistant
    setMessages([
      {
        id: 'initial-assistant-msg',
        role: 'assistant',
        content: "Hello! I'm your AI Investment Assistant. How can I help you with your investment queries today?",
        timestamp: new Date(),
      }
    ]);
  }, []);


  const handleSendMessage = async () => {
    if (!inputQuery.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputQuery,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    const result = await getInvestmentAdviceAction({ query: userMessage.content });
    
    let assistantResponseContent = "Sorry, I couldn't process that request.";
    if ('error' in result) {
      assistantResponseContent = result.error || "An unknown error occurred.";
    } else if (result.answer) {
      assistantResponseContent = result.answer;
    }

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantResponseContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,8rem))] w-full"> {/* Adjust header-height as needed */}
      <PageHeader
        title="AI Investment Assistant"
        description="Get AI-powered insights and advice for your investment decisions."
        icon={Bot}
        className="flex-shrink-0"
      />

      <Card className="flex-grow flex flex-col shadow-lg overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat with MarketWatch AI
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow p-0" ref={scrollAreaRef}>
          <CardContent className="p-4 space-y-4 ">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 max-w-[85%]",
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <Avatar className="h-8 w-8 border">
                   <AvatarImage src={msg.role === 'assistant' ? '/placeholder-bot.png' : '/placeholder-user.png'} alt={msg.role} />
                  <AvatarFallback>
                    {msg.role === 'user' ? <User /> : <Bot />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "p-3 rounded-lg shadow-sm text-sm",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  <p className={cn(
                      "text-xs mt-1",
                       msg.role === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'
                    )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 mr-auto">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg shadow-sm bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>
        <CardFooter className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex w-full items-center gap-2"
          >
            <Input
              placeholder="Ask about market trends, stock performance, etc."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading || !inputQuery.trim()}>
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
