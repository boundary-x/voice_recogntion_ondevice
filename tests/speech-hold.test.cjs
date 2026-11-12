const assert=require('node:assert/strict'),S=require('../speech-session.js');
const delay=()=>new Promise(r=>setTimeout(r,190));
const commands=[{phrase:'앞으로',data:'forward'},{phrase:'뒤로',data:'backward'}];
function rig(){let held=true,instances=[],sent=[],texts=[],ends=0,restarts=0,errors=[];class R{constructor(){instances.push(this)}start(){this.onstart()}stop(){}abort(){}}const tracker=new S.CommandTracker(commands),s=new S(R,{commands,start(){},shouldContinue:()=>held,restarting(){restarts++},result(text,parts){texts.push(text);sent.push(...tracker.update(parts))},end(){ends++},error(e){errors.push(e)}});return {s,instances,sent,texts,errors,release(){held=false},get ends(){return ends},get restarts(){return restarts},emit(r,text){r.onresult({resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal:false})]})}}};
(async()=>{
let a=rig();a.s.start();a.emit(a.instances[0],'앞으로');assert.deepEqual(a.sent,['forward']);assert.equal(a.ends,0); // live interim, before release
const old=a.instances[0];old.onend();await delay();assert.equal(a.instances.length,2);a.emit(old,'뒤로');assert.deepEqual(a.sent,['forward']);a.emit(a.instances[1],'뒤로');assert.deepEqual(a.sent,['forward','backward']);assert.equal(a.texts.at(-1),'앞으로 뒤로');a.instances[1].onend();await delay();a.emit(a.instances[2],'앞으로');assert.deepEqual(a.sent,['forward','backward','forward']);a.release();a.s.stop();a.instances[2].onend();await delay();assert.equal(a.instances.length,3);assert.equal(a.ends,1);
a=rig();a.s.start();a.instances[0].onend();a.release();a.s.stop();await delay();assert.equal(a.instances.length,1);assert.equal(a.ends,1);
a=rig();a.s.start();a.instances[0].onend();a.s.cancel();await delay();assert.equal(a.instances.length,1);assert.equal(a.ends,0);
a=rig();a.s.start();a.instances[0].onerror({error:'network'});a.instances[0].onend();await delay();assert.equal(a.instances.length,1);assert.deepEqual(a.errors,['network']);
a=rig();a.s.start();for(let i=0;i<3;i++){a.instances.at(-1).onend();await delay()}assert.equal(a.instances.length,3);assert.deepEqual(a.errors,['restart-loop']);
// Browser restart start() failure is reported and does not loop.
let count=0,error;class F{constructor(){this.n=++count;F.last=this}start(){if(this.n>1)throw Object.assign(Error('denied'),{name:'NotAllowedError'});this.onstart()}abort(){}}const s=new S(F,{start(){},shouldContinue:()=>true,end(){},error:e=>error=e});s.start();F.last.onend();await delay();assert.equal(error,'NotAllowedError');assert.equal(count,2);
console.log('PASS: live interim delivery, held restart, transcript retention, unique command indices, release/cancel/error guards, stale callbacks, restart loop and start failure');
})().catch(e=>{console.error(e);process.exit(1)});
