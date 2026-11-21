(() => {
  'use strict';
  const D = window.CAREER_ADVICE_V6, $ = s => document.querySelector(s);
  if (!D) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const value = v => v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.map(value).join('；') : typeof v === 'object' ? Object.values(v).map(value).join('；') : String(v);
  const arr = v => Array.isArray(v) ? v : v ? [v] : [];
  const safe = u => {try {const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : '#';} catch {return '#';}};
  const list = v => `<ul class="ad-list">${arr(v).map(x => `<li>${esc(value(x))}</li>`).join('')}</ul>`;
  const section = (title, body) => ["匹配点与待补能力","本次核验与申请入口","专业与招聘条件","下一步怎么做"].includes(title) ? `<section class="drawer-section"><h3>${title}</h3>${body}</section>` : `<details class="drawer-more"><summary>${title}</summary>${body}</details>`;
  const line = (label, text) => text ? `<div class="ad-detail-line"><b>${label}</b><p>${esc(value(text))}</p></div>` : '';
  const name = p => p === 'male' ? '男方' : p === 'female' ? '女方' : '双方';
  const cases = D.cases, caseMap = new Map(cases.map(c => [c.id, c])), byJob = new Map();
  cases.forEach(c => (c.jobIds || []).forEach(id => {if (!byJob.has(id)) byJob.set(id, []); byJob.get(id).push(c);}));
  window.CAREER_CASE_JOB_IDS = new Set(byJob.keys());
  window.CAREER_CASE_SOURCE_IDS = new Set(cases.flatMap(c => c.sourceRecordIds || []));
  window.CAREER_DETAIL_ADVICE = id => !byJob.has(id) ? '' : section('岗位对照研究 · 新补充', `<p>以下研究用于比较相同岗位名称或相关任务。城市、专业、薪资与届别仍按各案例的具体来源核实。</p>${byJob.get(id).map(c => `<button class="ad-related" data-case="${esc(c.id)}"><b>${esc(c.title)}</b><span>${esc(c.company)} · ${esc(c.priority)}</span><small>${esc(c.verdict)}</small></button>`).join('')}`);
  let api, selected = [], tab = 'routes', answers = {}, completed = {};
  try {answers = JSON.parse(localStorage.getItem('careerFullAnswersV6') || '{}'); completed = JSON.parse(localStorage.getItem('careerFullActionsV6') || '{}');} catch {}
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) answers = {};
  if (!completed || typeof completed !== 'object' || Array.isArray(completed)) completed = {};
  const save = (key, obj) => {try {localStorage.setItem(key, JSON.stringify(obj)); return true;} catch {return false;}};
  function download(filename, content, mime = 'application/json') {const u = URL.createObjectURL(new Blob([content], {type:mime})); const a = document.createElement('a'); a.href = u; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);}
  function remember() {const u = new URL(location.href); u.searchParams.set('adviceTab', tab); ['person','priority','city','query','freshness'].forEach(k => {const val = $('#ad-'+k).value; if (val && val !== 'all') u.searchParams.set('case'+k, val); else u.searchParams.delete('case'+k);}); history.replaceState(null, '', u);}
  function setTab(id, persist = true) {tab = ['routes','cases','cities','actions'].includes(id) ? id : 'routes'; $('#view-advice').classList.toggle('ad-focused',tab !== 'routes'); document.querySelectorAll('[data-ad-panel]').forEach(e => e.hidden = e.dataset.adPanel !== tab); document.querySelectorAll('[data-ad-tab]').forEach(e => {e.classList.toggle('active', e.dataset.adTab === tab); e.setAttribute('aria-selected', e.dataset.adTab === tab); e.tabIndex = e.dataset.adTab === tab ? 0 : -1;}); if (persist) remember();}
  function sourceList(sources) {return arr(sources).map(s => `<div class="ad-source"><a href="${esc(safe(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.label || s.url)} ↗</a><small>${esc(value(s.type || s.level || '来源'))} · 查阅 ${esc(s.checked || '日期未记录')}</small>${s.claims?.length ? `<p>支持：${esc(value(s.claims))}</p>` : ''}</div>`).join('');}
  function openCase(id) {
    const c = caseMap.get(id); if (!c) return;
    const body = `<div class="ad-verdict"><span>${esc(c.priority)} · ${name(c.person)}</span><p>${esc(c.verdict)}</p></div>` +
      section('匹配点与待补能力', `<div class="ad-detail-two"><div><h4>为什么值得看</h4>${list(c.why)}</div><div><h4>目前缺口</h4>${list(c.gaps)}</div></div>`) +
      section('本次核验与申请入口', line('状态', c.currentStatus || '历史研究参考，未在本次重新核验') + line('核验日期', c.checked || ('未独立记录；来源日期：'+(window.CAREER_CASE_RULES.classify(c).checked || '未记录'))) + line('申请截止', c.deadline || '以具体来源说明为准；历史样本不视为当前在招') + (c.applicationUrl ? `<a class="btn primary" href="${esc(safe(c.applicationUrl))}" target="_blank" rel="noopener noreferrer">官方岗位 / 申请入口 ↗</a>` : '')) +
      section('专业与招聘条件', line('已经读到', c.eligibility?.known) + line('仍需核实', c.eligibility?.unknown) + line('历史批次参考', c.eligibility?.reference2028)) +
      section('薪资与目标的距离', line('来源实际披露', c.salary?.evidence) + line('适用口径', c.salary?.scope) + line('对你们的判断', c.salary?.targetAssessment) + line('证据充分程度', c.salary?.confidence)) +
      section('工作方式 · 三种信息分开看', line('已读事实', c.workload?.facts) + line('基于职责的推断', c.workload?.inference) + line('未知，需要向团队询问', c.workload?.unknown)) +
      section('发展路径与代价', line('可积累的能力', c.development?.upside) + line('需要接受的取舍', c.development?.tradeoff)) +
      section('下一步怎么做', list(c.actions)) + section('面试和沟通时具体问什么', list(c.interviewQuestions)) +
      section('证据与适用边界', sourceList(c.sources) + `<p class="ad-limit">${esc(value(c.limitations))}</p>`) +
      section('回到全量参考表', `<p>下面的链接用于历史对照。外部新JD与原表公告的批次、地点和用工条件可能不同。</p><div class="ad-reference-links">${(c.jobIds || []).map(j => `<button class="btn small" data-open-job="${esc(j)}">${esc(api.job(j)?.title || '关联岗位参考')} →</button>`).join('')}${(c.sourceRecordIds || []).slice(0,8).map(r => `<button class="btn small" data-open-row="${esc(r)}">原记录 ${esc(r)} →</button>`).join('')}</div>${!(c.jobIds?.length || c.sourceRecordIds?.length) ? '<p>官网 / 其他来源补充案例，未强行对应原表中不同机构或不同岗位。</p>' : ''}`);
    api.openDrawer(c.title, `岗位精读 · ${name(c.person)} · ${window.CAREER_CASE_RULES.classify(c).checked || '日期未记录'}`, `${c.company} · ${(c.cities || []).join(' / ') || '地点待核'}`, body, 'case-'+c.id);
  }
  function renderCases() {
    const p=$('#ad-person').value,priority=$('#ad-priority').value,city=$('#ad-city').value,q=$('#ad-query').value.trim().toLowerCase(),freshness=$('#ad-freshness').value,R=window.CAREER_CASE_RULES;
    const result=cases.filter(c=>(p==='all'||c.person===p||c.person==='both')&&(priority==='all'||c.priority===priority)&&(city==='all'||c.cities.some(x=>x.includes(city)))&&R.inRange(c,freshness)&&(!q||q.split(/\s+/).every(t=>[c.company,c.title,c.verdict,...c.why,...c.gaps].join(' ').toLowerCase().includes(t))));
    const rank=c=>['优先申请','主攻'].includes(c.priority)?0:c.priority==='待复核'?2:1;
    result.sort((a,b)=>R.classify(b).checked.localeCompare(R.classify(a).checked)||rank(a)-rank(b));
    $('#ad-case-count').textContent=`${result.length} 项 / 全部 ${cases.length} 项精读`;
    const paragraph=(label,text)=>text?`<div class="case-line"><b>${label}</b><p>${esc(text)}</p></div>`:'';
    $('#ad-case-grid').innerHTML=result.length?result.map(c=>{
      const state=R.classify(c),source=c.applicationUrl||(c.sources||[]).find(s=>/官方|官网/.test(s.label||s.type||s.level||''))?.url;
      const href=source?safe(source):'#',link=href!=='#'?`<a class="btn primary" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${c.applicationUrl?'申请入口':'官方来源'}</a>`:'';
      return `<article class="ad-case-card compact-card"><div class="ad-card-meta"><span class="evidence-chip ${state.bucket}">${esc(state.label)}</span><span>${state.explicit?'核验':'来源'} ${esc(state.checked||'日期未记录')}</span></div><button class="ad-title-link" data-case="${esc(c.id)}"><h3>${esc(c.title)}</h3></button><p class="ad-employer">${esc(c.company)} · ${name(c.person)}</p><div class="case-facts"><div><b>地点</b><span>${esc(c.cities.join(' / ')||'未公布')}</span></div><div><b>截止</b><span>${esc(c.deadline||'未公布 / 以官方说明为准')}</span></div></div>${c.currentStatus?`<p class="case-status">${esc(c.currentStatus)}</p>`:''}<div class="case-essentials">${paragraph('要求',value(c.eligibility?.known))}${paragraph('匹配',c.why.slice(0,2).join('；'))}${paragraph('缺口',c.gaps.slice(0,2).join('；'))}</div><div class="ad-card-foot"><button class="btn small ${selected.includes(c.id)?'primary':''}" data-case-compare="${esc(c.id)}" aria-pressed="${selected.includes(c.id)}">${selected.includes(c.id)?'已加入对比':'加入对比'}</button><button class="btn small" data-case="${esc(c.id)}">详情</button>${link}</div></article>`;
    }).join(''):`<div class="empty"><b>${freshness==='recent'?'当前筛选下没有近7天岗位级核验记录':'当前条件没有记录'}</b><p>这不表示没有实习机会；历史资料不会自动标成当前有效。</p><button class="btn" id="ad-reset-empty">查看全部精读</button></div>`;
    $('#ad-compare-open').textContent=`对比已选 ${selected.length} / 4`;
    $('#ad-compare-open').disabled=selected.length<2;$('#ad-compare-clear').hidden=!selected.length;
  }

  function renderRoutes() {
    $('#ad-scenarios').innerHTML = D.editorial.scenarios.map((s,i) => `<button data-scenario="${s.id}" class="${i ? '' : 'active'}" aria-pressed="${!i}">${esc(s.label)}</button>`).join('');
    scenario(D.editorial.scenarios[0].id);
    $('#ad-routes').innerHTML = D.editorial.routes.map(r => `<article class="ad-route ${r.person}"><div class="ad-route-label"><span>${r.label}</span><span>${r.person === 'male' ? '用研究深度提高议价能力' : '用真实体验验证转向'}</span></div><h2>${r.title}</h2><p class="ad-route-summary">${r.summary}</p><div class="ad-route-path"><span>建议主线</span><b>${r.primary}</b></div><p>${r.bridge}</p><details><summary>准备什么，才算有进展</summary>${list(r.proof)}</details><details><summary>取舍、备选与停止投入的条件</summary><p><b>工作方式：</b>${r.tradeoff}</p><p><b>调整条件：</b>${r.stop}</p><p><b>备选：</b>${r.backup}</p></details><button class="btn" data-person-cases="${r.person}">看${name(r.person)}的具体岗位分析 →</button></article>`).join('');
    $('#ad-gates').innerHTML = D.editorial.gates.map((g,i) => `<article><span>0${i+1}</span><h3>${g.title}</h3><p>${g.text}</p></article>`).join('');
    $('#ad-code-note').innerHTML = `<b>男方专业准入需单独确认</b><p>${esc(D.editorial.codeNote.text)}</p><a href="${esc(safe(D.editorial.codeNote.url))}" target="_blank" rel="noopener noreferrer">${esc(D.editorial.codeNote.label)} ↗</a>`;
  }
  function scenario(id) {const s = D.editorial.scenarios.find(s => s.id === id); if (!s) return; $('#ad-scenario-body').innerHTML = `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`; document.querySelectorAll('[data-scenario]').forEach(b => {b.classList.toggle('active', b.dataset.scenario === id); b.setAttribute('aria-pressed', b.dataset.scenario === id);});}
  function renderCities() {
    $('#ad-city-matrix').innerHTML = D.cityCounts.map(c => `<tr><td><button class="ad-city-link" data-case-city="${esc(c.city)}">${esc(c.city)} ↗</button><small>${esc(c.status)}</small></td><td>${c.male.toLocaleString('zh-CN')}<small>男方相关原记录</small></td><td>${c.female.toLocaleString('zh-CN')}<small>女方相关原记录</small></td><td>${esc(c.reason)}<p>${esc(c.next)}</p></td></tr>`).join('');
    $('#ad-offer-questions').innerHTML = list(D.editorial.offerQuestions);
    const exit = D.strategies.alternatives?.careerExit;
    $('#ad-exit-options').innerHTML = arr(exit).map(r => `<details class="ad-exit"><summary>${esc(r.route || r.title || '长期路径')}</summary>${line('判断',r.assessment)}${line('证据',r.evidence)}${list(r.actions)}${sourceList(r.sources)}</details>`).join('') || '<p>先查目标岗位真正的学历、身份与经历门槛，再决定是否需要第二个硕士或博士。</p>';
  }
  function renderActions() {
    $('#ad-actions').innerHTML = D.editorial.milestones.map((m,i) => `<article class="ad-milestone"><div class="ad-milestone-date"><span>0${i+1}</span><small>${esc(m.date)}</small></div><div><h3>${esc(m.title)}</h3><div class="ad-action-two">${['male','female'].map(p => `<div><b>${name(p)}</b>${m[p].map((task,j) => {const id = `${i}-${p}-${j}`; return `<label class="ad-task"><input type="checkbox" data-task="${id}" ${completed[id] ? 'checked' : ''}><span>${esc(task)}</span></label>`;}).join('')}</div>`).join('')}</div><p class="ad-deliverable">阶段产出：${esc(m.deliverable)}</p></div></article>`).join('');
    updateActionCount();
  }
  function updateActionCount() {const n = [...document.querySelectorAll('[data-task]')]; $('#ad-action-progress').textContent = `${n.filter(el => el.checked).length} / ${n.length} 项已完成 · 仅保存于当前浏览器`;}
  function questions() {
    $('#questions').innerHTML = window.CAREER_V4.questions.map((q,i) => `<tr><td>${esc(q.question)}<p>${esc(q.why)}</p></td><td><label for="ad-answer-${i}">${esc(q.answer)}</label><textarea id="ad-answer-${i}" data-answer="${i}" rows="3" placeholder="在这里集中填写…">${esc(answers[i] || '')}</textarea></td></tr>`).join('');
    $('#questions').closest('table').querySelector('thead').innerHTML = '<tr><th>待补信息与用途</th><th>填写提示与回答</th></tr>';
    const old = $('#export-questions'), button = old.cloneNode(true); old.replaceWith(button); button.textContent = '导出已填回答';
    button.addEventListener('click', () => {const rows = [['待补信息','影响','填写提示','回答'], ...window.CAREER_V4.questions.map((q,i) => [q.question,q.why,q.answer,answers[i] || ''])]; const cell = v => {let s = String(v ?? ''); if (/^[=+@-]/.test(s)) s = "'"+s; return '"'+s.replace(/"/g,'""')+'"';}; download('双人求职-集中回答.csv', '\uFEFF'+rows.map(r => r.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');});
    const note = document.createElement('p'); note.className = 'ad-local-note'; note.id = 'ad-answer-status'; note.textContent = '回答自动保存在当前浏览器，不会自动同步到聊天。填写后导出并发回本聊天，可用于下一轮筛选。'; button.closest('.results-head').after(note);
  }
  function compare() {
    const cs = selected.map(id => caseMap.get(id));
    const fields = [['当前判断',c => c.verdict],['准入待核',c => c.eligibility?.unknown],['薪资与目标',c => c.salary?.targetAssessment],['薪资证据范围',c => c.salary?.scope],['工作方式事实',c => c.workload?.facts],['工作方式未知',c => c.workload?.unknown],['可迁移能力',c => c.development?.upside],['主要代价',c => c.development?.tradeoff]];
    api.openDrawer('把关键条件放在一起', '岗位精读 · 对照', '未知条件不会被当作已达标；具体来源可回到每份分析查看。', `<div class="table-scroll"><table class="compare-table"><thead><tr><th>比较维度</th>${cs.map(c => `<th><button class="ad-read" data-case="${esc(c.id)}">${esc(c.title)} ↗</button><small>${esc(c.company)} · ${name(c.person)}</small></th>`).join('')}</tr></thead><tbody>${fields.map(([label,fn]) => `<tr><th>${label}</th>${cs.map(c => `<td>${esc(value(fn(c)))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`, 'advice-comparison');
  }
  function resetCases() {['person','priority','city','freshness'].forEach(k => $('#ad-'+k).value = 'all'); $('#ad-query').value = ''; renderCases(); remember();}
  function init() {
    if (api) return; api = window.CAREER_ATLAS_API; if (!api) return;
    $('#ad-case-total').textContent = D.cases.length; $('#ad-source-total').textContent = D.meta.sourceCount;
    $('#ad-priority').innerHTML += [...new Set(cases.map(c => c.priority))].map(x => `<option>${esc(x)}</option>`).join('');
    $('#ad-city').innerHTML += [...new Set(cases.flatMap(c => c.cities))].sort((a,b) => a.localeCompare(b,'zh-CN')).map(x => `<option>${esc(x)}</option>`).join('');
    const u = new URL(location.href); ['person','priority','city','query','freshness'].forEach(k => {const el = $('#ad-'+k), v = u.searchParams.get('case'+k); if (v && (el.tagName === 'INPUT' || [...el.options].some(o => o.value === v))) el.value = v;});
    renderRoutes(); renderCases(); renderCities(); renderActions(); questions(); setTab(u.searchParams.get('adviceTab') || 'cases', false);
    $('#ad-fresh-coverage').textContent = `当前资料：${cases.length} 个精读案例；来源日期与核验范围分别记录。完整库不代表全部仍在招。`;
    $('#rail-date').textContent = window.CAREER_LOCAL_MODE === 'private-local' ? '完整资料已在本机载入 · 按来源日期' : '公开示例 · 可载入完整资料';
    window.CAREER_ADVICE_STATE = {cases:cases.length,sources:D.meta.sourceCount,mappedCases:D.meta.mappedCases,ready:true};
    document.querySelectorAll('#ad-filters select').forEach(el => el.addEventListener('change', () => {renderCases(); remember();}));
    $('#ad-query').addEventListener('input', () => {renderCases(); remember();});
    $('#ad-reset').addEventListener('click', resetCases);
    $('#ad-compare-open').addEventListener('click', compare);
    $('#ad-compare-clear').addEventListener('click', () => {selected = []; renderCases();});
    $('#ad-download').addEventListener('click', () => download('2028-岗位专项研究-20261118.json', JSON.stringify(D,null,2)));
    $('#ad-actions-export').addEventListener('click', () => download('2028-行动与回答备份.json', JSON.stringify({savedAt:new Date().toISOString(),answers,completed},null,2)));
  }
  document.addEventListener('click', e => {
    let fresh = e.target.closest('[data-current-female]'); if (fresh) {resetCases(); $('#ad-person').value = 'female'; if (fresh.dataset.currentFemale !== 'all') {const priority=fresh.dataset.currentFemale === 'verified' ? '优先申请' : '待复核'; $('#ad-priority').value=[...$('#ad-priority').options].some(o=>o.value===priority)?priority:'all';} renderCases(); setTab('cases'); api.activate('advice'); $('#ad-tabs').scrollIntoView({block:'start'}); return;}
    let b = e.target.closest('[data-case]'); if (b) {openCase(b.dataset.case); return;}
    b = e.target.closest('[data-ad-tab]'); if (b) {setTab(b.dataset.adTab); return;}
    b = e.target.closest('[data-scenario]'); if (b) {scenario(b.dataset.scenario); return;}
    b = e.target.closest('[data-person-cases]'); if (b) {resetCases(); $('#ad-person').value = b.dataset.personCases; renderCases(); setTab('cases'); $('#ad-tabs').scrollIntoView({block:'start'}); return;}
    b = e.target.closest('[data-case-city]'); if (b) {resetCases(); if ([...$('#ad-city').options].some(o => o.value === b.dataset.caseCity)) $('#ad-city').value = b.dataset.caseCity; else {$('#ad-query').value = b.dataset.caseCity;} renderCases(); setTab('cases'); $('#ad-tabs').scrollIntoView({block:'start'}); return;}
    b = e.target.closest('[data-case-compare]'); if (b) {const id = b.dataset.caseCompare; if (selected.includes(id)) selected = selected.filter(x => x !== id); else if (selected.length < 4) selected.push(id); else api.toast('最多对照4个岗位，请先移除一个。'); renderCases(); return;}
    b = e.target.closest('#ad-reset-empty'); if (b) resetCases();
    b = e.target.closest('[data-ad-goto]'); if (b) {api.activate(b.dataset.adGoto); if (b.dataset.adGoto === 'planning') $(b.dataset.adTarget === 'calculator' ? '#offer-form' : '#questions').closest('.panel').scrollIntoView({block:'start'});}
  });
  document.addEventListener('keydown', e => {const el = e.target.closest('[data-ad-tab]'); if (!el || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; e.preventDefault(); const tabs = [...document.querySelectorAll('[data-ad-tab]')], i = tabs.indexOf(el), n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (i + (e.key === 'ArrowRight' ? 1 : tabs.length-1)) % tabs.length; setTab(tabs[n].dataset.adTab); tabs[n].focus();});
  document.addEventListener('input', e => {if (!e.target.matches('[data-answer]')) return; answers[e.target.dataset.answer] = e.target.value; const ok = save('careerFullAnswersV6', answers); $('#ad-answer-status').textContent = ok ? '回答已保存到当前浏览器。请导出并发回聊天，便于下一轮使用。' : '浏览器未能保存，请立即导出回答备份。';});
  document.addEventListener('change', e => {if (!e.target.matches('[data-task]')) return; completed[e.target.dataset.task] = e.target.checked; const ok = save('careerFullActionsV6', completed); updateActionCount(); if (!ok) api.toast('浏览器未能保存，请导出行动备份。');});
  window.addEventListener('career-atlas-ready', init, {once:true}); init();
})();
