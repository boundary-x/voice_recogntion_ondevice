/* One browser-recognition session; late results are ignored after cancellation. */
class SpeechSession {
  constructor(Recognition, handlers) { this.Recognition=Recognition; this.handlers=handlers; this.serial=0; }
  start(language='ko-KR') {
    this.cancel();
    if(!this.Recognition) throw Error('이 브라우저에서 음성 인식을 사용할 수 없습니다. Whisper를 선택해주세요.');
    const serial=this.serial, r=new this.Recognition(), reducer=new SpeechResultReducer(this.handlers.commands||[]); this.recognition=r;
    const current=()=>this.serial===serial && this.recognition===r;
    r.lang=language;r.interimResults=true;r.continuous=true;
    r.onstart=()=>{if(current())this.handlers.start();};
    r.onspeechstart=()=>{if(current()){reducer.speechStart();this.handlers.speech?.(true);}};
    r.onspeechend=()=>{if(current()){reducer.speechEnd();this.handlers.speech?.(false);}};
    r.onaudioend=()=>{if(current())this.handlers.speech?.(false);};
    r.onresult=e=>{if(!current())return;const result=reducer.update(e.results,e.resultIndex);this.handlers.result(result.text,result.segments);};
    r.onerror=e=>{if(!current())return;this.cancel();this.handlers.error(e.error);};
    r.onend=()=>{if(!current())return;this.recognition=null;this.handlers.end();};
    try{r.start();}catch(e){this.cancel();throw e;}
  }
  stop(){this.recognition?.stop();}
  cancel(){const r=this.recognition;this.serial++;this.recognition=null;try{r?.abort();}catch{}}
}
// Merge cumulative results within an utterance. Compare command phrases as well
// as literal prefixes because Korean endings can change (가 → 갔다).
// Identical snapshots in the same utterance are duplicates too: Android may
// append the same final transcript under a new native index repeatedly.
// A speechend → speechstart boundary allows the same command again.
class SpeechResultReducer {
  constructor(commands=[]){this.native=new Map();this.next=0;this.utterance=0;this.ended=false;this.matcher=new SpokenCommandTracker(commands);}
  extendsCommands(before,after){
    const oldMatches=this.matcher.matches(before),newMatches=this.matcher.matches(after);
    // Require additional command occurrences, not just the same command again.
    // Phrase identity (not output value) preserves custom-command distinctions.
    return oldMatches.length>0&&newMatches.length>oldMatches.length&&
      oldMatches.every((m,i)=>m.phrase===newMatches[i].phrase&&m.data===newMatches[i].data)&&
      SpokenCommandTracker.normalize(before).slice(0,oldMatches[0].end)===
      SpokenCommandTracker.normalize(after).slice(0,newMatches[0].end);
  }
  speechStart(){if(this.ended){this.utterance++;this.ended=false;}}
  speechEnd(){this.ended=true;}
  update(results,resultIndex){
    for(const index of this.native.keys())if(index>=results.length)this.native.delete(index);
    const changed=new Set();
    for(let i=0;i<results.length;i++){
      if(i<resultIndex&&this.native.has(i))continue;
      const text=results[i][0].transcript.trim(),existing=this.native.get(i);
      if(existing){existing.text=text;changed.add(existing.group);continue;}
      if(!text)continue;
      const previous=[...this.native.values()].filter(v=>v.index<i&&v.text).sort((a,b)=>b.index-a.index)[0];
      const normalized=SpokenCommandTracker.normalize(text),prior=previous?SpokenCommandTracker.normalize(previous.text):'';
      // An expanded result may revise its ending (움직여 → 움직였다가).
      // Retain earlier prefixes of the same logical group for that case.
      const prefixes=previous?[...this.native.values()].filter(v=>v.group===previous.group&&v.text).map(v=>SpokenCommandTracker.normalize(v.text)):[];
      const extension=previous&&previous.utterance===this.utterance&&
        ((normalized.length>=prior.length&&prefixes.some(prefix=>normalized.startsWith(prefix)))||this.extendsCommands(previous.text,text));
      const group=extension?previous.group:this.next++;
      this.native.set(i,{index:i,group,utterance:this.utterance,text});changed.add(group);
    }
    const groups=new Map();
    for(const entry of [...this.native.values()].sort((a,b)=>a.index-b.index))groups.set(entry.group,entry.text);
    return {text:[...groups.values()].filter(Boolean).join(' '),segments:[...groups].filter(([index])=>changed.has(index)).map(([index,text])=>({index,text}))};
  }
}
// Browser results are cumulative within each result index. Consume command
// occurrences, not distinct output values, so a later repeated command can run.
class SpokenCommandTracker {
  constructor(entries){this.entries=entries.map((entry,priority)=>({...entry,priority,phrase:SpokenCommandTracker.normalize(entry.phrase)})).filter(e=>e.phrase);this.consumed=new Map();}
  static normalize(text){return text.normalize('NFC').replace(/\s+/g,'');}
  matches(text){
    const value=SpokenCommandTracker.normalize(text),accepted=[];
    // Custom entries come first, resolving overlapping phrases before sorting
    // distinct matches into spoken order. This preserves user-command priority.
    for(const entry of this.entries){let start=0;while((start=value.indexOf(entry.phrase,start))!==-1){const end=start+entry.phrase.length;if(!accepted.some(m=>start<m.end&&end>m.start))accepted.push({start,end,data:entry.data,phrase:entry.phrase});start=end;}}
    return accepted.sort((a,b)=>a.start-b.start);
  }
  commands(text){return this.matches(text).map(m=>m.data);}
  update(segments){
    const fresh=[];
    for(const segment of [...segments].sort((a,b)=>a.index-b.index)){
      const matches=this.commands(segment.text),count=this.consumed.get(segment.index)||0;
      fresh.push(...matches.slice(count));
      // Interim text can shrink or change. Already issued occurrences must not
      // be replayed when the browser revises/finalizes the same result.
      this.consumed.set(segment.index,Math.max(count,matches.length));
    }
    return fresh;
  }
}
SpeechSession.CommandTracker=SpokenCommandTracker;
SpeechSession.ResultReducer=SpeechResultReducer;
if(typeof module!=='undefined')module.exports=SpeechSession;
