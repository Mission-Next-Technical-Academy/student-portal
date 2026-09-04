(() => {
  'use strict';

  const roster=document.getElementById('portfolioRoster');
  const refreshButton=document.getElementById('refreshPortfolioRosterBtn');
  const ELIGIBLE=['SOCAN','HDESK','AIENG'];

  function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

  function portfolioCount(rows,userId){return (rows||[]).filter(row=>row.user_id===userId&&row.accepted_artifact_payload).length;}

  function renderRoster(students,weekRows,progressRows){
    if(!students.length){
      roster.innerHTML='<div class="empty-state">No enrolled M360-eligible students were found.</div>';
      return;
    }
    const progressByUser=Object.fromEntries((progressRows||[]).map(row=>[row.user_id,row]));
    roster.innerHTML=students.map(student=>{
      const id=student.student_id||student.user_id;
      const ready=portfolioCount(weekRows,student.user_id);
      const progress=progressByUser[student.user_id]||null;
      const grade=progress&&progress.final_grade!=null?`${Number(progress.final_grade).toFixed(1)}%`:'Not final';
      const courseStatus=progress&&progress.course_complete?'M360 Complete':'In progress';
      const target=encodeURIComponent(student.user_id);
      return `<article class="course-state-card" data-portfolio-user="${esc(student.user_id)}">
        <div class="course-state-student"><strong>${esc(id)}</strong><span>${esc(student.track_code)} · Read-only showcase access</span></div>
        <div class="course-state-current ${ready===6?'complete':''}"><strong>${ready} / 6 Portfolio Ready</strong><span>Reviewer-approved artifacts only</span></div>
        <div class="course-state-current ${progress&&progress.course_complete?'complete':''}"><strong>${esc(courseStatus)}</strong><span>Final grade: ${esc(grade)}</span></div>
        <div class="course-state-actions">
          <a class="btn btn-secondary" href="portfolio.html?student=${target}" target="_blank" rel="noopener noreferrer">View Portfolio</a>
          <a class="btn btn-primary" href="portfolio.html?student=${target}&amp;print=1" target="_blank" rel="noopener noreferrer">Print Portfolio</a>
        </div>
      </article>`;
    }).join('');
  }

  async function loadPortfolios(){
    roster.innerHTML='<div class="empty-state">Loading student portfolios…</div>';
    if(refreshButton)refreshButton.disabled=true;
    try{
      const context=await M360Data.getContext({refresh:true});
      if(!context.authenticated){location.replace('../index.html#/login');return;}
      if(!context.isAdmin){location.replace('../index.html#/portal');return;}
      if(!(await M360Data.schemaAvailable({refresh:true}))){
        roster.innerHTML='<div class="empty-state">M360 durable data is unavailable.</div>';
        return;
      }

      const {data:students,error:studentError}=await mntSupabase
        .from('students')
        .select('user_id, student_id, track_code, is_enrolled, is_admin')
        .eq('is_enrolled',true)
        .eq('is_admin',false)
        .in('track_code',ELIGIBLE)
        .order('student_id',{ascending:true});
      if(studentError)throw studentError;

      const userIds=(students||[]).map(student=>student.user_id).filter(Boolean);
      let weekRows=[];
      let progressRows=[];
      if(userIds.length){
        const [weeksResult,progressResult]=await Promise.all([
          mntSupabase.from('m360_week_records').select('user_id, week_number, accepted_artifact_payload').in('user_id',userIds),
          mntSupabase.from('m360_course_progress').select('user_id, final_grade, course_complete').in('user_id',userIds)
        ]);
        if(weeksResult.error)throw weeksResult.error;
        if(progressResult.error)throw progressResult.error;
        weekRows=weeksResult.data||[];
        progressRows=progressResult.data||[];
      }
      renderRoster(students||[],weekRows,progressRows);
    }catch(error){
      console.error('M360 admin portfolio roster failed',error);
      roster.innerHTML='<div class="empty-state">Unable to load student portfolios. No technical-course data was changed.</div>';
    }finally{
      if(refreshButton)refreshButton.disabled=false;
    }
  }

  if(refreshButton)refreshButton.addEventListener('click',loadPortfolios);
  loadPortfolios();
})();
