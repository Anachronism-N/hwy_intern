(() => {
 'use strict';
 const safe=u=>{try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
 const directoryIds=new Set(['env-icct-green-freight','env-huali-environment-system','env-huali-chemical-analysis','env-sus-water-engineer','env-hangzhou-water-process','env-ruilian-assistant-counterexample','alt-qianyuan-llm-engineering','alt-nari-software','alt-icbc-software-centers','alt-icbc-data-center','alt-csg-digital-ai-shenzhen','alt-xuejun-it-teacher']);
 function links(c){
  const primary=c.jd?.url||c.applicationUrl;
  const candidates=[...(primary?[{url:primary,label:c.jd?.label||'官方岗位页',kind:c.jd?.kind||'official'}]:[]),...(c.applicationUrl&&c.applicationUrl!==primary?[{url:c.applicationUrl,label:'官方申请入口',kind:'apply'}]:[]),...(c.sources||[]).map(s=>({...s,kind:s.kind||(directoryIds.has(c.id)?'announcement':/镜像|转载|薪资|offer|历史摘要/.test(s.label+' '+s.type)?'reference':/官方|官网/.test(s.label+' '+s.type)?'official':'source')}))];
  const seen=new Set();return candidates.filter(s=>{const u=safe(s.url);if(!u||seen.has(u))return false;seen.add(u);s.url=u;return true}).map(s=>({...s,caption:s.kind==='apply'?'官方申请入口':s.kind==='directory'?'官方招聘目录':s.kind==='announcement'?'招聘公告 / 岗位表':s.kind==='reference'?'参考来源（非实时 JD）':s.kind==='official'?'官方 JD / 岗位页':'原始 JD / 公告'}));
 }
 function summary(c){return {duties:c.jd?.duties||c.workload?.facts||[],requirements:c.jd?.requirements||[c.eligibility?.known||'原资料没有完整岗位要求，请打开原始来源核对。'],access:c.jd?.access||'以下为已有资料摘要，不是完整 JD 原文；历史链接可能失效或需要登录。',checked:c.jd?.checked||c.checked||''}}
 window.CAREER_JD={links,summary};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-case-scope]');if(!b)return;const s=document.querySelector('#ad-freshness');s.value=b.dataset.caseScope;s.dispatchEvent(new Event('change',{bubbles:true}));});
})();
