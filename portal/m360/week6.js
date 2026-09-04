(() => {
  'use strict';
  const STORAGE_KEY='mnt.m360.course.mock.v1';
  const WEEK_KEY='week6';
  const fieldIds=['slidesUrl','slide1Content','slide2Content','slide3Content','presentationStatus','presentationEvidence','actionTarget','action1','action2','action3','accountability','reflectionChanged','reflectionArtifact','reflectionNextStep'];
  const $=id=>document.getElementById(id);
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const blank=()=>({slidesUrl:'',slide1Content:'',slide2Content:'',slide3Content:'',presentationStatus:'',presentationEvidence:'',actionTarget:'',action1:'',action2:'',action3:'',accountability:'',reflectionChanged:'',reflectionArtifact:'',reflectionNextStep:''});
  const now=()=>new Date().toISOString();

  function state(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(x&&x.weeks)return x;}catch(_){}return{schemaVersion:1,updatedAt:null,weeks:{}};}
  function saveState(s){s.schemaVersion=1;s.updatedAt=now();localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}
  function week(s=state()){if(!s.weeks[WEEK_KEY])s.weeks[WEEK_KEY]={status:'draft',draft:blank(),submitted:null,submittedAt:null,accepted:null,acceptedAt:null};if(!s.weeks[WEEK_KEY].draft)s.weeks[WEEK_KEY].draft=blank();return s.weeks[WEEK_KEY];}
  function accepted(s,n){return s.weeks&&s.weeks[`week${n}`]&&s.weeks[`week${n}`].accepted?clone(s.weeks[`week${n}`].accepted):null;}
  function val(id){return ($(id)&&$(id).value||'').trim();}
  function draftFromForm(){const d={};fieldIds.forEach(id=>d[id]=val(id));return d;}
  function hydrate(d){fieldIds.forEach(id=>{if($(id))$(id).value=d&&d[id]||'';});}

  function carryForward(){
    const s=state(), w1=accepted(s,1)||{}, w2=accepted(s,2)||{}, w3=accepted(s,3)||{}, w4=accepted(s,4)||{}, w5=accepted(s,5)||{};
    const pieces=[];
    if(w1.direction||w1.brandStatement)pieces.push(`<div><strong>Direction</strong><span>${esc(w1.direction||w1.brandStatement)}</span></div>`);
    if(w2.headline||w2.about)pieces.push(`<div><strong>Professional signal</strong><span>${esc(w2.headline||w2.about)}</span></div>`);
    const safeInsight=w3.showcaseInsight||w3.reflection||w3.generalizedLearning||'';
    if(safeInsight)pieces.push(`<div><strong>Connection insight</strong><span>${esc(safeInsight)}</span></div>`);
    if(w4.targetRole||w4.targetOpportunity||w4.target)pieces.push(`<div><strong>Target</strong><span>${esc(w4.targetRole||w4.targetOpportunity||w4.target)}</span></div>`);
    const bullets=Array.isArray(w4.evidenceBullets)?w4.evidenceBullets.filter(x=>x&&x.revised).slice(0,3):[];
    if(bullets.length)pieces.push(`<div><strong>Resume evidence</strong><span>${bullets.map(x=>esc(x.revised)).join(' · ')}</span></div>`);
    const stories=Array.isArray(w5.starStories)?w5.starStories.filter(x=>x&&x.title).slice(0,2):[];
    if(stories.length)pieces.push(`<div><strong>Interview proof</strong><span>${stories.map(x=>esc(x.title)).join(' · ')}</span></div>`);
    if(w5.professionalIntroduction)pieces.push(`<div><strong>Professional introduction</strong><span>${esc(w5.professionalIntroduction)}</span></div>`);
    if(w5.improvementNext)pieces.push(`<div><strong>Improvement focus</strong><span>${esc(w5.improvementNext)}</span></div>`);
    if(pieces.length){$('carryForwardTitle').textContent='Accepted M360 evidence is ready to adapt.';$('carryForwardText').textContent='Use these reviewer-approved signals as source material. Earlier accepted artifacts remain unchanged.';$('carryForwardDetails').innerHTML=pieces.join('');$('carryForwardDetails').hidden=false;}
    prefillFromAccepted(w1,w2,w4,w5);
  }

  function prefillFromAccepted(w1,w2,w4,w5){
    const s=state(), w=week(s), d=w.draft||blank();
    if(!d.slide1Content)d.slide1Content=w1.direction||w2.headline||w1.brandStatement||'';
    if(!d.slide2Content){const bullets=Array.isArray(w4.evidenceBullets)?w4.evidenceBullets.filter(x=>x&&x.revised):[];d.slide2Content=(bullets[0]&&bullets[0].revised)||((Array.isArray(w5.starStories)&&w5.starStories[0]&&w5.starStories[0].result)||'');}
    if(!d.actionTarget)d.actionTarget=w4.targetRole||w4.targetOpportunity||w4.target||w5.targetDirection||'';
    if(!d.slide3Content)d.slide3Content=d.actionTarget||w5.improvementNext||'';
    w.draft=d;saveState(s);
  }

  function missing(){
    const d=draftFromForm();
    const required=[['Slides PDF/link',d.slidesUrl],['Slide 1 content',d.slide1Content],['Slide 2 content',d.slide2Content],['Slide 3 content',d.slide3Content],['Presentation status',d.presentationStatus],['30-day target',d.actionTarget],['Action 1',d.action1],['Action 2',d.action2],['Action 3',d.action3],['Support/accountability',d.accountability],['Readiness reflection',d.reflectionChanged],['Artifact reflection',d.reflectionArtifact],['First next step',d.reflectionNextStep]];
    const out=required.filter(([,v])=>!String(v||'').trim()).map(([k])=>k);
    if(d.presentationStatus==='Not completed')out.push('Completed presentation or approved exception');
    if(d.presentationStatus==='Approved Google Drive recording/link exception'&&!d.presentationEvidence)out.push('Approved exception link/reference');
    return out;
  }

  function renderProof(){
    const w=week(), d=w.accepted||w.submitted||w.draft||blank();
    const status=w.accepted?'Portfolio Ready':w.status==='submitted'?'Submitted for review':w.status==='needs_revision'?'Needs Revision':'Draft';
    $('week6ProofPreview').innerHTML=`<div class="proof-grid"><article><div class="mini-kicker">Slide 1</div><h3>Who I am / where I am going</h3><p>${esc(d.slide1Content)||'<em>Not yet drafted.</em>'}</p></article><article><div class="mini-kicker">Slide 2</div><h3>What I can do / proof</h3><p>${esc(d.slide2Content)||'<em>Not yet drafted.</em>'}</p></article><article><div class="mini-kicker">Slide 3</div><h3>What is next</h3><p>${esc(d.slide3Content)||'<em>Not yet drafted.</em>'}</p></article></div><div class="proof-summary"><strong>Presentation</strong><span>${esc(d.presentationStatus||'Not selected')}</span><strong>30-day target</strong><span>${esc(d.actionTarget||'Not yet defined')}</span><strong>Slides</strong><span>${d.slidesUrl?`<a href="${esc(d.slidesUrl)}" target="_blank" rel="noopener noreferrer">Open submitted slide file</a>`:'Not yet linked'}</span></div>`;
    $('week6ArtifactStatus').textContent=w.accepted?'PORTFOLIO READY':w.status==='submitted'?'SUBMITTED — AWAITING REVIEW':w.status==='needs_revision'?'NEEDS REVISION':'DRAFT — NOT YET ACCEPTED';
    $('reviewStatusLabel').textContent=w.accepted?'Meets Standard':status;
    $('reviewStatusText').textContent=w.accepted?`Week 6 is reviewer-approved${w.numericScore!=null?` at ${w.numericScore}/100`:''}.`:w.reviewerFeedback||'Continue working, then submit for review.';
  }

  function renderProgress(){const s=state();let ready=0;for(let i=1;i<=6;i++){const x=s.weeks&&s.weeks[`week${i}`];if(x&&x.accepted)ready++;if(i<=5&&$(`journeyWeek${i}`)&&x&&x.accepted)$(`journeyWeek${i}`).classList.add('complete');}$('journeyProgress').textContent=`${ready} of 6 artifacts portfolio ready`;$('sidebarPriorStatus').textContent=`${Math.min(ready,5)} ready`;$('sidebarPortfolioCount').textContent=`${ready} / 6`;$('sidebarProgressBar').style.width=`${Math.round(ready/6*100)}%`;const w=week(s);$('sidebarWeek6Status').textContent=w.accepted?'Portfolio Ready':w.status==='submitted'?'Submitted':w.status==='needs_revision'?'Needs Revision':'Draft';}
  function saveDraft(){const s=state(),w=week(s);w.draft=draftFromForm();if(w.status==='accepted')w.status='draft';saveState(s);$('saveState').textContent='Draft saved at '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});renderProof();renderProgress();}
  function submit(){const miss=missing();if(miss.length){$('validationMessage').textContent='Complete before submitting: '+miss.join(', ')+'.';return;}const s=state(),w=week(s);w.draft=draftFromForm();w.submitted=clone(w.draft);w.submittedAt=now();w.status='submitted';w.revisionNumber=(w.revisionNumber||0)+1;w.reviewerFeedback='';saveState(s);$('validationMessage').textContent='Submitted for review. Your submitted revision is preserved separately from future draft edits.';renderProof();renderProgress();}
  function demoReview(acceptedDecision){const s=state(),w=week(s);if(!w.submitted){$('validationMessage').textContent='Submit the Week 6 package before demo review.';return;}if(acceptedDecision){w.status='accepted';w.accepted=clone(w.submitted);w.acceptedAt=now();w.numericScore=80;w.rubricScores={clarity:16,relevance:16,evidence:16,application:16,professional_communication:16};w.reviewerFeedback='Meets Standard.';}else{w.status='needs_revision';w.reviewerFeedback='Strengthen the connection between your proof example and your professional direction.';}saveState(s);renderProof();renderProgress();}
  function resetReview(){const s=state(),w=week(s);w.status='draft';w.submitted=null;w.accepted=null;w.numericScore=null;w.rubricScores=null;w.reviewerFeedback='';saveState(s);renderProof();renderProgress();}
  function init(){carryForward();const s=state(),w=week(s);hydrate(w.draft||blank());renderProof();renderProgress();fieldIds.forEach(id=>{const el=$(id);if(el)el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{const s2=state(),w2=week(s2);w2.draft=draftFromForm();saveState(s2);renderProof();});});$('saveBtn').addEventListener('click',saveDraft);$('submitReviewBtn').addEventListener('click',submit);$('meetsStandardBtn').addEventListener('click',()=>demoReview(true));$('needsRevisionBtn').addEventListener('click',()=>demoReview(false));$('resetReviewBtn').addEventListener('click',resetReview);}
  init();
})();
