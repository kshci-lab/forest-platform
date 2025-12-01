// 助言ダッシュボード統合表示
// 依存: jQuery, getDiffConceptLabels(ont_claim.js), getRationalityStatus(logic_rationality.js)

(function(global){
  'use strict';

  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // クレーム（主張）側の行文面
  function claimLine(type, p){
    if (type === 'map - logic') {
      return `「${esc(p.class_constraint)}」${p.content ? `「${esc(p.content)}」` : ''}この内容を三要素（主張/事実/理由付け）の論理構成に取り込む必要はありませんか`;
    } else if (type === 'map - claim') {
      return `「${esc(p.class_constraint)}」${p.content ? `「${esc(p.content)}」` : ''}この内容を主張として明確化する必要はありませんか`;
    }
    return `「${esc(p.class_constraint)}」${p.content ? `「${esc(p.content)}」` : ''}`;
  }

  // 合理性側の行文面（logic_rationality.jsの方針に合わせて簡略版）
  function rationalityLineNone(e){
    const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
    const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
    return `【none】「コンテント」${nodeTexts}${anchorTexts ? ` 「アンカーのコンテント」${anchorTexts}` : ''}。これらを三角ロジックとして考えなくてよいですか？`;
  }
  function rationalityLineOne(e){
    const nodes = (e.nodes||[]).map(n => `#${esc(n.node_id)} "${esc(n.content)}"`).join(' / ');
    const anchors = (e.anchor_children||[]).map(c => `#${esc(c.node_id)} "${esc(c.content)}"`).join(', ');
    const logic = (e.logic_matches||[]).map(m => `logic#${esc(m.logic_node_id)} "${esc(m.content)}"`).join(' / ');
    return `【one】ノード: ${nodes}${anchors ? `｜アンカー: ${anchors}` : ''}${logic ? `｜対応: ${logic}` : ''}。三角ロジックに反映しなくてよいですか？`;
  }
  function rationalityLineBoth(e){
    const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
    const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
    const logicTexts = (e.logic_matches || []).map(m => `"${esc(m.content)}"`).join(' / ');
    return `【both】「コンテント」${nodeTexts}${anchorTexts ? ` 「アンカー」${anchorTexts}` : ''}${logicTexts ? `｜三角ロジック対応: ${logicTexts}` : ''}。対応内容は適切ですか？`;
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

  // メイン描画
  function renderDashboard($target, claims, rat){
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

    // 理想（定義の提示）
    const idealHtml = `<div>主張: 「map-logic=0」かつ「map-claim=0」。合理性: 全ペアが bothlogic（= bothinlogic）。</div>`;

    // 助言 - first（ないことへの助言）
    const firstHtml = [
      subSection('主張 (map-logic)', list(mapMinusLogic.map(p => claimLine('map - logic', p)))),
      subSection('合理性 (noneinlogic, oneinlogic)', list([].concat(noneArr.map(rationalityLineNone), oneArr.map(rationalityLineOne))))
    ].join('');

    // 助言 - second（あることへの助言）
    const secondHtml = [
      subSection('主張 (map-claim)', list(mapMinusClaim.map(p => claimLine('map - claim', p)))),
      subSection('合理性 (bothlogic)', list(bothArr.map(rationalityLineBoth)))
    ].join('');

    const html = [
      '<div class="advice-dashboard">',
      section('現在', nowHtml),
      section('理想', idealHtml),
      section('三角ロジックにないことに対する助言（first助言）', firstHtml),
      section('三角ロジックにあることに対する助言（second助言）', secondHtml),
      '</div>'
    ].join('');

    $target.html(html);
  }

  function showAdviceDashboard(selector){
    try { $('#advice_panel').show(); } catch(e) {}
    const target = selector || '#advice_output';
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
      // $.whenは各thenの返りを包むが、既に生配列/オブジェクトなのでそのまま扱う
      renderDashboard($target, claims, rat);
    }).fail(function(err){
      console.error('showAdviceDashboard failed:', err);
      $target.html('<div class="error">助言ダッシュボードの取得に失敗しました</div>');
    });
  }

  // 公開
  global.showAdviceDashboard = showAdviceDashboard;

})(window);
