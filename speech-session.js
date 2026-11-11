/* One browser-recognition session; late results are ignored after cancellation. */
class SpeechSession {
  constructor(Recognition, handlers) { this.Recognition=Recognition; this.handlers=handlers; this.serial=0; }
  start(language='ko-KR') {
    this.cancel();
    if(!this.Recognition) throw Error('이 브라우저에서 음성 인식을 사용할 수 없습니다. Whisper를 선택해주세요.');
    const serial=this.serial, r=new this.Recognition(); this.recognition=r;
    const current=()=>this.serial===serial && this.recognition===r;
    r.lang=language;r.interimResults=true;r.continuous=true;
    r.onstart=()=>{if(current())this.handlers.start();};
    r.onspeechstart=()=>{if(current())this.handlers.speech?.(true);};
    r.onspeechend=()=>{if(current())this.handlers.speech?.(false);};
    r.onaudioend=()=>{if(current())this.handlers.speech?.(false);};
    r.onresult=e=>{if(!current())return;const segments=[];let text='';for(let i=0;i<e.results.length;i++){const transcript=e.results[i][0].transcript;text+=transcript+' ';if(i>=e.resultIndex)segments.push({index:i,text:transcript});}this.handlers.result(text.trim(),segments);};
    r.onerror=e=>{if(!current())return;this.cancel();this.handlers.error(e.error);};
    r.onend=()=>{if(!current())return;this.recognition=null;this.handlers.end();};
    try{r.start();}catch(e){this.cancel();throw e;}
  }
  stop(){this.recognition?.stop();}
  cancel(){const r=this.recognition;this.serial++;this.recognition=null;try{r?.abort();}catch{}}
}
// Browser results are cumulative within each result index. Consume command
// occurrences, not distinct output values, so a later repeated command can run.
class SpokenCommandTracker {
  constructor(entries){this.entries=entries.map((entry,priority)=>({...entry,priority,phrase:SpokenCommandTracker.normalize(entry.phrase)})).filter(e=>e.phrase);this.consumed=new Map();}
  static normalize(text){return text.normalize('NFC').replace(/\s+/g,'');}
  commands(text){
    const value=SpokenCommandTracker.normalize(text),accepted=[];
    // Custom entries come first, resolving overlapping phrases before sorting
    // distinct matches into spoken order. This preserves user-command priority.
    for(const entry of this.entries){let start=0;while((start=value.indexOf(entry.phrase,start))!==-1){const end=start+entry.phrase.length;if(!accepted.some(m=>start<m.end&&end>m.start))accepted.push({start,end,data:entry.data});start=end;}}
    return accepted.sort((a,b)=>a.start-b.start).map(m=>m.data);
  }
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
if(typeof module!=='undefined')module.exports=SpeechSession;
