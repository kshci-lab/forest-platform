// 助言ダッシュボード統合表示
// 依存: jQuery, getDiffConceptLabels(ont_claim.js), getRationalityStatus(logic_rationality.js)

(function(global){
  'use strict';

  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function makeActions(category, subcategory, payloadObj){
    try {
      const encoded = encodeURIComponent(JSON.stringify(payloadObj||{}));
      return ` <span class="advice-actions" data-category="${esc(category)}" data-subcategory="${esc(subcategory)}" data-payload="${encoded}">`+
             `<button type="button" class="button4 advice-decide" data-decision="think">考える</button> `+
             `<button type="button" class="button4 advice-decide" data-decision="not_think">考えない</button>`+
             `</span>`;
    } catch(e){
      return '';
    }
  }

  // クレーム（主張）側の行文面
  function claimLine(type, p){
    if (type === 'map - logic') {
      const msg = `教育システム学研究において「${esc(p.class_constraint)}」は重要です．あなたは「${esc(p.class_constraint)}」として${p.content ? `「${esc(p.content)}」` : '内容'}を述べています．これを主張として三角ロジックを作成する必要はありませんか．`;
      const actions = makeActions('ont_claim','map_minus_logic',{ concept_id:p.concept_id, class_constraint:p.class_constraint, content:p.content||'' });
      return msg + actions;
    } else if (type === 'map - claim') {
      const msg = `教育システム学研究において「${esc(p.class_constraint)}」は重要です．あなたは「${esc(p.class_constraint)}」として${p.content ? `「${esc(p.content)}」` : '内容'}を述べています．これを主張として三角ロジックを作成する必要はありませんか．`;
      const actions = makeActions('ont_claim','map_minus_claim',{ concept_id:p.concept_id, class_constraint:p.class_constraint, content:p.content||'' });
      return msg + actions;
    }
    return `「${esc(p.class_constraint)}」${p.content ? `「${esc(p.content)}」` : ''}`;
  }

  // 合理性側の行文面（logic_rationality.jsの方針に合わせて簡略版）
  function rationalityLineNone(e){
    const nodeTexts = (e.nodes || []).map(n => `「${esc(n.content)}」`).join('、');
    const anchorTexts = (e.anchor_children || []).map(c => `「${esc(c.content)}」`).join('、');
    const msg = `あなたは${nodeTexts}の合理性として${anchorTexts ? ` ${anchorTexts}` : ''}を述べています。${nodeTexts}を主張として三角ロジックを作成する必要はありませんか`;
    const actions = makeActions('rationality','noneinlogic',{
      rationality_id: e.rationality_id,
      nodes: (e.nodes||[]).map(n=>({node_id:n.node_id, content:n.content, concept_id:n.concept_id||'', class_constraint:n.class_constraint||''}))
    });
    return msg + actions;
  }
  function rationalityLineOne(e){
    const nodes = (e.nodes||[]).map(n => `#${esc(n.node_id)} "${esc(n.content)}"`).join(' / ');
    const anchors = (e.anchor_children||[]).map(c => `#${esc(c.node_id)} "${esc(c.content)}"`).join(', ');
    const logic = (e.logic_matches||[]).map(m => `logic#${esc(m.logic_node_id)} "${esc(m.content)}"`).join(' / ');
    const msg = `【one】ノード: ${nodes}${anchors ? `｜アンカー: ${anchors}` : ''}${logic ? `｜対応: ${logic}` : ''}。三角ロジックに反映しなくてよいですか？`;
    const actions = makeActions('rationality','oneinlogic',{
      rationality_id: e.rationality_id,
      nodes: (e.nodes||[]).map(n=>({node_id:n.node_id, content:n.content, concept_id:n.concept_id||'', class_constraint:n.class_constraint||''})),
      logic_matches: (e.logic_matches||[]).map(m=>({logic_node_id:m.logic_node_id, f_node_id:m.f_node_id, content:m.content, concept_id:m.concept_id||'', class_constraint:m.class_constraint||''}))
    });
    return msg + actions;
  }
  function rationalityLineBoth(e){
    const nodeTexts = (e.nodes || []).map(n => `「${esc(n.content)}」`).join('、');
    const anchorTexts = (e.anchor_children || []).map(c => `「${esc(c.content)}」`).join('、');
    const logicTexts = (e.logic_matches || []).map(m => `「${esc(m.content)}」`).join('、');
    const msg = `あなたは${nodeTexts}の合理性として${anchorTexts ? ` ${anchorTexts}` : ''}を述べています。${nodeTexts}を主張とした三角ロジックはこれらの内容と整合していますか`;
    const actions = makeActions('rationality','bothinlogic',{
      rationality_id: e.rationality_id,
      nodes: (e.nodes||[]).map(n=>({node_id:n.node_id, content:n.content, concept_id:n.concept_id||'', class_constraint:n.class_constraint||''})),
      logic_matches: (e.logic_matches||[]).map(m=>({logic_node_id:m.logic_node_id, f_node_id:m.f_node_id, content:m.content, concept_id:m.concept_id||'', class_constraint:m.class_constraint||''}))
    });
    return msg + actions;
  }

  function section(title, innerHtml){
    return `<h3>${esc(title)}</h3>${innerHtml}`;
  }

  function subSection(title, innerHtml){
    return `<h4>${esc(title)}</h4>${innerHtml}`;
  }

  function list(items){
    const li = items.map(s => `<li>${s}</li>`).join('');
    return `<ul>${li}</ul>`;
  }

  // メイン描画（stage: 'first-empty' | 'first-content' | 'second' | 'third'）
  function renderDashboard($target, claims, rat, options){
    const opt = Object.assign({ stage: 'first-empty' }, options || {});
    const mapMinusLogic = (claims.mapMinusLogic || []).filter(p => p.class_constraint && p.class_constraint.trim() !== '');
    const mapMinusClaim = (claims.mapMinusClaim || []).filter(p => p.class_constraint && p.class_constraint.trim() !== '');
    const intersection = (claims.intersection || []).filter(p => p.class_constraint && p.class_constraint.trim() !== '');

    const noneArr = rat.noneinlogic || (rat.displayEntries && rat.displayEntries.noneinlogic) || [];
    const oneArr  = rat.oneinlogic  || (rat.displayEntries && rat.displayEntries.oneinlogic)  || [];
    const bothArr = rat.bothinlogic || (rat.displayEntries && rat.displayEntries.bothinlogic) || [];

    // 現在
    const nowClaimsNone = list(mapMinusLogic.map(p => claimLine('map - logic', p)));
    const nowClaimsBoth = list(intersection.map(p => claimLine('intersection', p)));
    const nowRatNone = list([].concat(noneArr.map(rationalityLineNone), oneArr.map(rationalityLineOne)));
    const nowRatBoth = list(bothArr.map(rationalityLineBoth));

    const nowHtml = [
      subSection('主張（ont.claim）', [
        `<div>・三角ロジックにない</div>`, nowClaimsNone,
        `<div>・三角ロジックにある</div>`, nowClaimsBoth
      ].join('')),
      subSection('合理性(rationality)', [
        `<div>・三角ロジックにない</div>`, nowRatNone,
        `<div>・三角ロジックにある</div>`, nowRatBoth
      ].join(''))
    ].join('');

    // 助言 - first（ないことへの助言）
    const firstHtml = [
      subSection('主張 (map-logic)', list(mapMinusLogic.map(p => claimLine('map - logic', p)))),
      subSection('主張 (map-claim)', list(mapMinusClaim.map(p => claimLine('map - claim', p)))),
      subSection('合理性 (noneinlogic, oneinlogic)', list([].concat(noneArr.map(rationalityLineNone), oneArr.map(rationalityLineOne))))
    ].join('');

    // 助言 - second（あることへの助言）
    const secondHtml = [
      subSection('合理性 (bothlogic)', list(bothArr.map(rationalityLineBoth)))
    ].join('');

    const parts = ['<div class="advice-dashboard">'];
    switch (opt.stage) {
      case 'first-empty':
        parts.push(section('三角ロジックにないことに対する助言（first助言）', '<div class="advice-first-intro"><button type="button" class="button4 advice-show-first">first助言を表示</button></div>'));
        break;
      case 'first-content':
        parts.push(section('三角ロジックにないことに対する助言（first助言）', firstHtml));
        parts.push('<div class="advice-next">'
          + '<button type="button" class="button4 advice-show-second">second助言を表示</button>'
          + '</div>');
        break;
      case 'second':
        parts.push(section('三角ロジックにあることに対する助言（second助言）', secondHtml));
        parts.push('<div class="advice-next">'
          + '<button type="button" class="button4 advice-show-third">third助言を表示</button>'
          + '</div>');
        break;
      case 'third':
        parts.push(section('AIからの助言（third助言）', '<div class="advice-third">AI助言を実行しました。結果はAI出力エリアに表示されます。</div>'));
        break;
    }
    parts.push('</div>');
    const html = parts.join('');

    $target.html(html);
  }

  function showAdviceDashboard(selector){
    // 出力先をAI助言の場所に変更し、パネルを開く
    try {
      $('#ai_output_panel').show();
      $('#ai_output_body').show();
    } catch(e) {}
    const target = selector || '#ai_output';
    const $target = $(target);
    if ($target.length === 0) {
      console.warn('描画先が見つかりません:', target);
      return;
    }
    // 並列取得
    $.when(
      (typeof getDiffConceptLabels === 'function') ? getDiffConceptLabels() : $.Deferred().reject('getDiffConceptLabels not found').promise(),
      (typeof getRationalityStatus === 'function') ? getRationalityStatus() : $.Deferred().reject('getRationalityStatus not found').promise()
    ).done(function(claims, rat){
      // キャッシュ
      try {
        $target.data('adviceClaims', claims);
        $target.data('adviceRat', rat);
      } catch(e) {}
      // first/second/third助言ボタンを委譲でバインド（重複防止）
      try {
        // first助言を表示
        $target.off('click.adviceFirst').on('click.adviceFirst', '.advice-show-first', function(){
          const c = $target.data('adviceClaims') || claims;
          const r = $target.data('adviceRat') || rat;
          renderDashboard($target, c, r, { stage: 'first-content' });
        });
        $target.off('click.adviceSecond').on('click.adviceSecond', '.advice-show-second', function(){
          const c = $target.data('adviceClaims') || claims;
          const r = $target.data('adviceRat') || rat;
          // first助言を消し、second助言のみ表示
          renderDashboard($target, c, r, { stage: 'second' });
        });
        $target.off('click.adviceThird').on('click.adviceThird', '.advice-show-third', function(){
          // second助言を消し、third助言のみ表示し、AIを実行
          renderDashboard($target, {}, {}, { stage: 'third' });
          try { if (typeof runAi === 'function') { runAi(); } } catch(e) { console.error(e); }
        });
        // 各質問の「考える/考えない」
        $target.off('click.adviceDecide').on('click.adviceDecide', '.advice-decide', function(){
          const $btn = $(this);
          const decision = String($btn.data('decision')||'');
          const $act = $btn.closest('.advice-actions');
          const category = String($act.data('category')||'');
          const subcategory = String($act.data('subcategory')||'');
          let payload = {};
          try { payload = JSON.parse(decodeURIComponent(String($act.data('payload')||''))); } catch(e) { payload = {}; }
          const record = { ts: new Date().toISOString(), category, subcategory, decision, payload };
          try {
            // フックがあれば呼ぶ
            if (typeof window.logAdviceDecision === 'function') {
              window.logAdviceDecision(record);
            }
            // ローカルにも保持
            const key = 'advice_decisions';
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(key)||'[]'); if (!Array.isArray(arr)) arr = []; } catch(e) { arr = []; }
            arr.push(record);
            localStorage.setItem(key, JSON.stringify(arr));
          } catch(e) {
            console.warn('decision store failed', e);
          }
          // UI 反映
          $act.find('button').prop('disabled', true);
        });
      } catch(e) {}
      // 初期は first 助言のボタンのみ表示
      renderDashboard($target, claims, rat, { stage: 'first-empty' });
    }).fail(function(err){
      console.error('showAdviceDashboard failed:', err);
      $target.html('<div class="error">助言ダッシュボードの取得に失敗しました</div>');
    });
  }

  // 公開
  global.showAdviceDashboard = showAdviceDashboard;

})(window);
