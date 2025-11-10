function collectTriangleLogic() {
  try {
    const dln = window.defaultLogicNetwork;
    const nodesData = (dln && dln.nodes && typeof dln.nodes.get === 'function') ? dln.nodes.get() : [];
    const trianglesRaw = (dln && Array.isArray(dln.triangles)) ? dln.triangles : [];
    const normTri = (t) => ({
      claim_id:  String(t.claim_id  ?? t.claimId  ?? ''),
      reason_id: String(t.reason_id ?? t.reasonId ?? ''),
      fact_id:   String(t.fact_id   ?? t.factId   ?? '')
    });
    const triangles = trianglesRaw.map(normTri).filter(t => t.claim_id);

    const byId = new Map(nodesData.map(n => [String(n.id), n]));
    const getNode = (id) => byId.get(String(id));
    const getLabel = (n) => {
      if (!n) return '';
      const cand = [n.text, n.label, n.title, n.name, n.content, n.value, n.description];
      const hit = cand.find(v => typeof v === 'string' && v.trim());
      return hit ? hit.trim().replace(/\s+/g, ' ') : '';
    };
    const wrap = (t) => t && t.length ? t : '（未設定）';
    const template = (factLabel, reasonLabel, claimLabel) =>
      `事実[${wrap(factLabel)}]に対して理由付け[${wrap(reasonLabel)}]をすることで[${wrap(claimLabel)}]という主張をしている`;

    // level==0 ノードを抽出
    const level0 = nodesData.filter(n => {
      const lv = (typeof n.level !== 'undefined') ? parseInt(n.level) : null;
      return lv === 0;
    });

    const results = [];
    const visitedClaims = new Set(); // 主張ノードとして既に処理したID

    const recurseClaim = (claimId) => {
      if (!claimId || visitedClaims.has(claimId)) return;
      visitedClaims.add(claimId);
      const claimNode = getNode(claimId);
      const claimLabel = getLabel(claimNode);

      // claimId を主張とする三角形群
      const related = triangles.filter(tr => tr.claim_id === claimId);
      if (related.length === 0) {
        // 三角が無くても単独主張としてテンプレ (fact/reason 未設定)
        results.push(template('', '', claimLabel));
        return;
      }

      for (const tr of related) {
        const factLabel = getLabel(getNode(tr.fact_id));
        const reasonLabel = getLabel(getNode(tr.reason_id));
        results.push(template(factLabel, reasonLabel, claimLabel));

        // 6. reason_id, fact_id を新たな主張ノードとして再帰
        if (tr.reason_id) recurseClaim(tr.reason_id);
        if (tr.fact_id) recurseClaim(tr.fact_id);
      }
    };

    // 7. level0 が複数あるなら全て処理
    if (level0.length) {
      for (const n of level0) recurseClaim(String(n.id));
    } else {
      // level0 無ければフォールバック: 全ノードから一つ選んで最低限表示
      const any = nodesData[0];
      if (any) recurseClaim(String(any.id));
    }

    if (!results.length) {
      return '事実[（未設定）]に対して理由付け[（未設定）]をすることで[（未設定）]という主張をしている';
    }
    return results.join('\n');
  } catch (e) {
    console.error('collectTriangleLogic error:', e);
    return '事実[（未設定）]に対して理由付け[（未設定）]をすることで[（未設定）]という主張をしている';
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