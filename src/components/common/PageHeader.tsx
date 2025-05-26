
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {actions && <div className="mt-3 sm:mt-0 flex-shrink-0">{actions}</div>}
      </div>
      {description && <p className="mt-2 text-sm md:text-base text-muted-foreground">{description}</p>}
    </div>
  );
}
