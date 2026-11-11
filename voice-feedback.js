/* Web Speech uses recognition events only; Whisper uses its existing recording audio. */
let sendFlashTimer=null;
function initVoiceFeedback(){
 const card=$('voice-recognition-group');
 const badge=document.createElement('span');badge.id='voice-mode-badge';card.querySelector('h3').append(badge);
 const flow=document.createElement('div');flow.id='voice-flow';$('voice-instructions').replaceWith(flow);
 // Keep the existing ID for mode descriptions and the guided tour.
 const instructions=document.createElement('p');instructions.id='voice-instructions';instructions.className='sr-only';flow.after(instructions);
 const statusEl=$('recognitionStatus');statusEl.setAttribute('role','status');$('voice-recognition-ui').before(statusEl);
 $('status-container').removeAttribute('aria-live');
 const mic=$('mic'),stage=document.createElement('div');stage.className='mic-stage';mic.before(stage);
 const ring=document.createElement('span');ring.className='voice-ring';ring.setAttribute('aria-hidden','true');stage.append(ring,mic);
 const spinner=document.createElement('span');spinner.className='voice-spinner';spinner.setAttribute('aria-hidden','true');mic.append(spinner);
 $('sentDataDisplay').setAttribute('role','status');showTransmission('idle','—');
}
function renderVoiceFeedback(){
 if(!$('voice-flow'))return;
 const browser=voiceMode==='webspeech',connected=!!characteristic&&!!device?.gatt.connected;
 $('voice-mode-badge').textContent=browser?'Web Speech':'Whisper';
 const steps=browser?['누른 채 말하기',connected?'바로 전송':'데이터 확인']:['누른 채 말하기','손 떼기',connected?'분석 · 전송':'분석 · 데이터 확인'];
 $('voice-flow').replaceChildren(...steps.map((text,i)=>{const el=document.createElement('span');el.className='voice-step';const n=document.createElement('b');n.textContent=i+1;el.append(n,document.createTextNode(text));return el;}));
 const card=$('voice-recognition-group');card.dataset.phase=phase;
 $('mic').setAttribute('aria-busy',String(phase==='processing'));
 const label=phase==='starting'?'입력 준비 중':phase==='listening'?'말을 마치면 손을 떼세요':phase==='processing'?'잠시만 기다려주세요':phase==='sending'?'데이터 전송 중':!voiceReady()?'먼저 모델을 준비해주세요':'버튼을 누른 채 말하세요';
 $('mic-label').textContent=phase==='idle'&&voiceReady()?'말을 마치면 손을 떼세요':label;$('mic').setAttribute('aria-label',label);
 if(phase!=='listening')setVoiceLevel(0);
 if(phase==='starting')status('버튼을 누른 채, 신호음이 들리면 말하세요.');
 if(phase==='listening')status('지금 말하세요.');
 if(phase==='processing')status(browser?'마지막 인식 결과를 확인하고 있어요.':'음성을 분석하고 있어요.');
}
function setVoiceLevel(rms){
 const ring=document.querySelector('.voice-ring');if(!ring)return;
 ring.style.setProperty('--voice-scale',String(1+Math.min(.28,Math.max(0,rms)*4)));
}
function resetVoiceFeedback(){setVoiceLevel(0);}
function setSpeechActivity(active){
 // No extra audio capture: some Android devices cannot share the STT microphone.
 if(voiceMode!=='webspeech'||phase!=='listening')return;
 setVoiceLevel(active?.07:0);
}
function showTransmission(state,data,detail=''){
 const box=$('sentDataDisplay');clearTimeout(sendFlashTimer);box.classList.remove('send-flash');box.dataset.state=state;
 const label=document.createElement('span');label.className='transmission-label';label.textContent=({idle:'전송 대기 중',preview:'전송할 데이터',sending:'전송 중',sent:'✓ 전송됨',error:'전송 실패'})[state];
 const value=document.createElement('strong');value.className='transmission-value';value.textContent=data;
 box.replaceChildren(label,value);if(detail){const note=document.createElement('small');note.textContent=detail;box.append(note);}
 if(state==='sent'){box.classList.add('send-flash');sendFlashTimer=setTimeout(()=>box.classList.remove('send-flash'),800);}
}
