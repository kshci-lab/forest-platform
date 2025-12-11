// run_ai.js独自の「考える」「考えない」ボタンのイベントハンドラ
document.addEventListener('click', function(ev){
  const t = ev.target;
  if (!(t && t.classList && (t.classList.contains('ai-aiadvice-consider-btn') || t.classList.contains('ai-aiadvice-skip-btn')))) return;
  try {
    const li = t.closest('.ai-aiadvice-item');
    if (!li) return;
    const key = li.getAttribute('data-key') || '';
    const claim = li.getAttribute('data-claim') || '';
    const adviceText = (li.querySelector('.ai-aiadvice-text')?.textContent || claim || '').replace(/^助言:\s*/, '');
    const isConsider = t.classList.contains('ai-aiadvice-consider-btn');
    try {
      if (typeof window.logEvent === 'function') {
        window.logEvent('advice', isConsider ? 'consider' : 'skip', adviceText || claim);
      }
    } catch(_) {}
    try { localStorage.setItem(String(key), isConsider ? 'consider' : 'skip'); } catch(_) {}
    const statusEl = li.querySelector('.ai-aiadvice-status');
    if (statusEl) statusEl.textContent = isConsider ? '選択: 考える' : '選択: 考えない';
  } catch(e) { console.error('ai-aiadvice button handler failed', e); }
});
function collectTriangleLogic() {
  try {
    const dln = window.defaultLogicNetwork;
    const nodesData = (dln && dln.nodes && typeof dln.nodes.get === 'function') ? dln.nodes.get() : [];
    const trianglesRaw = (dln && Array.isArray(dln.triangles)) ? dln.triangles : [];
    const normTri = (t) => ({
      claim_id:  String(t.claim_id  ?? t.claimId  ?? ''),
      fact_id:   String(t.fact_id   ?? t.factId   ?? ''),
      reason_id: String(t.reason_id ?? t.reasonId ?? ''),
    });
    const triangles = trianglesRaw.map(normTri).filter(t => t.claim_id);

    const byId = new Map(nodesData.map(n => [String(n.id), n]));
    const getNode = (id) => byId.get(String(id));
    const getLabel = (n) => {
      if (!n) return '';
      const cand = [n.label];
      const hit = cand.find(v => typeof v === 'string' && v.trim());
      return hit ? hit.trim().replace(/\s+/g, ' ') : '';
    };
    const wrapId = (id) => {
      const s = String(id ?? '').trim();
      return s ? s : '（未設定）';
    };
    const wrapText = (t) => (t && t.trim()) ? t.trim().replace(/\s+/g, ' ') : '（未設定）';
    // トリプル行のフォーマットを id と内容の両方に変更
    const tripleLine = (claimId, claimText, factId, factText, reasonId, reasonText) =>
      `[claim_id: ${wrapId(claimId)}, claim: ${wrapText(claimText)}, ` +
      `fact_id: ${wrapId(factId)}, fact: ${wrapText(factText)}, ` +
      `reason_id: ${wrapId(reasonId)}, reason: ${wrapText(reasonText)}]`;
    // すべての三角ロジックを単純に列挙（重複や階層の再帰展開は行わない）
    const lines = [];
    for (const tr of triangles) {
      const claimLabel = getLabel(getNode(tr.claim_id));
      const factLabel = getLabel(getNode(tr.fact_id));
      const reasonLabel = getLabel(getNode(tr.reason_id));
      lines.push(tripleLine(tr.claim_id, claimLabel, tr.fact_id, factLabel, tr.reason_id, reasonLabel));
    }
    if (!lines.length) {
      return `[claim_id: （未設定）, claim: （未設定）, ` +
             `fact_id: （未設定）, fact: （未設定）, ` +
             `reason_id: （未設定）, reason: （未設定）]`;
    }
    return lines.join('\n');
  } catch (e) {
    console.error('collectTriangleLogic error:', e);
    return `[claim_id: （未設定）, claim: （未設定）, ` +
           `fact_id: （未設定）, fact: （未設定）, ` +
           `reason_id: （未設定）, reason: （未設定）]`;
  }
}

