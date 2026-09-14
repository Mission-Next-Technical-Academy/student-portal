(() => {
  'use strict';

  const TABLE_LABELS=['','Student','Track','Start Here','Progress','Review','Grade','Spotlight','Attendance'];

  function applyStudentLabels(){
    document.querySelectorAll('#studentTableBody tr[data-student-row]').forEach(row=>{
      [...row.children].forEach((cell,index)=>{if(index>0)cell.dataset.label=TABLE_LABELS[index]||'';});
    });
  }

  function enhanceDrawer(){
    const drawer=document.getElementById('studentDrawer');
    if(!drawer||drawer.hidden)return;
    const heading=[...drawer.querySelectorAll('.m360-drawer-section h3')].find(h=>h.textContent.trim()==='Attention');
    if(!heading)return;
    const section=heading.closest('.m360-drawer-section');
    if(!section||section.querySelector('.m360-attention-reasons'))return;
    const list=section.querySelector('ul');
    if(!list)return;
    const progressText=[...drawer.querySelectorAll('.m360-drawer-stat')].find(x=>x.querySelector('span')?.textContent.trim()==='Progress')?.querySelector('strong')?.textContent||'';
    const accepted=Number((progressText.match(/(\d+)\s*\/\s*6/)||[])[1]||0);
    const entries=[...list.querySelectorAll('li')].map(li=>li.textContent.trim()).filter(Boolean).filter(text=>!(text.includes('Career Spotlight')&&accepted<5));
    const reasons=document.createElement('div');
    reasons.className='m360-attention-reasons';
    reasons.innerHTML=entries.map(text=>{
      let label='Follow-up'; let detail=text;
      if(/awaiting review/i.test(text)){label='Faculty review';detail=text.replace(/submission(s)? awaiting review/i,'submitted week$1 waiting for faculty review');}
      else if(/needs revision/i.test(text)){label='Revision';detail=text.replace(/needs revision/i,'returned for revision; learner resubmission required');}
      else if(/Start Here/i.test(text)){label='Start Here';detail='Support follow-up was flagged during onboarding.';}
      else if(/Attendance/i.test(text)){label='Attendance';detail='External attendance verification is still open.';}
      else if(/Career Spotlight/i.test(text)){label='Career Spotlight';detail='Presentation verification is now due or approaching due.';}
      return `<div class="m360-attention-reason"><strong>${label}</strong>${detail}</div>`;
    }).join('');
    list.replaceWith(reasons);
  }

  function enhanceReviewSla(){
    document.querySelectorAll('[data-review-card]').forEach(card=>{
      const head=card.querySelector('.m360-review-card-head');
      if(!head||head.querySelector('.m360-review-sla'))return;
      const meta=card.querySelector('.m360-review-meta')?.textContent||'';
      const match=meta.match(/·\s*(\d+(?:\.\d+)?)h ago\s*$/);
      if(!match)return;
      const age=Math.max(0,Number(match[1]));
      const remaining=24-age;
      const pct=Math.min(100,Math.max(0,(age/24)*100));
      const sla=document.createElement('div');
      const tone=remaining<=0?'overdue':remaining<=6?'warn':'';
      sla.className=`m360-review-sla${tone?' '+tone:''}`;
      sla.setAttribute('aria-label','24-hour faculty response status');
      const primary=remaining<=0?`Overdue by ${Math.abs(remaining).toFixed(1)}h`:`${remaining.toFixed(1)}h remaining`;
      sla.innerHTML=`<strong>${primary}</strong><span>24-hour review window</span><div class="m360-review-sla-track" aria-hidden="true"><i style="width:${pct.toFixed(0)}%"></i></div>`;
      head.appendChild(sla);
    });
  }

  function applyAll(){applyStudentLabels();enhanceDrawer();enhanceReviewSla();}

  const observer=new MutationObserver(applyAll);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  applyAll();
})();
