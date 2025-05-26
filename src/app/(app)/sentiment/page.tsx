"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BrainCircuit, Sparkles, ThumbsUp, ThumbsDown, Meh, Loader2, Info } from "lucide-react";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { analyzeNewsSentimentAction } from "@/lib/actions/sentiment";
import type { AnalyzeSentimentOutput } from "@/ai/flows/sentiment-analysis";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const sentimentFormSchema = z.object({
  text: z.string().min(20, "Text must be at least 20 characters long.").max(5000, "Text must be at most 5000 characters long."),
});
type SentimentFormData = z.infer<typeof sentimentFormSchema>;

interface SentimentResult extends AnalyzeSentimentOutput {
  // No additional fields needed for now
}

const SentimentDisplay: React.FC<{ result: SentimentResult }> = ({ result }) => {
  const sentimentIcon =
    result.sentiment === 'positive' ? <ThumbsUp className="h-6 w-6 text-green-500" /> :
    result.sentiment === 'negative' ? <ThumbsDown className="h-6 w-6 text-red-500" /> :
    <Meh className="h-6 w-6 text-yellow-500" />;
  
  const sentimentColor = 
    result.sentiment === 'positive' ? 'text-green-600' :
    result.sentiment === 'negative' ? 'text-red-600' :
    'text-yellow-600';
  
  // Convert score from -1 to 1 range to 0 to 100 for progress bar
  const progressValue = (result.score + 1) * 50;

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Sentiment Analysis Result
            </CardTitle>
            <Badge variant={
                result.sentiment === 'positive' ? 'default' :
                result.sentiment === 'negative' ? 'destructive' :
                'secondary'
            } className={`capitalize px-3 py-1 text-sm ${
                result.sentiment === 'positive' ? 'bg-green-500/20 text-green-700 border-green-500' :
                result.sentiment === 'negative' ? 'bg-red-500/20 text-red-700 border-red-500' :
                'bg-yellow-500/20 text-yellow-700 border-yellow-500'
            }`}>
                {sentimentIcon}
                <span className="ml-2">{result.sentiment}</span>
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Overall Sentiment</Label>
          <p className={`text-2xl font-semibold ${sentimentColor}`}>{result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Sentiment Score</Label>
          <div className="flex items-center gap-2">
            <Progress value={progressValue} className="w-full h-3" />
            <span className="text-lg font-semibold">{result.score.toFixed(2)}</span>
          </div>
           <p className="text-xs text-muted-foreground">Score ranges from -1 (very negative) to 1 (very positive).</p>
        </div>
        {result.reason && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Reasoning</Label>
            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md border">{result.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function SentimentPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SentimentResult | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SentimentFormData>({
    resolver: zodResolver(sentimentFormSchema),
  });

  const onSubmit: SubmitHandler<SentimentFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    const result = await analyzeNewsSentimentAction(data);
    setIsLoading(false);

    if ('error' in result) {
      toast({ title: "Analysis Error", description: result.error, variant: "destructive" });
    } else if (result) { // Check if result is not undefined (which it shouldn't be based on schema)
      setAnalysisResult(result as SentimentResult); // Cast because 'error' check narrows type
      toast({ title: "Analysis Complete", description: "Sentiment analysis successful." });
      reset(); // Clear the form
    } else {
      // This case should ideally not happen if the action always returns output or error
      toast({ title: "Analysis Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Sentiment Analysis" 
        icon={BrainCircuit} 
        description="Analyze news headlines, articles, or any text to determine its sentiment (positive, negative, or neutral)."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analyze Text Sentiment</CardTitle>
          <CardDescription>Paste the text you want to analyze below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text" className="sr-only">Text to analyze</Label>
              <Textarea
                id="text"
                placeholder="Enter news headline, article snippet, or any text here..."
                rows={8}
                className="resize-none"
                {...register("text")}
              />
              {errors.text && <p className="text-sm text-destructive mt-1">{errors.text.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Analyze Sentiment
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {analysisResult && <SentimentDisplay result={analysisResult} />}

      {!isLoading && !analysisResult && (
        <Card className="border-dashed border-input">
            <CardContent className="p-6 text-center text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Results of the sentiment analysis will appear here.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
