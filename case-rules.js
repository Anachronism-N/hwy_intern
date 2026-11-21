(() => {
 'use strict';
 const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s?s:'';
 const today=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 function classify(c,now=today()){
  const explicit=iso(c.checked),source=(c.sources||[]).map(s=>iso(s.checked)).filter(Boolean).sort().at(-1)||'',checked=explicit||source;
  const ageDays=checked?(Date.parse(now)-Date.parse(checked))/86400000:null;
  const fresh=!!explicit&&ageDays>=0&&ageDays<7;
  const deadline=iso(String(c.deadline||'').trim());
  const closed=!!(deadline&&deadline<now)||/(?:^|[；;·。\s])(?:岗位|职位|招聘)?(?:已关闭|已结束|已截止|已下线|已招满|停止招聘)(?:$|[；;·。\s])/.test(c.currentStatus||'');
  const pending=c.priority==='待复核'||/待复核|未复核|未核实|受限|仅登录|仅.*(?:目录|索引)/.test(c.currentStatus||'');
  const bucket=closed?'closed':pending?'pending':fresh?'recent':'history';
  return {bucket,fresh,checked,explicit:!!explicit,ageDays,label:{closed:'已过截止 / 已关闭',pending:'待复核',recent:'近期核验',history:'历史参考'}[bucket]};
 }
 function inRange(c,range,now=today()){
  const x=classify(c,now);
  if(range==='all')return true;
  if(range==='recent')return x.fresh&&x.bucket!=='closed';
  if(range==='pending')return x.bucket==='pending';
  if(range==='history')return x.bucket==='history'||x.bucket==='closed';
  return false;
 }
 window.CAREER_CASE_RULES={classify,inRange,today};
})();
