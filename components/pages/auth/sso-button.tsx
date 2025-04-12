"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { getApiEndpoint } from "@/lib/utils/api-config";

interface SSOButtonProps {
  provider: "google" | "facebook" | "microsoft";
  className?: string;
}

export default function SSOButton({ provider, className }: SSOButtonProps) {
  const handleSSOLogin = () => {
    // Redirect to the backend SSO endpoint
    window.location.href = getApiEndpoint(`sso/${provider}/login`);
  };

  const renderProviderIcon = () => {
    switch (provider) {
      case "google":
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path
                d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                fill="#4285F4"
              />
            </g>
          </svg>
        );
      case "facebook":
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              fill="#1877F2"
            />
          </svg>
        );
      case "microsoft":
        return (
          <svg viewBox="0 0 23 23" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getProviderText = () => {
    switch (provider) {
      case "google":
        return "Continue with Google";
      case "facebook":
        return "Continue with Facebook";
      case "microsoft":
        return "Continue with Microsoft";
      default:
        return "Continue with SSO";
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSSOLogin}
      className={`flex items-center justify-center gap-2 w-full ${className || ""}`}
    >
      {renderProviderIcon()}
      {getProviderText()}
    </Button>
  );
} 