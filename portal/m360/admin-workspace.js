(() => {
  'use strict';

  const ELIGIBLE = ['SOCAN','HDESK','AIENG','ELECT'];
  const state = {
    cohorts: [], students: [], course: [], progress: [], weeks: [], submissions: [],
    cohortId: '', studentStatus: 'all', reviewState: 'submitted', selected: new Set()
  };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fmtDate = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—';
  const fmtTime = value => value ? new Date(value).toLocaleString() : '—';
  const trackLabel = code => ({HDESK:'Help Desk',SOCAN:'SOC Analyst',AIENG:'AI / ML',ELECT:'Electrical'})[code] || code || '—';
  const weekTitle = week => ({1:'Career Direction & Professional Brand',2:'LinkedIn & Professional Presence',3:'Networking & Professional Follow-Up',4:'Targeted Resume Development',5:'Interview Preparation & Practice',6:'Career Spotlight'})[Number(week)] || `Week ${week}`;

  function notice(message, tone='') {
    const el = $('adminNotice');
    if (!message) { el.hidden = true; el.textContent=''; el.className='review-notice'; return; }
    el.hidden = false; el.textContent = message; el.className = `review-notice${tone ? ' '+tone : ''}`;
  }

  function activeCohort() { return state.cohorts.find(c => c.id === state.cohortId) || null; }
  function studentsForCohort() { return state.students.filter(s => !state.cohortId || s.cohort_id === state.cohortId); }
  function courseByUser(id) { return state.course.find(r => r.user_id === id) || {}; }
  function progressByUser(id) { return state.progress.find(r => r.user_id === id) || {}; }
  function weeksByUser(id) { return state.weeks.filter(r => r.user_id === id); }
  function currentReviewByUser(id) { return weeksByUser(id).filter(r => r.review_status === 'submitted'); }
  function revisionByUser(id) { return weeksByUser(id).filter(r => r.review_status === 'needs_revision'); }
  function acceptedCount(id) { return weeksByUser(id).filter(r => r.accepted_artifact_payload).length; }

  function chooseDefaultCohort() {
    const today = new Date().toISOString().slice(0,10);
    const future = state.cohorts.filter(c => !c.archived_at && c.start_date >= today && !/dev|test/i.test(c.name || '')).sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date)));
    const active = state.cohorts.filter(c => !c.archived_at && c.start_date <= today && (!c.end_date || c.end_date >= today) && !/dev|test/i.test(c.name || '')).sort((a,b)=>String(b.start_date).localeCompare(String(a.start_date)));
    return (active[0] || future[0] || state.cohorts[0] || {}).id || '';
  }

  async function requireAdmin() {
    const context = await M360Data.getContext({refresh:true});
    if (!context.authenticated) { location.replace('../index.html#/login'); return false; }
    if (!context.isAdmin) { location.replace('../index.html#/portal'); return false; }
    if (!(await M360Data.schemaAvailable({refresh:true}))) throw new Error('M360 durable data is unavailable.');
    return true;
  }

  async function loadWorkspace() {
    notice('');
    $('refreshWorkspaceBtn').disabled = true;
    try {
      if (!(await requireAdmin())) return;
      const [cohortsResult, studentsResult, courseResult, progressResult, weeksResult, submissionsResult] = await Promise.all([
        mntSupabase.from('cohorts').select('id,name,start_date,end_date,archived_at').order('start_date',{ascending:false}),
        mntSupabase.from('students').select('user_id,student_id,track_code,is_enrolled,is_admin,cohort_id,scheduled_start_date,completion_date,withdrawal_date').eq('is_admin',false).in('track_code',ELIGIBLE),
        mntSupabase.from('m360_course_records').select('*'),
        mntSupabase.from('m360_course_progress').select('*'),
        mntSupabase.from('m360_week_records').select('*').order('week_number',{ascending:true}),
        mntSupabase.from('m360_week_submissions').select('id,user_id,track_code,week_number,revision_number,review_status,numeric_score,reviewer_feedback,reviewer_user_id,submitted_at,reviewed_at').order('submitted_at',{ascending:false})
      ]);
      [cohortsResult,studentsResult,courseResult,progressResult,weeksResult,submissionsResult].forEach(result => { if (result.error) throw result.error; });
      state.cohorts = cohortsResult.data || [];
      state.students = (studentsResult.data || []).filter(s => s.is_enrolled !== false || s.completion_date || s.withdrawal_date);
      state.course = courseResult.data || [];
      state.progress = progressResult.data || [];
      state.weeks = weeksResult.data || [];
      state.submissions = submissionsResult.data || [];
      if (!state.cohortId || !state.cohorts.some(c => c.id === state.cohortId)) state.cohortId = chooseDefaultCohort();
      renderCohorts(); renderAll();
    } catch (error) {
      console.error('M360 admin workspace load failed', error);
      notice(error.message || 'Unable to load the M360 administration workspace.', 'error');
    } finally { $('refreshWorkspaceBtn').disabled = false; }
  }

  function renderCohorts() {
    const select = $('cohortSelect');
    const countBy = Object.fromEntries(state.cohorts.map(c => [c.id, state.students.filter(s => s.cohort_id===c.id && s.is_enrolled!==false).length]));
    select.innerHTML = state.cohorts.map(c => `<option value="${esc(c.id)}" ${c.id===state.cohortId?'selected':''}>${esc(c.name)} · ${fmtDate(c.start_date)} · ${countBy[c.id]||0} students${c.archived_at?' · Archived':''}</option>`).join('');
  }

  function studentModel(student) {
    const course = courseByUser(student.user_id); const progress = progressByUser(student.user_id); const weeks = weeksByUser(student.user_id);
    const accepted = acceptedCount(student.user_id); const reviews = currentReviewByUser(student.user_id); const revisions = revisionByUser(student.user_id);
    const startComplete = Boolean(course.start_here_completed_at); const support = Boolean(course.start_here_support_flag);
    const attendance = Boolean(course.attendance_requirement_met); const spotlight = course.career_spotlight_presentation_status && course.career_spotlight_presentation_status !== 'not_completed';
    const complete = Boolean(progress.course_complete); const grade = progress.final_grade == null ? null : Number(progress.final_grade);
    const needsAttention = support || reviews.length || revisions.length || !attendance || (!spotlight && accepted >= 5);
    return {student,course,progress,weeks,accepted,reviews,revisions,startComplete,support,attendance,spotlight,complete,grade,needsAttention};
  }

  function renderOverview() {
    const models = studentsForCohort().map(studentModel);
    const reviewCount = models.reduce((n,m)=>n+m.reviews.length,0);
    const supportCount = models.filter(m=>m.support).length;
    const adminActions = models.filter(m=>!m.attendance || (m.accepted>=5 && !m.spotlight)).length;
    const onTrack = models.filter(m=>!m.needsAttention && !m.complete).length;
    $('reviewTabCount').textContent = String(reviewCount);
    $('overviewSummary').innerHTML = [
      ['students',models.length,'Students'],['review',reviewCount,'Need Review'],['support',supportCount,'Needs Support'],['attention',adminActions,'Admin Actions']
    ].map(([filter,count,label])=>`<button class="m360-summary-card" type="button" data-overview-filter="${filter}"><strong>${count}</strong><span>${label}</span></button>`).join('');
    const cohort = activeCohort();
    $('cohortSummaryText').textContent = cohort ? `${cohort.name} · ${fmtDate(cohort.start_date)}–${fmtDate(cohort.end_date)} · ${models.length} student${models.length===1?'':'s'}${onTrack?` · ${onTrack} currently on track`:''}` : `${models.length} students`;
    const start = models.filter(m=>m.startComplete).length, attendance=models.filter(m=>m.attendance).length, spotlight=models.filter(m=>m.spotlight).length, complete=models.filter(m=>m.complete).length;
    const rows = [['Start Here',start],...[1,2,3,4,5,6].map(w=>[`Week ${w}`,models.filter(m=>m.weeks.some(r=>Number(r.week_number)===w && r.accepted_artifact_payload)).length]),['Attendance',attendance],['Career Spotlight',spotlight],['M360 Complete',complete]];
    $('cohortProgressRows').innerHTML = rows.map(([label,count])=>`<div class="m360-progress-row"><strong>${esc(label)}</strong><span>${count} / ${models.length}</span></div>`).join('') || '<div class="m360-empty">No students in this cohort.</div>';
    const overdue = state.weeks.filter(r=>r.review_status==='submitted' && r.submitted_at && Date.now()-new Date(r.submitted_at).getTime()>24*60*60*1000 && models.some(m=>m.student.user_id===r.user_id)).length;
    const attendanceOpen=models.filter(m=>!m.attendance).length, spotlightOpen=models.filter(m=>m.accepted>=5&&!m.spotlight).length, revisions=models.reduce((n,m)=>n+m.revisions.length,0);
    const items = [[reviewCount,'submission'+(reviewCount===1?'':'s')+' awaiting faculty review','review'],[overdue,'review'+(overdue===1?'':'s')+' beyond 24 hours','review'],[supportCount,'student'+(supportCount===1?'':'s')+' with Start Here support signal','support'],[attendanceOpen,'attendance verification'+(attendanceOpen===1?'':'s')+' open','attendance'],[spotlightOpen,'Career Spotlight verification'+(spotlightOpen===1?'':'s')+' open','spotlight'],[revisions,'week'+(revisions===1?'':'s')+' returned for revision','revision']].filter(i=>i[0]);
    $('attentionList').innerHTML = items.length ? items.map(([count,label,filter])=>`<button type="button" class="m360-attention-item" data-attention-filter="${filter}"><strong>${count} ${esc(label)}</strong><span>View →</span></button>`).join('') : '<div class="m360-empty">No current attention items.</div>';
  }

  function matchesStudentFilter(model) {
    const q = ($('studentSearch').value || $('globalStudentSearch').value || '').trim().toLowerCase();
    const track = $('studentTrackFilter').value; const week = Number($('studentWeekFilter').value || 0);
    if (q && !`${model.student.student_id||''} ${model.student.track_code||''} ${trackLabel(model.student.track_code)}`.toLowerCase().includes(q)) return false;
    if (track && model.student.track_code !== track) return false;
    if (week && !model.weeks.some(r=>Number(r.week_number)===week)) return false;
    switch(state.studentStatus){
      case 'attention': return model.needsAttention;
      case 'review': return model.reviews.length>0;
      case 'revision': return model.revisions.length>0;
      case 'attendance': return !model.attendance;
      case 'spotlight': return !model.spotlight;
      case 'complete': return model.complete;
      default:return true;
    }
  }

  function renderStudents() {
    const models = studentsForCohort().map(studentModel).filter(matchesStudentFilter);
    const body = $('studentTableBody');
    if (!models.length) { body.innerHTML='<tr><td colspan="9"><div class="m360-empty">No students match the current filters.</div></td></tr>'; $('selectAllStudents').checked=false; renderBulkBar(); return; }
    body.innerHTML = models.map(m => {
      const review = m.reviews.length ? `<span class="m360-pill warn">${m.reviews.length} waiting</span>` : m.revisions.length ? '<span class="m360-pill bad">Revision</span>' : '<span class="m360-pill good">Current</span>';
      return `<tr data-student-row="${esc(m.student.user_id)}"><td><input type="checkbox" data-select-student="${esc(m.student.user_id)}" ${state.selected.has(m.student.user_id)?'checked':''} aria-label="Select ${esc(m.student.student_id||m.student.user_id)}" /></td><td><span class="student-id">${esc(m.student.student_id||m.student.user_id)}</span></td><td>${esc(trackLabel(m.student.track_code))}</td><td>${m.startComplete?'<span class="m360-pill good">Complete</span>':m.support?'<span class="m360-pill warn">Support</span>':'<span class="m360-pill">Pending</span>'}</td><td>${m.accepted} / 6</td><td>${review}</td><td>${m.grade==null?'—':`${m.grade.toFixed(1)}%`}</td><td>${m.spotlight?'<span class="m360-pill good">Complete</span>':'<span class="m360-pill">Open</span>'}</td><td>${m.attendance?'<span class="m360-pill good">Verified</span>':'<span class="m360-pill warn">Open</span>'}</td></tr>`;
    }).join('');
    body.querySelectorAll('[data-select-student]').forEach(input=>input.addEventListener('click',event=>{event.stopPropagation(); input.checked?state.selected.add(input.dataset.selectStudent):state.selected.delete(input.dataset.selectStudent); renderBulkBar();}));
    body.querySelectorAll('[data-student-row]').forEach(row=>row.addEventListener('click',()=>openStudent(row.dataset.studentRow)));
    $('selectAllStudents').checked = models.every(m=>state.selected.has(m.student.user_id)); renderBulkBar();
  }

  function renderBulkBar() {
    $('bulkBar').classList.toggle('is-active',state.selected.size>0); $('bulkCount').textContent=`${state.selected.size} student${state.selected.size===1?'':'s'} selected`;
  }

  function openStudent(userId) {
    const student = state.students.find(s=>s.user_id===userId); if(!student)return;
    const m = studentModel(student); const drawer=$('studentDrawer');
    const attention=[m.reviews.length?`${m.reviews.length} submission${m.reviews.length===1?'':'s'} awaiting review`:null,m.revisions.length?`${m.revisions.length} week${m.revisions.length===1?'':'s'} needs revision`:null,m.support?'Start Here support follow-up':null,!m.attendance?'Attendance verification open':null,!m.spotlight?'Career Spotlight pending':null].filter(Boolean);
    drawer.innerHTML=`<div class="m360-drawer-head"><div><div class="mini-kicker">Student M360 record</div><h2>${esc(student.student_id||student.user_id)}</h2><div class="m360-review-meta">${esc(trackLabel(student.track_code))} · ${esc(activeCohort()?.name||'Cohort unavailable')}</div></div><button class="btn btn-secondary" type="button" data-close-drawer>Close</button></div>
      <div class="m360-drawer-section"><div class="m360-drawer-grid"><div class="m360-drawer-stat"><span>Progress</span><strong>${m.accepted} / 6 weeks</strong></div><div class="m360-drawer-stat"><span>Grade</span><strong>${m.grade==null?'Not final':m.grade.toFixed(1)+'%'}</strong></div><div class="m360-drawer-stat"><span>Attendance</span><strong>${m.attendance?'Verified':'Open'}</strong></div><div class="m360-drawer-stat"><span>Spotlight</span><strong>${m.spotlight?'Complete':'Pending'}</strong></div></div></div>
      <div class="m360-drawer-section"><h3>Attention</h3>${attention.length?`<ul>${attention.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>No current attention items.</p>'}</div>
      <div class="m360-drawer-section"><h3>Week progress</h3><div class="m360-week-strip">${[1,2,3,4,5,6].map(w=>{const r=m.weeks.find(x=>Number(x.week_number)===w);const cls=r?.accepted_artifact_payload?'good':r?.review_status==='submitted'||r?.review_status==='needs_revision'?'warn':'pending';return `<div class="m360-week-box ${cls}">W${w}<br>${r?.accepted_artifact_payload?'✓':r?.review_status==='submitted'?'Review':r?.review_status==='needs_revision'?'Revise':'—'}</div>`}).join('')}</div></div>
      <div class="m360-drawer-section"><h3>Start Here</h3><p>${m.startComplete?'Complete':'Not complete'}${m.support?' · Support follow-up suggested':''}</p></div>
      <div class="m360-drawer-section"><div class="m360-review-actions"><a class="btn btn-secondary" href="portfolio.html?student=${encodeURIComponent(userId)}" target="_blank" rel="noopener noreferrer">View Portfolio</a>${m.reviews.length?'<button class="btn btn-primary" type="button" data-open-reviews>Review waiting work</button>':''}</div></div>`;
    $('drawerBackdrop').hidden=false; drawer.hidden=false;
    drawer.querySelector('[data-close-drawer]').addEventListener('click',closeStudent);
    drawer.querySelector('[data-open-reviews]')?.addEventListener('click',()=>{closeStudent(); switchTab('reviews');});
  }
  function closeStudent(){ $('drawerBackdrop').hidden=true; $('studentDrawer').hidden=true; }

  function labelize(key){return String(key||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
  function renderValue(value){ if(value==null||value==='')return '<span class="empty">Not provided</span>'; if(typeof value==='boolean')return value?'Yes':'No'; if(Array.isArray(value))return esc(value.join(' · ')); if(typeof value==='object')return Object.entries(value).map(([k,v])=>`${esc(labelize(k))}: ${renderValue(v)}`).join('<br>'); return esc(value); }
  function payloadRows(payload){return payload&&typeof payload==='object'?Object.entries(payload).map(([k,v])=>`<div class="m360-payload-row"><strong>${esc(labelize(k))}</strong><div>${renderValue(v)}</div></div>`).join(''):'<div class="m360-empty">No submitted payload.</div>';}
  function scoreFields(row){const dims=[['clarity','Clarity'],['relevance','Relevance'],['evidence','Evidence'],['application','Application']];if(Number(row.week_number)===6)dims.push(['professional_communication','Professional Communication']);const max=Number(row.week_number)===6?20:25;return dims.map(([k,l])=>`<div class="m360-score-field"><label>${l} / ${max}</label><input data-score="${k}" type="number" min="0" max="${max}" step="1" /></div>`).join('');}

  function reviewRows() {
    const ids=new Set(studentsForCohort().map(s=>s.user_id));
    return state.weeks.filter(r=>ids.has(r.user_id) && r.review_status===state.reviewState).sort((a,b)=>String(a.submitted_at||'').localeCompare(String(b.submitted_at||'')));
  }
  function renderReviews(){
    const rows=reviewRows(); const queue=$('reviewQueue');
    if(!rows.length){queue.innerHTML=`<div class="m360-empty">No ${state.reviewState==='submitted'?'submissions awaiting review':state.reviewState==='needs_revision'?'returned revisions':'completed reviews'} in this cohort.</div>`;return;}
    queue.innerHTML=rows.map(row=>{const s=state.students.find(x=>x.user_id===row.user_id)||{};const age=row.submitted_at?Math.max(0,(Date.now()-new Date(row.submitted_at).getTime())/3600000):0;const status=state.reviewState==='submitted'?(age>=24?'<span class="m360-pill bad">Overdue</span>':age>=20?'<span class="m360-pill warn">Due soon</span>':'<span class="m360-pill">Submitted</span>'):state.reviewState==='needs_revision'?'<span class="m360-pill warn">Needs Revision</span>':'<span class="m360-pill good">Accepted</span>';
      const scoring=state.reviewState==='submitted'?`<section><h4>Reviewer decision</h4><div class="m360-score-grid">${scoreFields(row)}</div><div class="review-total">Total: <span data-total>0</span> / 100</div><label class="m360-score-field"><span>Feedback</span><textarea data-feedback placeholder="Give specific, actionable feedback."></textarea></label><div class="m360-review-actions"><button class="btn btn-secondary" data-decision="needs_revision" type="button">Needs Revision</button><button class="btn btn-primary" data-decision="accepted" type="button">Meets Standard</button></div></section>`:`<section><h4>Review outcome</h4><p><strong>Score:</strong> ${row.numeric_score==null?'—':Number(row.numeric_score).toFixed(1)+'/100'}</p><p><strong>Reviewed:</strong> ${esc(fmtTime(row.reviewed_at))}</p><p>${esc(row.reviewer_feedback||'No feedback recorded.')}</p></section>`;
      return `<article class="m360-review-card" data-review-card data-user-id="${esc(row.user_id)}" data-week="${Number(row.week_number)}"><div class="m360-review-card-head"><div><div class="mini-kicker">${esc(s.student_id||row.user_id)} · ${esc(trackLabel(s.track_code||row.track_code))}</div><h3>Week ${Number(row.week_number)} · ${esc(weekTitle(row.week_number))}</h3><div class="m360-review-meta">Revision ${Number(row.revision_number||1)} · Submitted ${esc(fmtTime(row.submitted_at))}${state.reviewState==='submitted'?` · ${age.toFixed(1)}h ago`:''}</div></div>${status}</div><div class="m360-review-body"><section><h4>Submitted evidence</h4>${payloadRows(row.submitted_payload)}</section>${scoring}</div></article>`;
    }).join('');
    wireReviews();
  }

  function wireReviews(){
    $('reviewQueue').querySelectorAll('[data-review-card]').forEach(card=>{
      const total=card.querySelector('[data-total]');
      card.querySelectorAll('[data-score]').forEach(input=>input.addEventListener('input',()=>{let n=0;card.querySelectorAll('[data-score]').forEach(i=>n+=Number(i.value||0));if(total)total.textContent=String(n);}));
      card.querySelectorAll('[data-decision]').forEach(button=>button.addEventListener('click',async()=>{
        const inputs=[...card.querySelectorAll('[data-score]')]; if(inputs.some(i=>i.value==='')){notice('Score every rubric dimension before recording a decision.','error');return;}
        const scores=Object.fromEntries(inputs.map(i=>[i.dataset.score,Number(i.value)])); const sum=Object.values(scores).reduce((a,b)=>a+b,0); if(button.dataset.decision==='accepted'&&sum<70){notice('Meets Standard requires a total score of at least 70.','error');return;}
        card.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{await M360Data.reviewWeek(card.dataset.userId,Number(card.dataset.week),button.dataset.decision,scores,card.querySelector('[data-feedback]').value.trim());notice(button.dataset.decision==='accepted'?'Review accepted and saved.':'Submission returned for revision.','success');await loadWorkspace();switchTab('reviews');}
        catch(error){console.error(error);notice(error.message||'Unable to save review.','error');card.querySelectorAll('button').forEach(b=>b.disabled=false);}
      }));
    });
  }

  function renderAll(){renderOverview();renderStudents();renderReviews();}
  function switchTab(name){document.querySelectorAll('[data-admin-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.adminTab===name)));document.querySelectorAll('[data-admin-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.adminPanel===name));}
  function setStudentStatus(status){state.studentStatus=status;document.querySelectorAll('[data-student-status]').forEach(b=>b.classList.toggle('is-active',b.dataset.studentStatus===status));renderStudents();switchTab('students');}

  function openBulk(type){
    const selected=[...state.selected].map(id=>state.students.find(s=>s.user_id===id)).filter(Boolean); if(!selected.length)return;
    const modal=$('bulkModal');
    if(type==='attendance') modal.innerHTML=`<h2 id="bulkModalTitle">Verify M360 Attendance</h2><p>${selected.length} student${selected.length===1?'':'s'} selected. This creates an individual verification for each student.</p><label class="m360-admin-field"><span>Attendance requirement</span><select id="bulkAttendanceStatus"><option value="satisfied">Requirement satisfied</option><option value="unverified">Not verified</option></select></label><label class="m360-admin-field"><span>External record reference</span><input id="bulkAttendanceReference" type="text" placeholder="Controlled roster / record reference" /></label><div class="m360-modal-actions"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="confirmBulkAttendance">Update ${selected.length}</button></div>`;
    else modal.innerHTML=`<h2 id="bulkModalTitle">Update Career Spotlight</h2><p>${selected.length} student${selected.length===1?'':'s'} selected. Each student receives an individual staff verification.</p><label class="m360-admin-field"><span>Presentation status</span><select id="bulkSpotlightStatus"><option value="presented_live">Presented live</option><option value="approved_makeup_completed">Approved makeup completed</option><option value="approved_exception_completed">Approved recording/link exception completed</option><option value="not_completed">Not yet completed</option></select></label><label class="m360-admin-field"><span>Reference</span><input id="bulkSpotlightReference" type="text" placeholder="Session, makeup, or exception reference" /></label><div class="m360-modal-actions"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn btn-primary" id="confirmBulkSpotlight">Update ${selected.length}</button></div>`;
    $('bulkModalBackdrop').hidden=false; modal.querySelector('[data-close-modal]').addEventListener('click',closeBulk);
    $('confirmBulkAttendance')?.addEventListener('click',()=>saveBulkAttendance(selected)); $('confirmBulkSpotlight')?.addEventListener('click',()=>saveBulkSpotlight(selected));
  }
  function closeBulk(){$('bulkModalBackdrop').hidden=true;}
  async function saveBulkAttendance(students){const met=$('bulkAttendanceStatus').value==='satisfied',ref=$('bulkAttendanceReference').value.trim();if(met&&!ref){notice('Enter a controlled external attendance record reference before verifying attendance.','error');return;}try{await Promise.all(students.map(s=>M360Data.setAttendance(s.user_id,met,ref)));closeBulk();state.selected.clear();notice(`Attendance updated for ${students.length} student${students.length===1?'':'s'}.`,'success');await loadWorkspace();switchTab('students');}catch(error){notice(error.message||'Bulk attendance update failed.','error');}}
  async function saveBulkSpotlight(students){const status=$('bulkSpotlightStatus').value,ref=$('bulkSpotlightReference').value.trim();try{await Promise.all(students.map(s=>M360Data.setSpotlightPresentation(s.user_id,status,ref)));closeBulk();state.selected.clear();notice(`Career Spotlight status updated for ${students.length} student${students.length===1?'':'s'}.`,'success');await loadWorkspace();switchTab('students');}catch(error){notice(error.message||'Bulk Spotlight update failed.','error');}}

  function exportSelected(){const rows=[...state.selected].map(id=>state.students.find(s=>s.user_id===id)).filter(Boolean).map(studentModel);if(!rows.length)return;const csv=[['Student ID','Track','Accepted Weeks','Final Grade','Start Here','Spotlight','Attendance','Course Complete'],...rows.map(m=>[m.student.student_id||m.student.user_id,trackLabel(m.student.track_code),m.accepted,m.grade==null?'':m.grade,m.startComplete?'Complete':'Pending',m.spotlight?'Complete':'Open',m.attendance?'Verified':'Open',m.complete?'Complete':'In progress'])].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`m360-${activeCohort()?.name||'cohort'}-students.csv`.replace(/[^a-z0-9.-]+/gi,'-').toLowerCase();a.click();URL.revokeObjectURL(a.href);}

  function wire(){
    document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.adminTab)));
    $('cohortSelect').addEventListener('change',()=>{state.cohortId=$('cohortSelect').value;state.selected.clear();renderAll();});
    $('refreshWorkspaceBtn').addEventListener('click',loadWorkspace);
    $('globalStudentSearch').addEventListener('input',()=>{$('studentSearch').value=$('globalStudentSearch').value;renderStudents();}); $('studentSearch').addEventListener('input',renderStudents); $('studentTrackFilter').addEventListener('change',renderStudents); $('studentWeekFilter').addEventListener('change',renderStudents);
    $('clearStudentFiltersBtn').addEventListener('click',()=>{$('studentSearch').value='';$('globalStudentSearch').value='';$('studentTrackFilter').value='';$('studentWeekFilter').value='';setStudentStatus('all');});
    document.querySelectorAll('[data-student-status]').forEach(b=>b.addEventListener('click',()=>setStudentStatus(b.dataset.studentStatus)));
    document.querySelectorAll('[data-review-state]').forEach(b=>b.addEventListener('click',()=>{state.reviewState=b.dataset.reviewState;document.querySelectorAll('[data-review-state]').forEach(x=>x.classList.toggle('is-active',x===b));renderReviews();}));
    $('selectAllStudents').addEventListener('change',()=>{studentsForCohort().map(studentModel).filter(matchesStudentFilter).forEach(m=>$('selectAllStudents').checked?state.selected.add(m.student.user_id):state.selected.delete(m.student.user_id));renderStudents();});
    $('bulkClearBtn').addEventListener('click',()=>{state.selected.clear();renderStudents();}); $('bulkAttendanceBtn').addEventListener('click',()=>openBulk('attendance')); $('bulkSpotlightBtn').addEventListener('click',()=>openBulk('spotlight')); $('bulkExportBtn').addEventListener('click',exportSelected);
    $('drawerBackdrop').addEventListener('click',closeStudent); $('bulkModalBackdrop').addEventListener('click',e=>{if(e.target===$('bulkModalBackdrop'))closeBulk();});
    $('overviewSummary').addEventListener('click',e=>{const b=e.target.closest('[data-overview-filter]');if(!b)return;if(b.dataset.overviewFilter==='review')switchTab('reviews');else if(b.dataset.overviewFilter==='support')setStudentStatus('attention');else if(b.dataset.overviewFilter==='attention')setStudentStatus('attention');else switchTab('students');});
    $('attentionList').addEventListener('click',e=>{const b=e.target.closest('[data-attention-filter]');if(!b)return;if(b.dataset.attentionFilter==='review'){state.reviewState='submitted';renderReviews();switchTab('reviews');}else if(b.dataset.attentionFilter==='support')setStudentStatus('attention');else setStudentStatus(b.dataset.attentionFilter);});
  }

  wire(); loadWorkspace();
})();