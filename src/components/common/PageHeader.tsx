
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  // PageHeader component content cleared, but structure retained for basic usage.
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title} (Cleared)
        </h1>
      </div>
      {description && <p className="mt-2 text-sm md:text-base text-muted-foreground">{description}</p>}
      {/* Actions part removed for reset */}
    </div>
  );
}
