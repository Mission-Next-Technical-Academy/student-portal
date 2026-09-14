(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const week = Number(params.get('week'));

  function formatDate(dateValue) {
    if (!dateValue) return '';
    const parts = String(dateValue).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return String(dateValue);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(date);
  }

  function formatTime(timeValue) {
    const text=String(timeValue||'').trim();
    const match=text.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return text;
    let hour=Number(match[1]);
    const minute=match[2];
    const suffix=hour>=12?'PM':'AM';
    hour%=12; if(hour===0) hour=12;
    return `${hour}:${minute} ${suffix}`;
  }

  function ensureStyles() {
    if (document.getElementById('m360LiveScheduleStyles')) return;
    const style=document.createElement('style');
    style.id='m360LiveScheduleStyles';
    style.textContent=`
      .m360-session-time{display:flex;align-items:center;gap:9px;margin:0 0 13px;padding:10px 12px;border:1px solid rgba(31,78,121,.16);border-left:4px solid #F26A2E;border-radius:10px;background:#f7fbff;color:#123754;font-size:13px;font-weight:800;line-height:1.35}
      .m360-session-time::before{content:'CAL';display:inline-grid;place-items:center;min-width:28px;height:22px;border-radius:6px;background:#123754;color:#fff;font-size:9px;letter-spacing:.05em}
      .m360-session-time.pending{border-left-color:#9aa9b6;background:#f8fafc;color:#66717c;font-weight:700}
      .m360-session-time.pending::before{background:#9aa9b6}
    `;
    document.head.appendChild(style);
  }

  function render(rows) {
    ensureStyles();
    const live=document.getElementById('live');
    if (!live) return false;
    const cards=Array.from(live.querySelectorAll('.live-card'));
    if (!cards.length) return false;
    cards.forEach((card,index)=>{
      const sessionNumber=index+1;
      if(sessionNumber>2)return;
      const row=(rows||[]).find(item=>Number(item.week_number)===week&&Number(item.session_number)===sessionNumber)||null;
      let banner=card.querySelector('[data-m360-session-time]');
      if(!banner){banner=document.createElement('div');banner.dataset.m360SessionTime=String(sessionNumber);const tag=card.querySelector('.live-tag');if(tag)tag.insertAdjacentElement('afterend',banner);else card.prepend(banner);}
      if(row&&row.session_date&&row.session_time){const zone=String(row.timezone_label||'ET').trim()||'ET';banner.className='m360-session-time';banner.textContent=`${formatDate(row.session_date)} · ${formatTime(row.session_time)} ${zone}`;}
      else{banner.className='m360-session-time pending';banner.textContent='Date & time coming soon';}
    });
    return true;
  }

  async function resolveCohortId(context) {
    const requested=String(params.get('cohort')||'').trim();
    if (context.isAdmin && requested) return requested;
    const {data,error}=await mntSupabase.from('students').select('cohort_id').eq('user_id',context.userId).maybeSingle();
    if(error)throw error;
    if(data?.cohort_id)return data.cohort_id;
    if(context.isAdmin){
      const today=new Date().toISOString().slice(0,10);
      const {data:cohorts,error:cohortError}=await mntSupabase.from('cohorts').select('id,name,start_date,end_date,archived_at').is('archived_at',null).gte('start_date',today).order('start_date',{ascending:true}).limit(10);
      if(cohortError)throw cohortError;
      return (cohorts||[]).find(c=>!/dev|test/i.test(c.name||''))?.id||'';
    }
    return '';
  }

  async function init() {
    if(!Number.isInteger(week)||week<1||week>6||!window.M360Data)return;
    try{
      const context=await M360Data.getContext();
      if(!context.authenticated||(!context.eligible&&!context.isAdmin))return;
      const cohortId=await resolveCohortId(context);
      if(!cohortId){render([]);return;}
      const {data,error}=await mntSupabase.from('m360_live_sessions')
        .select('week_number,session_number,session_date,session_time,timezone_label')
        .eq('cohort_id',cohortId)
        .order('week_number',{ascending:true})
        .order('session_number',{ascending:true});
      if(error)throw error;
      render(data||[]);
    }catch(error){console.warn('M360 live-session schedule unavailable',error);render([]);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