function runAi() {
  const btn = document.getElementById('run_ai_btn');
  const out = document.getElementById('ai_output');
  const org = btn.textContent;

  // --- シナリオ取得は一時停止（タイトル/本文は送らない） ---
  // const titleEl = document.getElementById('scenario_title');
  // const title = titleEl ? (titleEl.value || titleEl.textContent || '') : '';
  // const bodyEl = document.getElementById('chapter_area');
  // const body = bodyEl ? bodyEl.innerText : '';
  // const scenario = (title ? ('【タイトル】' + title + '\n\n') : '') + (body || '');

  // 三角ロジックだけ送る（トリプル形式の複数行）
  const triangle = collectTriangleLogic();
  console.log('Sending triangle logic to AI:', triangle);
  // 以前は scenario と triangle を送信: JSON.stringify({ scenario, triangle })
  // 一旦 triangle のみ
  btn.disabled = true;
  btn.textContent = '実行中...';
  out.textContent = '';

  fetch('php/post_ai.php?_t=' + Date.now(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      // scenario: scenario, // コメントアウト：シナリオ送信停止
      triangle: triangle
    })
  })
  .then(r => r.ok ? r.json() : Promise.reject(r.status + ' ' + r.statusText))
  .then(j => {
    // LLMからの出力はJSON配列文字列を想定
    let arr = [];
    try {
      const raw = (j && j.output) ? String(j.output) : '[]';
      arr = JSON.parse(raw);
    } catch (e) {
      console.error('AI output JSON.parse failed', e, j && j.output);
      arr = [];
    }

    // ont_claim.js のハンドラ仕様に合わせて描画
    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const attr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
    const items = (Array.isArray(arr) ? arr : [])
      .map(p => {
        const claimId = String(p.claim_id ?? '').trim();
        const claim = String(p.claim ?? '').trim();
        const advice = String(p.advice ?? '').trim();
        // 助言がないものは表示しない（プロンプト仕様）
        if (!advice) return '';
        const rawKey = `aiJsonAdvice|${claimId}|${claim}|${advice}`;
        const key = encodeURIComponent(rawKey);
        let saved = '';
        try { saved = localStorage.getItem(key) || ''; } catch(_) {}
        const statusLabel = saved === 'considered' ? '選択: 考える' : (saved === 'skip' ? '選択: 考えない' : '');

        // 追加ログ（logging.js があれば）
        try { if (typeof window.logEvent === 'function') window.logEvent('advice', 'add', advice || claim); } catch(_) {}

        // [主張]〇〇\n理由 形式で表示
        const adviceText = `[主張]${claim}\n${advice}`;

        return [
          `<li class=\"ai-aiadvice-item\" data-key=\"${key}\"` +
          ` data-claim-id=\"${attr(claimId)}\"` +
          ` data-claim=\"${attr(claim)}\"` +
          ` data-content=\"${attr(claim)}\">`,
          `  <span class=\"ai-aiadvice-text\">${esc(adviceText).replace(/\n/g, '<br>')}</span>`,
          `  <button type=\"button\" class=\"ai-aiadvice-btn ai-aiadvice-consider-btn\">考える</button>`,
          `  <button type=\"button\" class=\"ai-aiadvice-btn ai-aiadvice-skip-btn\">考えない</button>`,
          `  <span class=\"ai-aiadvice-status\">${esc(statusLabel)}</span>`,
          `</li>`
        ].join('');
      })
      .filter(Boolean)
      .join('');
    const html = `<ul class=\"ai-aiadvice-list\">${items}</ul>`;
    out.innerHTML = html;
  })
  .catch(e => { out.textContent = ''; console.error(e); })
  .finally(() => { btn.disabled = false; btn.textContent = org; });
}

// 追加/更新: 「論文シナリオ構成終了」押下時にAIパネルを表示して実行
function finalizeScenarioAndShowAI() {
  try {
    var panel  = document.getElementById('ai_output_panel');
    var body   = document.getElementById('ai_output_body');
    var icon   = document.getElementById('ai_toggle_icon');
    var header = document.getElementById('ai_output_header');

    if (panel) {
      // パネル自体を表示
      if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
      }
    }
    if (panel && body && icon && header) {
      // 本文を開く
      var isClosed = (body.style.display === 'none' || body.style.display === '');
      if (isClosed) {
        body.style.display = 'block';
        icon.textContent = '▼';
        header.setAttribute('aria-expanded', 'true');
      }
      // パネルへスクロール
      try { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    }
  } catch (e) {
    // noop
  }
  // 必ずAI実行
  runAi();
}

// グローバルへ公開（ボタンから呼べるように）
window.finalizeScenarioAndShowAI = finalizeScenarioAndShowAI;

open_empty();
getData();
rebuild_version_area();