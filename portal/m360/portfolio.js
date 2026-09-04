(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const text=v=>String(v||'').trim();
  const link=(url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';
  const row=(label,value)=>text(value)?`<div class="portfolio-field-row"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`:'';
  const list=(label,items)=>items&&items.length?`<div class="portfolio-field-row stacked"><strong>${esc(label)}</strong><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
  const ELIGIBLE_TRACKS=['SOCAN','HDESK','AIENG'];
  const TRACK_LABELS={SOCAN:'SOC Analyst',HDESK:'IT Help Desk',AIENG:'AI / ML'};
  const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let portfolioPdfModel=null;

  function accepted(row){return row&&row.accepted_artifact_payload&&typeof row.accepted_artifact_payload==='object'?row.accepted_artifact_payload:null;}
  function draft(row){return row&&row.draft_payload&&typeof row.draft_payload==='object'?row.draft_payload:null;}
  function stageReady(n,html){$(`stage${n}Status`).textContent='Portfolio Ready';$(`stage${n}Status`).classList.add('ready');$(`stage${n}Content`).innerHTML=html||'<p class="empty-note">Reviewer-approved artifact is available.</p>';}
  function stageEmpty(n){$(`stage${n}Status`).textContent='Not Portfolio Ready';$(`stage${n}Status`).classList.remove('ready');$(`stage${n}Content`).innerHTML='<p class="empty-note">This stage will appear here after reviewer approval.</p>';}

  function week1(a){return [row('Target direction',a.direction||a.targetDirection),row('Professional brand',a.brandStatement),row('Translated experience',a.translation),list('Evidence-backed strengths',[a.strength1&&`${a.strength1}${a.evidence1?` — ${a.evidence1}`:''}`,a.strength2&&`${a.strength2}${a.evidence2?` — ${a.evidence2}`:''}`,a.strength3&&`${a.strength3}${a.evidence3?` — ${a.evidence3}`:''}`].filter(Boolean))].join('');}
  function week2(a){return [a.profileUrl?`<div class="portfolio-field-row"><strong>Professional profile</strong><span>${link(a.profileUrl,'Open profile')}</span></div>`:'',row('Target direction',a.targetDirection),row('Headline',a.headline),row('About',a.about),row('Updated experience',a.experienceAfter),list('Skills / keywords',Array.from({length:8},(_,i)=>a[`skill${i+1}`]).filter(Boolean))].join('');}
  function week3(a){return [row('Networking learning',a.showcaseInsight||a.generalizedLearning||a.reflectionLearned),row('Generalized follow-up',a.showcaseFollowUp||a.generalizedFollowUp||a.reflectionNext),row('Networking achievement',a.showcaseAchievement||a.achievementStatement),list('Sanitized outreach templates',[a.sanitizedTemplate1,a.sanitizedTemplate2,a.sanitizedTemplate3].filter(Boolean))].join('')||'<p class="empty-note">Week 3 is Portfolio Ready. Private networking details remain in the academic record and are intentionally omitted here.</p>';}
  function week4(a){const bullets=Array.isArray(a.evidenceBullets)?a.evidenceBullets.filter(x=>x&&x.revised).map(x=>x.revised):[];return [row('Target opportunity',a.targetRole||a.targetOpportunity||a.target),a.resumeLink?`<div class="portfolio-field-row"><strong>Targeted resume</strong><span>${link(a.resumeLink,'Open resume')}</span></div>`:'',row('Resume version',a.resumeVersionDate),list('Revised evidence bullets',bullets),row('Targeting note',a.targetingNote)].join('');}
  function week5(a){const stories=Array.isArray(a.starStories)?a.starStories.filter(x=>x&&x.title).map(x=>`${x.title}${x.competency?` — ${x.competency}`:''}${x.result?`: ${x.result}`:''}`):[];return [row('Target direction',a.targetDirection),row('Professional introduction',a.professionalIntroduction),list('STAR story bank',stories),row('Practice reflection',a.practiceObservation),list('Interviewer questions',[a.interviewerQuestion1,a.interviewerQuestion2,a.interviewerQuestion3].filter(Boolean)),row('Improvement plan',a.improvementNext)].join('');}
  function week6(a){return [a.slidesUrl?`<div class="portfolio-field-row"><strong>Career Spotlight slides</strong><span>${link(a.slidesUrl,'Open slides')}</span></div>`:'',row('Slide 1 · Direction',a.slide1Content),row('Slide 2 · Proof',a.slide2Content),row('Slide 3 · Next',a.slide3Content),row('30-day target',a.actionTarget),list('30-day actions',[a.action1,a.action2,a.action3].filter(Boolean)),row('Support / accountability',a.accountability),row('Final reflection',a.reflectionChanged),row('First next step',a.reflectionNextStep)].join('');}
  const renderers={1:week1,2:week2,3:week3,4:week4,5:week5,6:week6};

  function draftSummary(n,d,allowAction=true){if(!d)return '';const labels={1:'Direction',2:'Signal',3:'Connection',4:'Evidence',5:'Voice',6:'Proof'};let summary='';if(n===1)summary=text(d.direction||d.brandStatement);if(n===2)summary=text(d.headline||d.about||d.targetDirection);if(n===3)summary=text(d.showcaseInsight||d.reflectionLearned||d.generalizedLearning);if(n===4)summary=text(d.targetRole||d.targetOpportunity||d.target||d.targetingNote);if(n===5)summary=text(d.targetDirection||d.professionalIntroduction||d.improvementNext);if(n===6)summary=text(d.slide1Content||d.actionTarget||d.reflectionNextStep);return summary?`<article><div class="mini-kicker">Week ${n} · ${labels[n]}</div><p>${esc(summary)}</p>${allowAction?`<a href="week.html?week=${n}">Continue Week ${n} →</a>`:''}</article>`:'';}

  function nextFrame(){return new Promise(resolve=>requestAnimationFrame(()=>resolve()));}
  async function waitForImages(){
    const images=Array.from(document.images||[]);
    await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{
      img.addEventListener('load',resolve,{once:true});
      img.addEventListener('error',resolve,{once:true});
    })));
  }
  async function waitForPrintReady(){
    if(document.fonts&&document.fonts.ready){try{await document.fonts.ready;}catch(_){} }
    await waitForImages();
    await nextFrame();
    await nextFrame();
  }
  async function printPortfolio(){
    await waitForPrintReady();
    window.print();
  }

  function pdfFields(n,a){
    if(!a)return [];
    if(n===1)return [
      {label:'Target direction',value:a.direction||a.targetDirection},
      {label:'Professional brand',value:a.brandStatement},
      {label:'Translated experience',value:a.translation},
      {label:'Evidence-backed strengths',bullets:[a.strength1&&`${a.strength1}${a.evidence1?` - ${a.evidence1}`:''}`,a.strength2&&`${a.strength2}${a.evidence2?` - ${a.evidence2}`:''}`,a.strength3&&`${a.strength3}${a.evidence3?` - ${a.evidence3}`:''}`].filter(Boolean)}
    ];
    if(n===2)return [
      {label:'Professional profile',url:a.profileUrl},
      {label:'Target direction',value:a.targetDirection},
      {label:'Headline',value:a.headline},
      {label:'About',value:a.about},
      {label:'Updated experience',value:a.experienceAfter},
      {label:'Skills / keywords',bullets:Array.from({length:8},(_,i)=>a[`skill${i+1}`]).filter(Boolean)}
    ];
    if(n===3)return [
      {label:'Networking learning',value:a.showcaseInsight||a.generalizedLearning||a.reflectionLearned},
      {label:'Generalized follow-up',value:a.showcaseFollowUp||a.generalizedFollowUp||a.reflectionNext},
      {label:'Networking achievement',value:a.showcaseAchievement||a.achievementStatement},
      {label:'Sanitized outreach templates',bullets:[a.sanitizedTemplate1,a.sanitizedTemplate2,a.sanitizedTemplate3].filter(Boolean)}
    ];
    if(n===4){const bullets=Array.isArray(a.evidenceBullets)?a.evidenceBullets.filter(x=>x&&x.revised).map(x=>x.revised):[];return [
      {label:'Target opportunity',value:a.targetRole||a.targetOpportunity||a.target},
      {label:'Targeted resume',url:a.resumeLink},
      {label:'Resume version',value:a.resumeVersionDate},
      {label:'Revised evidence bullets',bullets},
      {label:'Targeting note',value:a.targetingNote}
    ];}
    if(n===5){
      const fields=[
        {label:'Target direction',value:a.targetDirection},
        {label:'Professional introduction',value:a.professionalIntroduction}
      ];
      const stories=Array.isArray(a.starStories)?a.starStories.filter(x=>x&&x.title):[];
      stories.forEach((story,index)=>{
        fields.push({label:`STAR story ${index+1}`,value:`${story.title}${story.competency?` - ${story.competency}`:''}`});
        fields.push({label:'Situation / task / context',value:story.context});
        fields.push({label:'Action',value:story.action});
        fields.push({label:'Result / learning',value:story.result});
        fields.push({label:'Interview use',value:story.interviewUse});
      });
      fields.push({label:'Practice reflection',value:a.practiceObservation});
      fields.push({label:'Interviewer questions',bullets:[a.interviewerQuestion1,a.interviewerQuestion2,a.interviewerQuestion3].filter(Boolean)});
      fields.push({label:'Improvement plan',value:a.improvementNext});
      fields.push({label:'Support to improve',value:a.improvementSupport});
      return fields;
    }
    if(n===6)return [
      {label:'Career Spotlight slides',url:a.slidesUrl},
      {label:'Slide 1 / Direction',value:a.slide1Content},
      {label:'Slide 2 / Proof',value:a.slide2Content},
      {label:'Slide 3 / Next',value:a.slide3Content},
      {label:'30-day target',value:a.actionTarget},
      {label:'30-day actions',bullets:[a.action1,a.action2,a.action3].filter(Boolean)},
      {label:'Support / accountability',value:a.accountability},
      {label:'Final reflection',value:a.reflectionChanged},
      {label:'First next step',value:a.reflectionNextStep}
    ];
    return [];
  }

  function makePdfModel(rows,progress,identity={}){
    const byWeek=Object.fromEntries((rows||[]).map(r=>[Number(r.week_number),r]));
    const week1Artifact=accepted(byWeek[1])||{};
    const sectionMeta={
      1:['DIRECTION','Career Direction & Professional Brand'],
      2:['SIGNAL','LinkedIn & Professional Presence'],
      3:['CONNECTION','Networking & Professional Follow-Up'],
      4:['EVIDENCE','Targeted Resume Development'],
      5:['VOICE','Interview Preparation & Practice'],
      6:['PROOF','Career Spotlight & 30-Day Plan']
    };
    const sections=[];
    let readyCount=0;
    for(let n=1;n<=6;n++){
      const artifact=accepted(byWeek[n]);
      if(!artifact)continue;
      readyCount++;
      sections.push({week:n,kicker:sectionMeta[n][0],title:sectionMeta[n][1],fields:pdfFields(n,artifact)});
    }
    return {
      studentId:identity.studentId||'',
      trackLabel:TRACK_LABELS[identity.trackCode]||identity.trackCode||'',
      direction:week1Artifact.direction||week1Artifact.targetDirection||'Direction to Proof',
      brandStatement:week1Artifact.brandStatement||'',
      readyCount,
      finalGrade:progress&&progress.final_grade!=null?Number(progress.final_grade):null,
      courseComplete:Boolean(progress&&progress.course_complete),
      generatedDate:new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}),
      sections
    };
  }

  function downloadPortfolioPdf(){
    if(!portfolioPdfModel){$('portfolioNotice').textContent='Your approved portfolio is still loading. Try the download again in a moment.';return;}
    if(!window.M360PortfolioPDF){$('portfolioNotice').textContent='The PDF generator could not load. Refresh this page and try again.';return;}
    const safeId=String(portfolioPdfModel.studentId||'Student').replace(/[^A-Za-z0-9_-]+/g,'-');
    window.M360PortfolioPDF.download(portfolioPdfModel,`Mission-Next-M360-Professional-Portfolio-${safeId}.pdf`);
  }

  function setAdminNavigation(studentId){
    document.title=`Student ${studentId} M360 Portfolio | Mission Next Technical Academy`;
    const kicker=document.querySelector('.portfolio-hero .mini-kicker');
    if(kicker)kicker.textContent=`Admin read-only portfolio · Student ${studentId}`;
    const brand=document.querySelector('.portfolio-home-brand');
    if(brand){brand.href='review.html';brand.setAttribute('aria-label','M360 Administration');brand.title='M360 Administration';}
    document.querySelectorAll('a[href="index.html"]').forEach(anchor=>{
      anchor.href='review.html';
      anchor.textContent=anchor.classList.contains('btn')?'M360 Administration':'M360 Administration';
    });
  }

  function renderPortfolio(rows,progress,{adminMode=false,studentId='',trackCode=''}={}){
    const byWeek=Object.fromEntries((rows||[]).map(r=>[Number(r.week_number),r]));
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
    portfolioPdfModel=makePdfModel(rows,progress,{studentId,trackCode});

    $('draftSection').hidden=true;
    $('draftContent').innerHTML='';
    if(!adminMode){
      const drafts=[];
      for(let n=1;n<=6;n++){const r=byWeek[n],d=draft(r),a=accepted(r);if(d&&JSON.stringify(d)!=='{}'&&(!a||JSON.stringify(d)!==JSON.stringify(a))){const h=draftSummary(n,d,true);if(h)drafts.push(h);}}
      if(drafts.length){$('draftSection').hidden=false;$('draftContent').innerHTML=drafts.join('');}
      $('portfolioNotice').textContent='Authenticated portfolio loaded from reviewer-approved M360 records. Download Portfolio PDF creates a branded professional PDF from accepted portfolio evidence only. Private working data, instructor feedback, staff verification fields, raw networking details, and technical-course data are excluded.';
    }else{
      setAdminNavigation(studentId);
      $('portfolioNotice').textContent=`Admin read-only showcase view for Student ${studentId}. Download Portfolio PDF uses the same accepted-artifact-only professional renderer. Private working data, instructor feedback, staff verification fields, raw networking details, and technical-course data are excluded.`;
    }
  }

  async function loadAdminPortfolio(ctx,targetUserId){
    if(!ctx.isAdmin)throw new Error('Admin access required.');
    if(!UUID_RE.test(targetUserId))throw new Error('Invalid student portfolio target.');

    const {data:student,error:studentError}=await mntSupabase
      .from('students')
      .select('user_id, student_id, track_code, is_enrolled, is_admin')
      .eq('user_id',targetUserId)
      .eq('is_enrolled',true)
      .eq('is_admin',false)
      .in('track_code',ELIGIBLE_TRACKS)
      .maybeSingle();
    if(studentError)throw studentError;
    if(!student)throw new Error('The requested M360 student was not found or is not currently eligible.');

    const [{data:rows,error:rowsError},{data:progress,error:progressError}]=await Promise.all([
      mntSupabase.from('m360_week_records').select('*').eq('user_id',targetUserId).order('week_number',{ascending:true}),
      mntSupabase.from('m360_course_progress').select('*').eq('user_id',targetUserId).maybeSingle()
    ]);
    if(rowsError)throw rowsError;
    if(progressError)throw progressError;
    renderPortfolio(rows||[],progress||null,{adminMode:true,studentId:student.student_id||targetUserId,trackCode:student.track_code||''});
  }

  async function loadOwnIdentity(ctx){
    try{
      const {data,error}=await mntSupabase.from('students').select('student_id, track_code').eq('user_id',ctx.userId).maybeSingle();
      if(error)throw error;
      return {studentId:data&&data.student_id||'',trackCode:data&&data.track_code||ctx.trackCode||''};
    }catch(error){
      console.warn('M360 portfolio identity lookup failed',error);
      return {studentId:'',trackCode:ctx.trackCode||''};
    }
  }

  async function init(){
    const params=new URLSearchParams(location.search);
    const targetUserId=params.get('student');
    try{
      if(!window.M360Data)throw new Error('M360 data runtime unavailable.');
      const ctx=await M360Data.getContext();
      if(!ctx.authenticated){location.replace('../index.html#/login');return;}
      if(ctx.isAdmin){
        if(!targetUserId){$('portfolioNotice').textContent='Choose a student from M360 Administration to open a read-only portfolio.';return;}
        await loadAdminPortfolio(ctx,targetUserId);
      }else{
        if(targetUserId){$('portfolioNotice').textContent='Student portfolio selection is available to administrators only.';return;}
        if(!ctx.eligible){location.replace('../index.html#/portal');return;}
        const [rows,progress,identity]=await Promise.all([M360Data.loadOwnWeekRecords(),M360Data.loadOwnCourseProgress(),loadOwnIdentity(ctx)]);
        renderPortfolio(rows,progress,{adminMode:false,studentId:identity.studentId,trackCode:identity.trackCode});
      }
      if(params.get('download')==='1')setTimeout(downloadPortfolioPdf,0);
      else if(params.get('print')==='1')setTimeout(printPortfolio,0);
    }catch(error){console.error('M360 portfolio load failed',error);$('portfolioNotice').textContent=error&&error.message?error.message:'Your M360 portfolio could not be loaded. Return to M360 Home and try again. No technical-course data was changed.';}
  }
  $('printPortfolioBtn').addEventListener('click',downloadPortfolioPdf);
  $('printPortfolioBtnBottom').addEventListener('click',downloadPortfolioPdf);
  init();
})();
