(() => {
 'use strict';
 const status=document.querySelector('#local-data-status'),loading=document.querySelector('#loading'),version='jd-20261123-1';
 const retry=document.querySelector('#retry-full');retry.addEventListener('click',()=>location.reload());
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 async function get(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('下载失败：'+url+'（'+response.status+'）');return response;}
 const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src+'?v='+version;s.onload=resolve;s.onerror=()=>reject(Error('程序加载失败：'+src));document.body.append(s);});
 (async()=>{try{
  if(typeof DecompressionStream==='undefined')throw Error('当前浏览器不支持数据解压，请使用新版 Edge、Chrome、Firefox 或 Safari。');
  const manifest=await (await get('data/full-manifest.json?v='+version)).json();
  if(manifest.format!=='career-atlas-gzip-parts-v1'||!Array.isArray(manifest.parts)||!manifest.parts.length)throw Error('数据清单格式错误');
  const parts=new Array(manifest.parts.length);let cursor=0,done=0,failed=false;
  async function worker(){try{while(!failed&&cursor<manifest.parts.length){const index=cursor++,part=manifest.parts[index];if(!/^data\/full-data\.\d{3}\.bin$/.test(part.path))throw Error('数据路径不符合清单');const bytes=new Uint8Array(await (await get(part.path+'?v='+version)).arrayBuffer());if(bytes.length!==part.bytes||await hash(bytes)!==part.sha256)throw Error('数据完整性校验失败：'+part.path);parts[index]=bytes;done++;if(!failed)status.textContent=`正在自动下载完整资料：${done} / ${manifest.parts.length}；首次加载需下载约 ${(manifest.compressedBytes/1048576).toFixed(1)} MB。`;}}catch(e){failed=true;throw e;}}
  await Promise.all(Array.from({length:Math.min(4,parts.length)},worker));
  status.textContent='正在解压并校验完整资料…';
  const stream=new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  if(bytes.length!==manifest.jsonBytes||await hash(bytes)!==manifest.jsonSha256)throw Error('完整资料校验失败，请刷新重试');
  const p=JSON.parse(new TextDecoder().decode(bytes));
  if(p.format!=='career-atlas-local-v1'||p.catalog.records.length!==manifest.counts.records||p.jobs.jobs.length!==manifest.counts.jobs||p.research.research.length!==manifest.counts.research||p.advice.cases.length!==manifest.counts.cases)throw Error('资料数量或格式不匹配');
  const ids=new Set(p.catalog.records.map(r=>r.id)),companies=new Set(p.catalog.companies.map(c=>c.id));
  if(p.jobs.jobs.some(j=>!companies.has(j.companyId)||!j.sourceIds.length||j.sourceIds.some(id=>!ids.has(id))))throw Error('岗位关联校验失败');
  window.CAREER_V4=p.research;window.CAREER_ADVICE_V6=p.advice;window.CAREER_RAW_V4=p.raw;window.CAREER_CATALOG_V4=p.catalog;window.CAREER_JOBS_V5=p.jobs;
  window.CAREER_LOCAL_MODE='public-full';
  status.textContent=`完整资料已自动载入：${p.catalog.records.length.toLocaleString()} 条原记录 / ${p.jobs.jobs.length.toLocaleString()} 条岗位参考 / ${p.research.research.length} 份企业研究 / ${p.advice.cases.length} 个精读案例。无需手动导入。`;
  await script('case-rules.js');await script('jd-support.js');await script('opportunities.js');await script('atlas-v5-full.js');await script('atlas-v6-full.js');
  document.querySelector('#rail-date').textContent='完整公开资料 · 日期以各条来源为准';
  document.documentElement?.classList.add('data-ready');
 }catch(e){status.textContent='加载未完成：'+e.message;loading.textContent='请检查网络后点击“重新加载”。不会用五条示例替代完整资料。';retry.hidden=false;}})();
})();
