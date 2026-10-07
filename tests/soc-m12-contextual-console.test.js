'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const read=name=>fs.readFileSync(`portal/${name}.js`,'utf8');
const context=vm.createContext({console,URL,esc:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))});
context.m03eRow=(source,id,day,time,fields)=>({EventSource:source,EventId:id,__rid:id,TimeGenerated:`${day}T${time}Z`,...fields});
context.m03eBuildDataset=spec=>({...spec,records:Object.fromEntries(spec.events.map(r=>[r.EventId,r])),tables:{...Object.fromEntries([...new Set(spec.events.map(r=>r.EventSource))].map(source=>[source,spec.events.filter(r=>r.EventSource===source)])),UnifiedEvents:spec.events}});
let mounted,consoleState={tab:'alerts',pins:[],selected:null};
context.m03eMountConsole=(scope,options)=>{mounted=options;};
context.m03eState=()=>consoleState;
for(const method of ['Alerts','Search','Timeline','Evidence'])context[`m03e${method}View`]=()=>'<section class="m03e-view">Native console records</section>';
context.moduleTwelveSave=()=>{};context.moduleTwelveRender=()=>{};
for(const file of ['attack-catalog','soc-assessment-scorer','kql-engine'])vm.runInContext(read(file),context,{filename:file});
const files=[...fs.readFileSync('portal/index.html','utf8').matchAll(/src="(soc-m(?:0[4-9]|10)-[^?".]+)\.js/g)].map(m=>m[1]);
for(const file of files)vm.runInContext(read(file),context,{filename:file});
for(const file of ['soc-console-tools','soc-m12-assessment-data','soc-m12-assessment-state','soc-m12-assessment-rubric','soc-m12-assessment-scorer','soc-m12-assessment-console','soc-m12-tool-bridge'])vm.runInContext(read(file),context,{filename:file});
const get=name=>vm.runInContext(name,context);
const fixture=get('SocM12AssessmentData'),api=get('SocM12AssessmentState'),ui=get('SocM12AssessmentConsole'),bridge=get('SocM12ToolBridge');
context.moduleTwelveState={tools:{},assessmentState:api.fresh(fixture),stageVisits:[],submitted:false};
ui.mount(null);
const data=ui.dataset(),fx=ui.fixtures(data);
assert.equal(new Set(data.events.map(r=>r.EventId)).size,data.events.length,'native exposure IDs are not duplicated');
assert.equal(fx.m04.scenario.iocs.length,5);
assert.ok(fx.m07.scenario.messages.length>1 && fx.m07.scenario.networkEvents.length>1);
assert.equal(fx.m08.scenario.findings.length,6);
// Parse actual mounted tab output into HTML elements with attributes. This
// checks the control locations without a browser dependency; S5 runs browser.
const elements=html=>JSON.parse(execFileSync('python3',['-c',`import sys,json
from html.parser import HTMLParser
class P(HTMLParser):
 def __init__(self): super().__init__(); self.nodes=[]
 def handle_starttag(self,tag,attrs): self.nodes.append({'tag':tag,'attrs':dict(attrs)})
p=P(); p.feed(sys.stdin.read()); print(json.dumps(p.nodes))`],{input:html,encoding:'utf8'}));
const render=(tab,selection)=>{consoleState={tab,pins:[],selected:selection};return mounted.views[tab]();};
const controls=(tab,selection)=>elements(render(tab,selection)).filter(n=>n.attrs['data-m12-context']).map(n=>n.attrs['data-m12-context']);
assert.deepEqual(controls('alerts',null),[],'no alert decisions until an alert is selected');
assert.deepEqual(controls('alerts',{type:'alert',id:'AL-1201'}),['alert','incident-link']);
assert.deepEqual(controls('intelligence',null),[],'no verdict chosen by opening intelligence');
assert.deepEqual(controls('intelligence',{type:'intel',id:'TI-601'}),['intel']);
for(const [tab,id] of [['search','ID-402'],['timeline','EP-301'],['evidence','EP-303'],['email','EM-212'],['network','NW-501'],['exposure','VX-701']]) {
  assert.ok(controls(tab,{type:'record',id}).includes('finding'),`${tab} records findings against selected evidence`);
  assert.match(render(tab,{type:'record',id}),new RegExp(`data-evidence-id="${id}"`));
}
assert.deepEqual(controls('email',{type:'record',id:'EP-301'}),[],'stale selection from another domain does not create a finding form');
assert.deepEqual(controls('response',null),['workflow','execute']);
// The capstone renders the same designer as Module 09, with the inline syntax example.
assert.match(render('response',null),/data-m09-workflow-designer/);
assert.match(render('response',null),/One connection per line, e\.g\. <code>scan&gt;monitor<\/code>/);
assert.match(render('response',null),/<form data-m12-context="workflow">/);
for(const tab of ['rules','automation','endpoint','hunting','attack','incident','recovery','locker','reconstruction']) {
  assert.equal(typeof mounted.views[tab],'function',`${tab} keeps native tool controls`);
  assert.ok(mounted.views[tab]().length>20,`${tab} still renders`);
}
for(const id of ['TI-601','TI-603','TI-602','TI-604','TI-605'])assert.match(render('intelligence',null),new RegExp(`data-m12-select-intel="${id}"`));
let state=api.fresh(fixture);
const record=(kind,values,selection,tab)=>{state=ui.recordContextual(state,{tab,selected:selection},data,kind,values);};
for(const id of ['AL-1201','AL-1202'])record('alert',{contextId:id,disposition:'true-positive',reason:'The alert is supported by the correlated process, identity and network evidence.'},{type:'alert',id},'alerts');
record('incident-link',{contextId:'AL-1201',incidentId:'INC-4821'},{type:'alert',id:'AL-1201'},'alerts');
record('intel',{contextId:'TI-601',decision:'malicious',rationale:'The feed indicator matches the destination in NW-501 and unfamiliar client in ID-402.'},{type:'intel',id:'TI-601'},'intelligence');
for(const [domain,id] of [['identity','ID-402'],['email','EM-212'],['endpoint','EP-301'],['network','NW-501'],['exposure','VX-701']])record('finding',{contextId:id,domain,finding:`${id} records the observed ${domain} behavior and establishes context for this investigation.`},{type:'record',id},'search');
record('finding',{contextId:'EM-212',domain:'scope',finding:'EM-212 identifies acct-204 and ws-204 in the correlated email investigation scope.'},{type:'record',id:'EM-212'},'email');
record('workflow',{name:'Scoped incident response',nodes:['preserve','approval','isolate'],edges:'preserve>approval\napproval>isolate'},null,'response');
assert.deepEqual(JSON.parse(JSON.stringify(state.actionHistory.at(-1).details)).edges,[{from:'preserve',to:'approval'},{from:'approval',to:'isolate'}],'workflow-design keeps its recorded from/to shape');
assert.throws(()=>ui.recordContextual(state,{tab:'response',selected:null},data,'workflow',{name:'Bad',nodes:['preserve','approval'],edges:'preserve approval'}),/from>to pair/);
assert.equal(state.investigations.find(i=>i.domain==='exposure').evidenceIds[0],'VX-701');
assert.ok(get('SocM12AssessmentRubric').extract(state,fixture).criteria.find(c=>c.id==='cross-domain-investigation').finding==='observed');
assert.throws(()=>ui.recordContextual(state,{tab:'search',selected:{type:'record',id:'EP-301'}},data,'finding',{contextId:'ID-402',domain:'identity',finding:'Unsupported context injection'}),/Select the evidence/);
record('execute',{action:'isolate',target:'ws-204'},null,'response');
assert.equal(state.executions.at(-1).outcome,'blocked','explicit unapproved attempts persist in the range log');
assert.equal(get('SocM12AssessmentRubric').extract(state,fixture).unsafeExecution,true,'attempt activates safety cap');
assert.match(state.actionHistory.at(-1).details.sourceRef,/^m09:range-attempt:/);
assert.equal(api.normalize(state,fixture).executions.at(-1).outcome,'blocked');
assert.equal(bridge.project({},null,state,fixture).executions.length,state.executions.length,'native range attempt is not projected twice');
// Pack incident identities remain local investigations, not invented links
// between a case alert and the portfolio incident.
const m07Actions=get('SocM07AssessmentActions');
const m07=m07Actions.append({},'incident_link',new Date(fixture.scenario.fixedAt).toISOString(),{operation:'create',incidentId:'M07-INCIDENT-0001',title:'Email review',summary:'EM-212 is linked to the reviewed recipient and endpoint behavior.',assessment:'supported',recipientIds:['acct-204'],deviceIds:['ws-204'],eventIds:['EM-212']},fx.m07);
assert.equal(bridge.project({m07},null,api.fresh(fixture),fixture).incidentLinks.length,0);
const m08Actions=get('SocM08AssessmentActions');
const m08=m08Actions.append({},'finding_review',new Date(fixture.scenario.fixedAt).toISOString(),{findingId:'VX-701',status:'reviewed',evidenceIds:['VX-701'],notes:'VX-701 establishes the audit-only script policy control observed on ws-204.'},fx.m08);
assert.equal(bridge.project({m08},null,api.fresh(fixture),fixture).investigations[0].domain,'exposure');
console.log('M12 contextual tab controls, native fixtures, findings/scope, workflow and audited safety attempts: passed');
