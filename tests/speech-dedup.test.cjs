const assert=require('node:assert/strict'),SpeechSession=require('../speech-session.js');
const commands=[{phrase:'앞으로',data:'forward'},{phrase:'뒤로',data:'backward'},{phrase:'멈춰',data:'stop'}];
function harness(){const r=new SpeechSession.ResultReducer(commands),t=new SpeechSession.CommandTracker(commands),sent=[];return {r,sent,feed(texts,start=0){const results=texts.map(text=>Object.assign([{transcript:text}],{isFinal:true}));const v=r.update(results,start);sent.push(...t.update(v.segments));return v.text;}};}
// User's exact trace: five empty finals, then prefix and expanded final.
let h=harness();h.r.speechStart();for(let i=1;i<=5;i++)h.feed(Array(i).fill(''),i-1);
assert.equal(h.feed(['','','','','','앞으로'],5),'앞으로');
assert.equal(h.feed(['','','','','','앞으로','앞으로 움직여'],6),'앞으로 움직여');assert.deepEqual(h.sent,['forward']);
assert.equal(h.feed(['','','','','','앞으로','앞으로 움직여','앞으로 움직였다가 뒤로 움직여'],7),'앞으로 움직였다가 뒤로 움직여');assert.deepEqual(h.sent,['forward','backward']);
// Final result after speechend still belongs to old utterance.
h=harness();h.r.speechStart();h.feed(['앞으로']);h.r.speechEnd();h.feed(['앞으로','앞으로 움직여'],1);assert.deepEqual(h.sent,['forward']);
// A new utterance must not be merged even if it extends the old phrase.
h.r.speechStart();h.feed(['앞으로','앞으로 움직여','앞으로 움직여 주세요'],2);assert.deepEqual(h.sent,['forward','forward']);
// Preserve intentional repetitions within and across native segments.
h=harness();h.feed(['앞으로']);h.feed(['앞으로','앞으로'],1);assert.deepEqual(h.sent,['forward','forward']);
h=harness();h.feed(['앞으로']);h.feed(['앞으로 앞으로'],0);assert.deepEqual(h.sent,['forward','forward']);
// Revisions/finalization of one native result do not re-send.
h=harness();h.feed(['앞으로']);h.feed(['앞으로 움직여']);h.feed(['앞으로 움직여']);assert.deepEqual(h.sent,['forward']);
// Do not erase a legitimate overlapping suffix command.
h=harness();h.feed(['앞으로 뒤로']);h.feed(['앞으로 뒤로','뒤로 멈춰'],1);assert.deepEqual(h.sent,['forward','backward','backward','stop']);
// Interim text removed from browser results is removed from display.
h=harness();h.feed(['앞으로','무관한 문장'],1);assert.equal(h.feed(['앞으로'],1),'앞으로');
// Public SpeechSession wiring and late callback isolation.
let recognizer,display,actual=[];class Fake{constructor(){recognizer=this}start(){this.onstart()}abort(){}stop(){}}
const tracker=new SpeechSession.CommandTracker(commands),session=new SpeechSession(Fake,{start(){},speech(){},result(text,segments){display=text;actual.push(...tracker.update(segments));},error(){},end(){}});
session.start();recognizer.onspeechstart();const event=(values,index)=>recognizer.onresult({resultIndex:index,results:values.map(text=>[{transcript:text}])});event(['앞으로'],0);event(['앞으로','앞으로 움직여'],1);assert.equal(display,'앞으로 움직여');assert.deepEqual(actual,['forward']);session.cancel();event(['앞으로','앞으로 움직여','뒤로'],2);assert.deepEqual(actual,['forward']);
console.log('PASS: supplied trace, chained extension, new commands, speech boundaries, intentional repetitions, revisions, removed interim, session cancellation');

// Korean ending revisions in cumulative Android results.
h=harness();h.r.speechStart();
const phrases=['앞으로 가','앞으로 갔다 뒤로 가','앞으로 갔다 뒤로 갔다 앞으로 가','앞으로 갔다 뒤로 갔다 앞으로 갔다 뒤로 가'];
let cumulative=[];for(const phrase of phrases){cumulative.push(phrase);assert.equal(h.feed(cumulative,cumulative.length-1),phrase);}
assert.deepEqual(h.sent,['forward','backward','forward','backward']);
// Independent alternating results must all be retained.
h=harness();
cumulative=[];for(const text of ['앞으로 가','뒤로 가','앞으로 가','뒤로 가']){cumulative.push(text);h.feed(cumulative,cumulative.length-1);}
assert.deepEqual(h.sent,['forward','backward','forward','backward']);
// Genuine repeated commands inside the cumulative phrase remain repeated.
h=harness();h.feed(['앞으로 가']);h.feed(['앞으로 가','앞으로 갔다 앞으로 가'],1);assert.deepEqual(h.sent,['forward','forward']);
// Detected utterance boundaries prevent cross-utterance merging.
h=harness();h.feed(['앞으로 가']);h.r.speechEnd();h.r.speechStart();h.feed(['앞으로 가','앞으로 갔다 뒤로 가'],1);assert.deepEqual(h.sent,['forward','forward','backward']);
console.log('PASS: alternating cumulative Korean revisions, independent alternating results, intended repetition, new utterances');

// Verify production SpeechSession passes the actual command snapshot to reducer.
actual=[];const tracker2=new SpeechSession.CommandTracker(commands),session2=new SpeechSession(Fake,{commands,start(){},result(text,segments){display=text;actual.push(...tracker2.update(segments));},error(){},end(){}});
session2.start();recognizer.onspeechstart();cumulative=[];for(const phrase of phrases){cumulative.push(phrase);event(cumulative,cumulative.length-1);}
assert.equal(display,phrases.at(-1));assert.deepEqual(actual,['forward','backward','forward','backward']);session2.cancel();
console.log('PASS: real SpeechSession command snapshot integration');
