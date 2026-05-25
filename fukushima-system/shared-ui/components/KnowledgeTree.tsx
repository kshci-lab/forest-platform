import React from 'react';

export const KnowledgeTree: React.FC = () => {
  // Placeholder static tree
  return (
    <ul className="text-sm list-disc pl-4">
      <li>知の断片 A
        <ul className="list-circle pl-4">
          <li>派生 A-1</li>
          <li>派生 A-2</li>
        </ul>
      </li>
      <li>知の断片 B
        <ul className="list-circle pl-4">
          <li>派生 B-1</li>
        </ul>
      </li>
      <li>知の断片 C</li>
    </ul>
  );
};
