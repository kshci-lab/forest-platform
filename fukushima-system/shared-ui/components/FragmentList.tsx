import React from 'react';

export const FragmentList: React.FC = () => {
  // Placeholder list; replace with real data wiring later
  const items = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    title: `Fragment #${i + 1}`,
    summary: 'サマリーテキスト（ダミー）',
  }));

  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map((it) => (
        <div key={it.id} className="rounded border border-gray-200 bg-white p-2 shadow-sm">
          <div className="text-xs text-gray-500">{it.title}</div>
          <div className="text-sm">{it.summary}</div>
        </div>
      ))}
    </div>
  );
};
