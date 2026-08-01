import React from "react";
import { Link } from "react-router-dom";

/** @typedef {{ icon: React.ElementType, title: string, subtitle?: string, footer?: React.ReactNode, children?: React.ReactNode }} AuthLayoutProps */

export default function AuthLayout(/** @type {AuthLayoutProps} */ { icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[hsl(27_87%_67%)]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-accent to-[hsl(27_87%_60%)] shadow-glow mb-5 hover:scale-105 transition-transform duration-300">
            <Icon className="w-8 h-8 text-white" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-3xl shadow-lift border border-border/60 p-8 backdrop-blur">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}

