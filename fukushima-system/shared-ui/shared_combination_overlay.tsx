import React from 'react';
import { FragmentList } from './components/FragmentList';
import { InputArea } from './components/InputArea';
import { KnowledgeTree } from './components/KnowledgeTree';

// Shared Combination Overlay Layout
// 7:3 horizontal split, left is split vertically 50:50
export default function SharedCombinationOverlay() {
  return (
    <div className="flex flex-row h-screen w-screen">
      {/* Left 70% */}
      <div className="flex-[0.7] flex flex-col">
        {/* Left Top: FragmentList */}
        <div className="flex-1 overflow-auto bg-[#ffeaea]">
          <div className="h-full w-full p-3">
            <div className="text-sm font-semibold mb-2">FragmentList</div>
            <FragmentList />
          </div>
        </div>
        {/* Left Bottom: InputArea */}
        <div className="flex-1 overflow-auto bg-[#eaf3ff]">
          <div className="h-full w-full p-3">
            <div className="text-sm font-semibold mb-2">InputArea</div>
            <InputArea />
          </div>
        </div>
      </div>
      {/* Right 30%: KnowledgeTree */}
      <div className="flex-[0.3] overflow-auto bg-[#eaffea]">
        <div className="h-full w-full p-3">
          <div className="text-sm font-semibold mb-2">KnowledgeTree</div>
          <KnowledgeTree />
        </div>
      </div>
    </div>
  );
}
