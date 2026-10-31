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
    r.onresult=e=>{if(!current())return;let text='';for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;this.handlers.result(text.trim());};
    r.onerror=e=>{if(!current())return;this.cancel();this.handlers.error(e.error);};
    r.onend=()=>{if(!current())return;this.recognition=null;this.handlers.end();};
    try{r.start();}catch(e){this.cancel();throw e;}
  }
  stop(){this.recognition?.stop();}
  cancel(){const r=this.recognition;this.serial++;this.recognition=null;try{r?.abort();}catch{}}
}
if(typeof module!=='undefined')module.exports=SpeechSession;

