/* Boundary X on-device voice controller: Whisper Base, Korean/English. */
const $=id=>document.getElementById(id);
const UART_SERVICE_UUID='6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHARACTERISTIC_UUID='6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const voiceCommands={forward:['전진','앞으로','직진','출발'],backward:['뒤로','후진'],stop:['멈춰','정지','그만'],left:['좌회전','왼쪽','좌측'],right:['우회전','오른쪽','우측'],ring:['사이렌','소리','경보'],name:['이름','너의 이름'],happy:['안녕','반가워'],angry:['혼날래','화났어'],dance:['춤 춰','춤춰','댄스']};
let userCommands=Object.create(null);
let worker,modelReady=false,modelLoading=false,phase='idle',epoch=0,linkEpoch=0,requestId=0,activeRequest=null;
let device=null,characteristic=null,connecting=false,stream,context,source,processor,gain,timer,chunks=[],voiced=false,lastVoice=0,startTime=0;
function textCell(text){const td=createElement('td');td.elt.textContent=text;return td;}
function validData(text){return /^[\x20-\x7e]+$/.test(text)&&text.trim().length>0;}
function stateBox(id,type,text){const el=$(id);el.classList.remove('status-connected','status-error','status-loading');if(type!=='idle')el.classList.add('status-'+type);el.textContent=text;}
function modelError(message){const detail=String(message||'브라우저에서 오류 상세를 제공하지 않았습니다.');let hint='모델 준비하기를 눌러 다시 시도해주세요.';if(/fetch|network|download|404|403|Failed to load/i.test(detail))hint='인터넷 연결 또는 모델 파일 접근 상태를 확인해주세요.';else if(/memory|allocation|out of bounds/i.test(detail))hint='다른 탭을 닫고 다시 시도해주세요.';return '모델 준비 실패: '+detail+' · '+hint;}
function status(text){$('recognitionStatus').textContent=text;}
function controls(){
 const busy=phase!=='idle';$('mic').disabled=!modelReady||(busy&&phase!=='listening');$('mic').classList.toggle('active',phase==='listening');$('mic').classList.toggle('starting',phase==='starting');
 $('mic').setAttribute('aria-label',phase==='listening'?'말하기 완료':'눌러서 말하기');$('mic-label').textContent=phase==='listening'?'말하기 완료':'눌러서 말하기';
 $('cancel-voice').disabled=!busy||phase==='sending';$('load-model').disabled=modelLoading||busy||modelReady;$('language').disabled=busy;
 $('connect').disabled=connecting; $('disconnect').disabled=!device;
}
function finish(text){phase='idle';status(text);controls();}
function setup(){
 noCanvas();createCommandTable();createUserCommandUI();$('excelInput').addEventListener('change',importCommandsFromExcel);
 $('language-select-container').innerHTML='<select id="language" class="language-select" aria-label="인식 언어"><option value="korean">한국어 · Whisper Base</option><option value="english">English · Whisper Base</option></select><button id="load-model" class="start-button">모델 준비하기</button>';
 $('bluetooth-control-buttons').innerHTML='<button id="connect" class="start-button">기기 연결</button><button id="disconnect" class="stop-button">연결 해제</button>';
 $('voice-recognition-ui').innerHTML='<button id="mic" class="mic-button" aria-label="눌러서 말하기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zM17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg></button><span id="mic-label"></span><button id="cancel-voice" class="stop-button">취소</button>';
 $('load-model').onclick=prepareVoiceModel;$('mic').onclick=()=>phase==='listening'?stopRecording():startRecording();$('cancel-voice').onclick=()=>cancel('취소했습니다. 다시 말할 수 있어요.');$('connect').onclick=connectBluetooth;$('disconnect').onclick=disconnectBluetooth;
 stateBox('modelStatus','idle','상태: 모델 준비 전');status('모델을 준비한 뒤 마이크 버튼을 누르세요.');controls();
}
function prepareVoiceModel(){
 if(modelLoading)return;worker?.terminate();const currentWorker=new Worker('./worker.js?v=whisper-1',{type:'module'});worker=currentWorker;modelLoading=true;modelReady=false;controls();stateBox('modelStatus','loading','상태: 모델 다운로드 및 준비 중…');$('modelProgressBar').style.width='0%';
 currentWorker.onerror=e=>{if(worker!==currentWorker)return;modelLoading=false;modelReady=false;phase='idle';stateBox('modelStatus','error',modelError(e.message));status('모델 상태창의 오류 내용을 확인해주세요.');controls();};
 currentWorker.onmessage=async({data:d})=>{
 if(worker!==currentWorker)return;
 if(d.type==='progress'){const p=d.progress;stateBox('modelStatus','loading','상태: 모델 준비 중'+(p.file?' · '+p.file:'')+(Number.isFinite(p.progress)?' · '+Math.round(p.progress)+'%':''));if(Number.isFinite(p.progress))$('modelProgressBar').style.width=p.progress+'%';}
 if(d.type==='ready'){modelLoading=false;modelReady=true;stateBox('modelStatus','connected','상태: Whisper Base 준비 완료');$('modelProgressBar').style.width='100%';status('한 번 누르고 준비 안내 후 말하세요.');controls();}
 if(d.type==='error'){modelLoading=false;if(phase==='processing')activeRequest=null;finish('인식 오류: '+d.message);if(!modelReady)stateBox('modelStatus','error',modelError(d.message));}
 if(d.type==='result'){
 if(phase!=='processing'||!activeRequest)return;
 const request=activeRequest;activeRequest=null;if(request.epoch!==epoch)return;
 const text=d.text.trim();$('recognitionResult').textContent='인식 결과: '+(text||'(없음)');
 const command=matchCommand(text,request.commands);
 if(!command){$('sentDataDisplay').textContent='미전송: 등록된 명령어가 없습니다';finish(text?'등록된 명령어를 포함해 다시 말해주세요.':'말소리를 인식하지 못했어요.');return;}
 if(request.link!==linkEpoch){$('sentDataDisplay').textContent='미전송: 인식 중 기기 연결이 변경되었습니다';finish('다시 말해주세요.');return;}
 phase='sending';status('명령을 전송하고 있어요…');controls();await sendBluetoothData(command);if(request.epoch===epoch)finish('인식 완료 · 다시 말할 수 있어요.');
 }
 };
 currentWorker.postMessage({type:'load',model:'base'});
}
function commandSnapshot(){return [...Object.entries(userCommands).map(([phrase,data])=>({phrase,data:data[0]})),...Object.entries(voiceCommands).flatMap(([data,phrases])=>phrases.map(phrase=>({phrase,data})))];}
function matchCommand(text,entries=commandSnapshot()){
 const normalized=text.normalize('NFC').replace(/\s+/g,'');
 return entries.find(item=>normalized.includes(item.phrase.normalize('NFC').replace(/\s+/g,'')))?.data||null;
}
async function releaseAudio(){
 clearInterval(timer);const ctx=context;stream?.getTracks().forEach(t=>t.stop());processor?.disconnect();source?.disconnect();gain?.disconnect();stream=context=processor=source=gain=null;if(ctx&&ctx.state!=='closed')await ctx.close();
}
async function cancel(message){
 epoch++;activeRequest=null;const oldPhase=phase;phase='canceling';controls();await releaseAudio();chunks=[];
 if(oldPhase==='processing'){worker?.terminate();worker=null;modelReady=false;stateBox('modelStatus','idle','분석 취소됨 · 모델을 다시 준비해주세요');}
 finish(message);
}
async function startRecording(){
 if(phase!=='idle'||!modelReady)return;phase='starting';const current=++epoch;activeRequest={epoch:current,link:linkEpoch,commands:commandSnapshot()};$('recognitionResult').textContent='인식 결과: —';$('sentDataDisplay').textContent='전송 대기 중';status('마이크 준비 중… 아직 말하지 마세요.');controls();
 try{
 if(!navigator.mediaDevices?.getUserMedia)throw Error('HTTPS 주소와 마이크 지원 여부를 확인하세요');
 const audio=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(current!==epoch){audio.getTracks().forEach(t=>t.stop());return;}stream=audio;
 const ctx=new (window.AudioContext||window.webkitAudioContext)();context=ctx;await ctx.resume();if(current!==epoch)return;
 source=ctx.createMediaStreamSource(stream);processor=ctx.createScriptProcessor(4096,1,1);gain=ctx.createGain();gain.gain.value=0;source.connect(processor);processor.connect(gain);gain.connect(ctx.destination);
 chunks=[];voiced=false;startTime=lastVoice=performance.now();phase='listening';
 processor.onaudioprocess=e=>{if(phase!=='listening')return;const data=e.inputBuffer.getChannelData(0);chunks.push(data.slice());const rms=Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);if(rms>.012){voiced=true;lastVoice=performance.now();}};
 timer=setInterval(()=>{if(performance.now()-startTime>=30000)cancel('30초가 지나 입력을 취소했습니다. 다시 눌러 시작하고, 말한 뒤 한 번 더 눌러 완료해주세요.');},100);status('지금 말하세요! · 말을 마치면 마이크 버튼을 다시 눌러주세요.');controls();
 }catch(e){if(current!==epoch)return;await releaseAudio();activeRequest=null;finish('마이크를 열 수 없습니다: '+e.message);}
}
async function stopRecording(){
 if(phase!=='listening')return;phase='processing';controls();status('음성을 분석하고 있어요…');const current=epoch,rate=context.sampleRate,hasVoice=voiced;
 const merged=new Float32Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length;}
 await releaseAudio();if(current!==epoch)return;
 if(!hasVoice||merged.length<rate*.25){activeRequest=null;finish('말소리를 감지하지 못했어요. 다시 시도하세요.');return;}
 try{const offline=new OfflineAudioContext(1,Math.ceil(merged.length*16000/rate),16000);const buffer=offline.createBuffer(1,merged.length,rate);buffer.copyToChannel(merged,0);const s=offline.createBufferSource();s.buffer=buffer;s.connect(offline.destination);s.start();const audio=(await offline.startRendering()).getChannelData(0).slice();if(current!==epoch)return;worker.postMessage({type:'transcribe',audio,language:$('language').value},[audio.buffer]);}catch(e){if(current===epoch){activeRequest=null;finish('오디오 처리 오류: '+e.message);}}
}
async function connectBluetooth(){
 if(connecting)return;connecting=true;controls();stateBox('bluetoothStatus','loading','상태: 연결할 기기를 선택해주세요…');
 try{
 if(!navigator.bluetooth)throw Error('이 브라우저는 블루투스 연결을 지원하지 않습니다. 아이폰에서는 Bluefy를 사용하세요.');
 if(device?.gatt.connected)device.gatt.disconnect();characteristic=null;linkEpoch++;
 const selected=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'BBC micro:bit'}],optionalServices:[UART_SERVICE_UUID]});device=selected;
 selected.addEventListener('gattserverdisconnected',()=>{if(device===selected){characteristic=null;linkEpoch++;stateBox('bluetoothStatus','idle','상태: 연결 해제됨');}});
 const server=await selected.gatt.connect();stateBox('bluetoothStatus','loading','상태: 기기 연결됨 · UART 준비 중…');const service=await server.getPrimaryService(UART_SERVICE_UUID);const found=await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);if(!selected.gatt.connected)throw Error('UART 준비 중 연결이 끊어졌습니다');characteristic=found;linkEpoch++;stateBox('bluetoothStatus','connected','상태: '+selected.name+' 연결됨');
 }catch(e){characteristic=null;stateBox('bluetoothStatus','error',(device?.gatt.connected?'기기 연결 유지 · UART 준비 실패: ':'연결 실패: ')+e.message);}finally{connecting=false;controls();}
}
function disconnectBluetooth(){linkEpoch++;characteristic=null;device?.gatt.disconnect();device=null;$('bluetoothStatus').textContent='상태: 연결 해제됨';controls();}
async function sendBluetoothData(data){
 const c=characteristic;if(!c||!device?.gatt.connected){$('sentDataDisplay').textContent='미전송: 기기를 연결해주세요';return false;}
 $('sentDataDisplay').textContent='전송 중: '+data;
 try{const bytes=new TextEncoder().encode(data+'\n');if(c.properties?.write&&c.writeValueWithResponse)await c.writeValueWithResponse(bytes);else if(c.properties?.writeWithoutResponse&&c.writeValueWithoutResponse)await c.writeValueWithoutResponse(bytes);else await c.writeValue(bytes);$('sentDataDisplay').textContent='전송 완료: '+data;return true;}catch(e){$('sentDataDisplay').textContent='전송 실패: '+data+' · '+e.message;return false;}
}
window.addEventListener('pagehide',()=>{epoch++;activeRequest=null;phase='idle';releaseAudio();worker?.terminate();worker=null;modelReady=modelLoading=false;disconnectBluetooth();});
window.addEventListener('pageshow',e=>{if(e.persisted){stateBox('modelStatus','idle','모델을 다시 준비해주세요');controls();}});

