import React from 'react';
import { TemplateList } from './TemplateList';

export function SystemTemplatesPage() {
  const t = {};
  return (
    <div className="max-w-7xl mx-auto">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Builder</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Template Builder</h2>
      </div>
      <div className="mt-6">
        <TemplateList t={t} />
      </div>
    </div>
  );
}
