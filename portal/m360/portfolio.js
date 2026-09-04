(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const text=v=>String(v||'').trim();
  const link=(url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';
  const row=(label,value)=>text(value)?`<div class="portfolio-field-row"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`:'';
  const list=(label,items)=>items&&items.length?`<div class="portfolio-field-row stacked"><strong>${esc(label)}</strong><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';

  function accepted(row){return row&&row.accepted_artifact_payload&&typeof row.accepted_artifact_payload==='object'?row.accepted_artifact_payload:null;}
  function draft(row){return row&&row.draft_payload&&typeof row.draft_payload==='object'?row.draft_payload:null;}
  function stageReady(n,html){$(`stage${n}Status`).textContent='Portfolio Ready';$(`stage${n}Status`).classList.add('ready');$(`stage${n}Content`).innerHTML=html||'<p class="empty-note">Reviewer-approved artifact is available.</p>';}
  function stageEmpty(n){$(`stage${n}Content`).innerHTML='<p class="empty-note">This stage will appear here after reviewer approval.</p>';}

  function week1(a){return [row('Target direction',a.direction||a.targetDirection),row('Professional brand',a.brandStatement),row('Translated experience',a.translation),list('Evidence-backed strengths',[a.strength1&&`${a.strength1}${a.evidence1?` — ${a.evidence1}`:''}`,a.strength2&&`${a.strength2}${a.evidence2?` — ${a.evidence2}`:''}`,a.strength3&&`${a.strength3}${a.evidence3?` — ${a.evidence3}`:''}`].filter(Boolean))].join('');}
  function week2(a){return [a.profileUrl?`<div class="portfolio-field-row"><strong>Professional profile</strong><span>${link(a.profileUrl,'Open profile')}</span></div>`:'',row('Target direction',a.targetDirection),row('Headline',a.headline),row('About',a.about),row('Updated experience',a.experienceAfter),list('Skills / keywords',Array.from({length:8},(_,i)=>a[`skill${i+1}`]).filter(Boolean))].join('');}
  function week3(a){return [row('Networking learning',a.showcaseInsight||a.generalizedLearning||a.reflectionLearned),row('Generalized follow-up',a.showcaseFollowUp||a.generalizedFollowUp||a.reflectionNext),row('Networking achievement',a.showcaseAchievement||a.achievementStatement),list('Sanitized outreach templates',[a.sanitizedTemplate1,a.sanitizedTemplate2,a.sanitizedTemplate3].filter(Boolean))].join('')||'<p class="empty-note">Week 3 is Portfolio Ready. Private networking details remain in the academic record and are intentionally omitted here.</p>';}
  function week4(a){const bullets=Array.isArray(a.evidenceBullets)?a.evidenceBullets.filter(x=>x&&x.revised).map(x=>x.revised):[];return [row('Target opportunity',a.targetRole||a.targetOpportunity||a.target),a.resumeLink?`<div class="portfolio-field-row"><strong>Targeted resume</strong><span>${link(a.resumeLink,'Open resume')}</span></div>`:'',row('Resume version',a.resumeVersionDate),list('Revised evidence bullets',bullets),row('Targeting note',a.targetingNote)].join('');}
  function week5(a){const stories=Array.isArray(a.starStories)?a.starStories.filter(x=>x&&x.title).map(x=>`${x.title}${x.competency?` — ${x.competency}`:''}${x.result?`: ${x.result}`:''}`):[];return [row('Target direction',a.targetDirection),row('Professional introduction',a.professionalIntroduction),list('STAR story bank',stories),row('Practice reflection',a.practiceObservation),list('Interviewer questions',[a.interviewerQuestion1,a.interviewerQuestion2,a.interviewerQuestion3].filter(Boolean)),row('Improvement plan',a.improvementNext)].join('');}
  function week6(a){return [a.slidesUrl?`<div class="portfolio-field-row"><strong>Career Spotlight slides</strong><span>${link(a.slidesUrl,'Open slides')}</span></div>`:'',row('Slide 1 · Direction',a.slide1Content),row('Slide 2 · Proof',a.slide2Content),row('Slide 3 · Next',a.slide3Content),row('30-day target',a.actionTarget),list('30-day actions',[a.action1,a.action2,a.action3].filter(Boolean)),row('Support / accountability',a.accountability),row('Final reflection',a.reflectionChanged),row('First next step',a.reflectionNextStep)].join('');}
  const renderers={1:week1,2:week2,3:week3,4:week4,5:week5,6:week6};

  function draftSummary(n,d){if(!d)return '';const labels={1:'Direction',2:'Signal',3:'Connection',4:'Evidence',5:'Voice',6:'Proof'};let summary='';if(n===1)summary=text(d.direction||d.brandStatement);if(n===2)summary=text(d.headline||d.about||d.targetDirection);if(n===3)summary=text(d.showcaseInsight||d.reflectionLearned||d.generalizedLearning);if(n===4)summary=text(d.targetRole||d.targetOpportunity||d.target||d.targetingNote);if(n===5)summary=text(d.targetDirection||d.professionalIntroduction||d.improvementNext);if(n===6)summary=text(d.slide1Content||d.actionTarget||d.reflectionNextStep);return summary?`<article><div class="mini-kicker">Week ${n} · ${labels[n]}</div><p>${esc(summary)}</p><a href="week.html?week=${n}">Continue Week ${n} →</a></article>`:'';}

  async function init(){
    try{
      if(!window.M360Data)throw new Error('M360 data runtime unavailable.');
      const ctx=await M360Data.getContext();
      if(!ctx.authenticated){location.replace('../index.html#/login');return;}
      if(ctx.isAdmin){$('portfolioNotice').textContent='Admin mode does not display a student portfolio. Use M360 Administration to review student work and course-level verification.';return;}
      if(!ctx.eligible){location.replace('../index.html#/portal');return;}
      const [rows,progress]=await Promise.all([M360Data.loadOwnWeekRecords(),M360Data.loadOwnCourseProgress()]);
      const byWeek=Object.fromEntries(rows.map(r=>[Number(r.week_number),r]));
      let ready=0;
      for(let n=1;n<=6;n++){const a=accepted(byWeek[n]);if(a){ready++;stageReady(n,renderers[n](a));}else stageEmpty(n);}
      $('portfolioReadyCount').textContent=`${ready} / 6 Portfolio Ready`;
      $('completionAccepted').textContent=`${ready} / 6`;
      $('completionGrade').textContent=progress&&progress.final_grade!=null?`${Number(progress.final_grade).toFixed(1)}%`:'—';
      $('completionAttendance').textContent=progress&&progress.attendance_requirement_met?'Yes':'No';
      const complete=Boolean(progress&&progress.course_complete);
      $('portfolioCourseStatus').textContent=complete?'M360 Complete':'M360 in progress';
      $('completionHeadline').textContent=complete?'M360 Complete':'Keep building toward complete proof.';
      $('completionText').textContent=complete?'All six required assignments are accepted, the final average meets the standard, Career Spotlight presentation is staff-verified, and attendance has been staff-verified.':'Final completion requires all six assignments, a final average of 70 or higher, staff-verified Career Spotlight presentation completion, and staff-confirmed attendance verification.';
      const drafts=[];for(let n=1;n<=6;n++){const r=byWeek[n],d=draft(r),a=accepted(r);if(d&&JSON.stringify(d)!=='{}'&&(!a||JSON.stringify(d)!==JSON.stringify(a))){const h=draftSummary(n,d);if(h)drafts.push(h);}}
      if(drafts.length){$('draftSection').hidden=false;$('draftContent').innerHTML=drafts.join('');}
      $('portfolioNotice').textContent='Authenticated portfolio loaded from reviewer-approved M360 records. Private working data, instructor feedback, staff verification fields, raw networking details, and technical-course data are excluded.';
      if(new URLSearchParams(location.search).get('download')==='1')setTimeout(printPortfolio,150);
    }catch(error){console.error('M360 portfolio load failed',error);$('portfolioNotice').textContent='Your M360 portfolio could not be loaded. Return to M360 Home and try again. No technical-course data was changed.';}
  }
  function printPortfolio(){window.print();}
  $('printPortfolioBtn').addEventListener('click',printPortfolio);$('printPortfolioBtnBottom').addEventListener('click',printPortfolio);init();
})();
