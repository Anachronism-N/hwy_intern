(() => {
 'use strict';
 const $=s=>document.querySelector(s),DB='career-atlas-private-v1';
 const status=$('#local-data-status'),input=$('#private-file');
 function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async function storage(mode,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode==='read'?'readonly':'readwrite'),s=tx.objectStore('data');let result;const r=mode==='read'?s.get('bundle'):mode==='write'?s.put(value,'bundle'):s.delete('bundle');r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};});}
 function validate(p){
  if(p?.format!=='career-atlas-local-v1'||!p.raw||!Array.isArray(p.raw.schema)||!Array.isArray(p.raw.rows)||!p.raw.dictionaries||!Array.isArray(p.catalog?.records)||!Array.isArray(p.catalog?.companies)||!Array.isArray(p.catalog?.tracks)||!Array.isArray(p.jobs?.jobs)||!Array.isArray(p.research?.research)||!Array.isArray(p.research?.profiles)||!Array.isArray(p.advice?.cases)||!p.advice?.editorial?.scenarios?.length)throw Error('这不是本站完整资料包，请先解压 PRIVATE-LOCAL-DATA.zip，再选择其中的 JSON 文件。');
  const records=new Set(p.catalog.records.map(r=>r.id)),companies=new Set(p.catalog.companies.map(r=>r.id));
  if(p.jobs.jobs.some(j=>!companies.has(j.companyId)||!j.sourceIds?.length||j.sourceIds.some(id=>!records.has(id))))throw Error('资料包存在缺失的岗位关联，未替换当前数据。');
  return p;
 }
 // Import is parsed as data, never evaluated as JavaScript. Replace angle brackets
 // in local editorial strings because the legacy renderer accepts plain text.
 function plain(v){if(typeof v==='string')return v.replaceAll('<','‹').replaceAll('>','›');if(Array.isArray(v))return v.map(plain);if(v&&typeof v==='object'){const x={};for(const [k,a] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))continue;x[k]=plain(a);}return x;}return v;}
 $('#import-private').addEventListener('click',()=>input.click());
 input.addEventListener('change',async()=>{const f=input.files[0];if(!f)return;try{if(f.size>100*1024*1024)throw Error('资料包大于100MB，请核对文件。');status.textContent='正在本机读取完整资料，不会上传…';const payload=plain(validate(JSON.parse(await f.text())));await storage('write',{payload,remember:$('#remember-private').checked});location.reload();}catch(e){status.textContent=e.message;input.value='';}});
 $('#clear-private').addEventListener('click',async()=>{if(!confirm('清除当前设备中本站记住的资料、收藏、跟进、回答和行动进度？不会删除你下载的JSON文件。'))return;try{await storage('delete');for(const k of ['careerFullSavedV4','careerFullProgressV4','careerFullAnswersV6','careerFullActionsV6'])localStorage.removeItem(k);location.reload();}catch(e){status.textContent='清除失败：'+e.message;}});
 const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src+'?v=20261120';s.onload=resolve;s.onerror=()=>reject(Error('程序载入失败：'+src));document.body.append(s);});
 (async()=>{try{
  let cached=null;try{cached=await storage('read');}catch{}
  let p;if(cached){p=validate(cached.payload);if(!cached.remember)await storage('delete');$('#remember-private').checked=!!cached.remember;}else{const r=await fetch('public-demo.json?v=20261120');if(!r.ok)throw Error('公开示例载入失败');p=validate(await r.json());}
  window.CAREER_V4=p.research;window.CAREER_ADVICE_V6=p.advice;window.CAREER_RAW_V4=p.raw;window.CAREER_CATALOG_V4=p.catalog;window.CAREER_JOBS_V5=p.jobs;
  window.CAREER_LOCAL_MODE=cached?'private-local':'public-demo';
  status.textContent=cached?`完整资料已在本机载入：${p.catalog.records.length.toLocaleString()} 条原记录 / ${p.jobs.jobs.length.toLocaleString()} 条岗位参考 / ${p.research.research.length} 份企业研究 / ${p.advice.cases.length} 个精读案例。${cached.remember?'本设备记住资料；共享设备请清除。':'仅本次页面使用；刷新需重新导入。'}`:'完整功能已就绪。当前是5条公开示例；点击“载入完整资料”选择单独下载的私有JSON，即可使用原站全部资料。';
  await script('atlas-v5-full.js');await script('atlas-v6-full.js');
 }catch(e){status.textContent=e.message;$('#loading').textContent='初始化失败，请重新加载或清除本机资料。';}})();
})();
