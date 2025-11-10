function collectTriangleLogic() {
  try {
    const dln = window.defaultLogicNetwork;
    // DB復元済みの triangles があればそれを優先して役割を決定
    if (dln && Array.isArray(dln.triangles) && dln.triangles.length > 0) {
      const norm = (t) => ({
        claim_id:  String(t.claim_id  ?? t.claimId  ?? ''),
        reason_id: String(t.reason_id ?? t.reasonId ?? ''),
        fact_id:   String(t.fact_id   ?? t.factId   ?? '')
      });
      const triangles = dln.triangles.map(norm);

      // 選択ノードを含む三角を優先
      const sel = (dln.ownNetwork && typeof dln.ownNetwork.getSelection === 'function')
        ? dln.ownNetwork.getSelection()
        : { nodes: [] };
      const selectedId = sel && Array.isArray(sel.nodes) && sel.nodes.length ? String(sel.nodes[0]) : null;

      let tri = null;
      if (selectedId) {
        tri = triangles.find(t => t.claim_id === selectedId || t.reason_id === selectedId || t.fact_id === selectedId) || null;
      }

      // 見つからなければ「主張レベルが最小」の三角を選ぶ（なければ先頭）
      if (!tri) {
        const getLevel = (id) => {
          try {
            const n = dln.nodes && typeof dln.nodes.get === 'function' ? dln.nodes.get(id) : null;
            return n && typeof n.level !== 'undefined' ? (parseInt(n.level) || 0) : 0;
          } catch { return 0; }
        };
        let best = null;
        let bestLv = Number.POSITIVE_INFINITY;
        for (const t of triangles) {
          const lv = getLevel(t.claim_id);
          if (lv < bestLv) { best = t; bestLv = lv; }
        }
        tri = best || triangles[0];
      }

      const getText = (id) => {
        try {
          const n = dln.nodes && typeof dln.nodes.get === 'function' ? dln.nodes.get(id) : null;
          const cand = [n?.text, n?.label, n?.title, n?.name, n?.content, n?.value, n?.description]
            .filter(v => typeof v === 'string' && v.trim());
          return (cand[0] || '').trim().replace(/\s+/g, ' ');
        } catch { return ''; }
      };
      const wrap = (t) => t && t.length ? t : '（未設定）';

      // 注意: 表示上の役割は入れ替え（reason_id=事実, fact_id=理由付け）
      const fact   = getText(tri.reason_id);
      const reason = getText(tri.fact_id);
      const claim  = getText(tri.claim_id);

      return `事実[${wrap(fact)}]に対して理由付け[${wrap(reason)}]をすることで[${wrap(claim)}]という主張をしている`;
    }

    const d2 = window.defaultLogicNetwork;
    if (!d2) {
      return `事実[（未設定）]に対して理由付け[（未設定）]をすることで[（未設定）]という主張をしている`;
    }
    // 以降は元の処理そのまま
    // データ取得: exportAsJSON/toJSON/vis.js の順でノード・エッジを集約
    const parseMaybe = (x) => {
      if (typeof x === 'string') {
        try { return JSON.parse(x); } catch { return null; }
      }
      return x || null;
    };
    const getData = () => {
      let obj = null;
      if (typeof d2.exportAsJSON === 'function') obj = parseMaybe(d2.exportAsJSON());
      if (!obj && typeof d2.toJSON === 'function') obj = parseMaybe(d2.toJSON());
      if (obj && (obj.nodes || obj.edges)) {
        const nodes = Array.isArray(obj.nodes) ? obj.nodes : (obj.nodes?.get ? obj.nodes.get() : []);
        const edges = Array.isArray(obj.edges) ? obj.edges : (obj.edges?.get ? obj.edges.get() : []);
        return { nodes, edges };
      }
      const net = d2.network;
      const data = net && net.body && net.body.data ? net.body.data : {};
      const nodes = data.nodes && typeof data.nodes.get === 'function' ? data.nodes.get() : [];
      const edges = data.edges && typeof data.edges.get === 'function' ? data.edges.get() : [];
      return { nodes, edges };
    };

    const { nodes, edges } = getData();
    if (!nodes || nodes.length === 0) {
      return `事実[（未設定）]に対して理由付け[（未設定）]をすることで[（未設定）]という主張をしている`;
    }

    const lower = (s) => (s ?? '').toString().toLowerCase();
    const roleHit = (node, names) => {
      if (!node) return false;
      const props = ['role', 'type', 'kind', 'group', 'category', 'label', 'title'];
      for (const p of props) {
        const v = node[p];
        if (typeof v === 'string') {
          const sv = lower(v);
          if (names.some(n => sv.includes(n))) return true;
        }
      }
      return false;
    };
    const getText = (node) => {
      if (!node) return '';
      const cand = [node.text, node.label, node.title, node.name, node.content, node.value, node.description];
      const t = cand.find(v => typeof v === 'string' && v.trim());
      return t ? t.trim().replace(/\s+/g, ' ') : '';
    };

    const factNames   = ['fact', 'facts', 'evidence', 'datum', 'data', '事実', 'ファクト', '根拠'].map(lower);
    const reasonNames = ['reason', 'reasoning', 'warrant', 'logic', '理由', '理由付け', '推論', '論拠'].map(lower);
    const claimNames  = ['claim', 'conclusion', '主張', '結論'].map(lower);

    let factNode   = nodes.find(n => roleHit(n, factNames));
    let reasonNode = nodes.find(n => roleHit(n, reasonNames));
    let claimNode  = nodes.find(n => roleHit(n, claimNames));

    const byId = new Map(nodes.map(n => [n.id, n]));
    const normEdge = (e) => ({ from: e.from ?? e.source, to: e.to ?? e.target });
    if (!claimNode && edges && edges.length) {
      const inDeg = new Map();
      for (const e of edges) {
        const { from, to } = normEdge(e);
        if (from == null || to == null) continue;
        inDeg.set(to, (inDeg.get(to) || 0) + 1);
      }
      let max = -1, maxId = null;
      inDeg.forEach((v, k) => { if (v > max) { max = v; maxId = k; } });
      claimNode = byId.get(maxId);
    }
    if ((!factNode || !reasonNode) && claimNode && edges && edges.length) {
      const preds = edges
        .map(normEdge)
        .filter(e => e.to === claimNode.id)
        .map(e => byId.get(e.from))
        .filter(Boolean);
      const predFact   = preds.find(n => roleHit(n, factNames));
      const predReason = preds.find(n => roleHit(n, reasonNames) && n !== predFact);
      factNode   = factNode || predFact || preds[0];
      reasonNode = reasonNode || predReason || preds.find(n => n !== factNode);
    }

    const fact   = getText(factNode);
    const reason = getText(reasonNode);
    const claim  = getText(claimNode);

    const wrap = (t) => t && t.length ? t : '（未設定）';
    return `事実[${wrap(fact)}]に対して理由付け[${wrap(reason)}]をすることで[${wrap(claim)}]という主張をしている`;
  } catch (e) {
    console.error('collectTriangleLogic error:', e);
    return `事実[（未設定）]に対して理由付け[（未設定）]をすることで[（未設定）]という主張をしている`;
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

  // 三角ロジックだけ送る
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
  .then(j => { out.textContent = (j && j.output) ? j.output : ''; })
  .catch(e => { out.textContent = ''; console.error(e); })
  .finally(() => { btn.disabled = false; btn.textContent = org; });
}

open_empty();
getData();
rebuild_version_area();