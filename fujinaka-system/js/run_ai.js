function runAi() {
  const btn = document.getElementById('run_ai_btn');
  const out = document.getElementById('ai_output');
  const org = btn.textContent;

  const titleEl = document.getElementById('scenario_title');
  const title = titleEl ? (titleEl.value || titleEl.textContent || '') : '';
  const bodyEl = document.getElementById('chapter_area');
  const body = bodyEl ? bodyEl.innerText : '';
  const scenario = (title ? ('【タイトル】' + title + '\n\n') : '') + (body || '');

  btn.disabled = true;
  btn.textContent = '実行中...';
  out.textContent = '';

  fetch('php/post_ai.php?_t=' + Date.now(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ scenario })
  })
  .then(r => r.ok ? r.json() : Promise.reject(r.status + ' ' + r.statusText))
  .then(j => { out.textContent = (j && j.output) ? j.output : ''; })
  .catch(e => { out.textContent = ''; console.error(e); })
  .finally(() => { btn.disabled = false; btn.textContent = org; });
}

open_empty();
getData();
rebuild_version_area();