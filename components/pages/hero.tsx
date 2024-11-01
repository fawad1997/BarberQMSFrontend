"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { heroHeader } from "@/config/contents";
import { motion } from "framer-motion";

export default function HeroHeader() {
  return (
    <section className="container flex flex-col gap-4 pb-12 pt-4 text-center lg:items-center lg:gap-8 lg:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="flex flex-1 flex-col items-center gap-4 text-center lg:gap-8"
      >
        <div className="space-y-4">
          <motion.h1 
            className="text-4xl font-bold lg:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {heroHeader.header}
          </motion.h1>
          <motion.h2 
            className="text-lg font-light text-muted-foreground lg:text-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {heroHeader.subheader}
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Link
            href="/register"
            className={`w-[10rem] ${cn(buttonVariants({ size: "lg" }))}`}
          >
            Get Started
          </Link>
        </motion.div>
      </motion.div>
      {heroHeader.image && (
        <motion.div
          className="flex flex-1 justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Image
            src={heroHeader.image}
            width={500}
            height={500}
            alt="Smart Queue Management"
            priority
          />
        </motion.div>
      )}
    </section>
  );
}
