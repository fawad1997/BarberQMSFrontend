"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";

interface ApiErrorProps {
  title?: string;
  message: string;
  statusCode?: number;
  error?: Error | unknown;
  onRetry?: () => void;
  showBackButton?: boolean;
  backPath?: string;
}

export function ApiError({
  title = "Error",
  message,
  statusCode,
  error,
  onRetry,
  showBackButton = true,
  backPath = "/shop/dashboard",
}: ApiErrorProps) {
  const router = useRouter();
  
  // Extract error details
  let errorDetails = null;
  let errorName = null;
  
  if (error instanceof Error) {
    errorName = error.name;
    errorDetails = error.stack;
    if ('cause' in error && error.cause) {
      errorDetails = `Caused by: ${String(error.cause)}\n${errorDetails || ''}`;
    }
  }
  
  // Format error details for display
  const formatErrorDetails = () => {
    let details = "";
    
    if (statusCode) {
      details += `Status Code: ${statusCode}\n`;
    }
    
    if (errorName) {
      details += `Error Type: ${errorName}\n`;
    }
    
    if (errorDetails) {
      details += `\n${errorDetails}`;
    }
    
    return details.trim();
  };
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };
  
  const handleBack = () => {
    router.push(backPath);
  };
  
  return (
    <Card className="mx-auto max-w-2xl border-destructive/20">
      <CardHeader className="bg-destructive/10">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{title}</CardTitle>
        </div>
        <CardDescription className="text-destructive/90">
          {message}
        </CardDescription>
      </CardHeader>
      {(errorDetails || statusCode) && (
        <CardContent className="pt-4">
          <details>
            <summary className="cursor-pointer font-medium text-sm mb-2">Technical Details</summary>
            <pre className="text-xs overflow-auto p-3 bg-slate-100 dark:bg-slate-900 rounded whitespace-pre-wrap">
              {formatErrorDetails()}
            </pre>
          </details>
        </CardContent>
      )}
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleRetry}
          className="gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
        {showBackButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 