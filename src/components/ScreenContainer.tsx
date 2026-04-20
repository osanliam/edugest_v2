import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ScreenContainerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function ScreenContainer({
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
  children
}: ScreenContainerProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                {breadcrumb.onClick ? (
                  <button
                    onClick={breadcrumb.onClick}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {breadcrumb.label}
                  </button>
                ) : (
                  <span className="text-slate-900 dark:text-white font-medium">{breadcrumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}
