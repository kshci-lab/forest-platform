import React from 'react';

export const InputArea: React.FC = () => {
  return (
    <form className="flex flex-col gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">追加する領域</label>
        <input type="text" className="w-full rounded border border-gray-300 p-2" placeholder="領域名" />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">コメント</label>
        <textarea className="w-full rounded border border-gray-300 p-2" rows={4} placeholder="メモや説明など" />
      </div>
      <div className="flex justify-end">
        <button type="button" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">登録</button>
      </div>
    </form>
  );
};
