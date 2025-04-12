"use client";

import { useState } from "react";
import Image from "next/image";
import { Scissors } from "lucide-react";

export default function LoginIllustration() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative mx-auto mb-8 h-64 w-64 flex items-center justify-center">
      {!imageError ? (
        <Image 
          src="/images/barbershop-illustration.svg" 
          alt="Barbershop Illustration"
          fill
          priority
          className="object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-primary/30 p-6 mb-4">
            <Scissors className="h-20 w-20 text-primary" />
          </div>
          <span className="text-primary font-medium">WalkInOnline</span>
        </div>
      )}
    </div>
  );
} 