"use client";

import Link from "next/link";
import type { Route } from "next";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Button, type buttonVariants } from "@/components/ui/button";

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Button rendered as a next/link. Base UI's Button defaults to `nativeButton`,
 * so links must opt out explicitly to keep anchor semantics.
 */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: {
  href: Route | string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Button>, "render" | "variant" | "size">) {
  return (
    <Button
      variant={variant}
      size={size}
      nativeButton={false}
      render={<Link href={href as Route} />}
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
}