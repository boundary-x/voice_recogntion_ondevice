const $=id=>document.getElementById(id);
let worker, ready=false, busy=false, recording=false, stream, context, source, processor, silenceGain, timer, chunks=[], started=0,lastVoice=0,voiced=false, generation=0,loadStart=0, pending, device, activeModel, writeCharacteristic=null;
const records=[];
const environment={userAgent:navigator.userAgent,secureContext:isSecureContext,microphone:!!navigator.mediaDevices?.getUserMedia,webAssembly:typeof WebAssembly!=='undefined',webGPU:!!navigator.gpu,bluetooth:!!navigator.bluetooth,crossOriginIsolated,engine:'Transformers.js 3.8.1 / Whisper q8 / WASM 1 thread'};
$('diagnostics').textContent=JSON.stringify(environment,null,2);
const setStatus=text=>$('status').textContent=text;
function controls(){ $('model').disabled=busy||ready; $('load').disabled=busy||ready; $('mic').disabled=!ready||(busy&&!recording); $('file').disabled=!ready||busy; $('language').disabled=busy; $('mic').textContent=recording?'말하기 완료':'눌러서 말하기'; }
function fail(message){busy=false;controls();setStatus(message);}
function initWorker(){
 worker=new Worker('./worker.js',{type:'module'});
 worker.onerror=e=>{ready=false;fail('실행 오류: '+e.message);};
 worker.onmessage=async ({data:d})=>{
  if(d.type==='progress'){const p=d.progress;$('download').textContent=`${p.file||'모델'} · ${p.status}${Number.isFinite(p.progress)?' '+Math.round(p.progress)+'%':''}`;if(Number.isFinite(p.progress)){$('progress').hidden=false;$('progress').value=p.progress;}}
  if(d.type==='ready'){ready=true;busy=false;controls();environment.modelLoadMs=Math.round(performance.now()-loadStart);$('diagnostics').textContent=JSON.stringify(environment,null,2);$('download').textContent=`모델 준비 완료 · ${(environment.modelLoadMs/1000).toFixed(1)}초`;$('progress').hidden=true;setStatus('버튼을 누르면 마이크를 준비합니다');}
  if(d.type==='error'){if(!ready)$('download').textContent='다운로드 또는 실행 실패';fail('인식 오류: '+d.message);}
  if(d.type==='result'){
   const text=d.text.trim();const command=match(text);$('heard').textContent='들은 말: '+(text||'(없음)');$('command').textContent=`명령 후보: ${command||'일치 없음'}`;
   $('timing').textContent=`음성 ${pending.seconds.toFixed(1)}초 / 분석 ${(d.ms/1000).toFixed(2)}초 / 종료부터 결과까지 ${((performance.now()-pending.end)/1000).toFixed(2)}초`;
   setStatus(text?'인식 완료 · 다시 말할 수 있어요':'인식된 말이 없습니다');
   const transmission=command?await transmit(command):'미전송: 일치하는 명령 없음';
   if(!command)$('transmission').textContent=transmission;
   busy=false;controls();
   const row={...pending,transmission,model:activeModel,language:$('language').value,text,command,inferenceMs:Math.round(d.ms),resultLatencyMs:Math.round(performance.now()-pending.end),bluetoothConnected:!!device?.gatt.connected,time:new Date().toISOString()};records.push(row);
   const tr=document.createElement('tr');[row.model,row.kind,text,(d.ms/1000).toFixed(2)+'초',row.transmission].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});$('rows').prepend(tr);
  }
 };
}
function match(text){const norm=s=>s.replace(/[\s.,!?。！？]/g,'');const mapping={forward:['전진','앞으로','직진','출발'],backward:['뒤로','후진'],stop:['멈춰','정지','그만'],left:['좌회전','왼쪽','좌측'],right:['우회전','오른쪽','우측'],ring:['사이렌','소리','경보'],name:['이름','너의 이름'],happy:['안녕','반가워'],angry:['혼날래','화났어'],dance:['춤 춰','춤춰','댄스']};return Object.entries(mapping).find(([,v])=>v.some(p=>norm(p)===norm(text)))?.[0]||null;}
$('load').onclick=()=>{busy=true;controls();setStatus('모델 준비 중… 처음에는 시간이 걸릴 수 있습니다');loadStart=performance.now();if(worker)worker.terminate();initWorker();activeModel=$('model').value;environment.model=activeModel;worker.postMessage({type:'load',model:activeModel});};
async function cleanup(){clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());processor?.disconnect();source?.disconnect();silenceGain?.disconnect();if(context&&context.state!=='closed')await context.close();stream=context=processor=source=silenceGain=null;$('level').value=0;}
$('reset').onclick=async()=>{generation++;recording=false;busy=false;ready=false;worker?.terminate();worker=null;await cleanup();chunks=[];controls();setStatus('초기화 완료 · 모델을 다시 준비하세요');$('progress').hidden=true;$('download').textContent='';};
async function resample(samples,rate){if(rate===16000)return samples;const offline=new OfflineAudioContext(1,Math.ceil(samples.length*16000/rate),16000);const b=offline.createBuffer(1,samples.length,rate);b.copyToChannel(samples,0);const s=offline.createBufferSource();s.buffer=b;s.connect(offline.destination);s.start();return (await offline.startRendering()).getChannelData(0).slice();}
async function analyze(samples,rate,kind,end=performance.now()){
 busy=true;controls();setStatus('음성을 분석하고 있어요…');
 const current=generation;try{const audio=await resample(samples,rate);if(current!==generation)return;pending={kind,seconds:audio.length/16000,end};worker.postMessage({type:'transcribe',audio,language:$('language').value},[audio.buffer]);}catch(e){if(current===generation)fail('오디오 처리 실패: '+e.message);}
}
async function stop(){if(!recording)return;const end=performance.now(),current=generation;recording=false;const rate=context.sampleRate;const all=new Float32Array(chunks.reduce((n,c)=>n+c.length,0));let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}const hasVoice=voiced;await cleanup();if(current!==generation)return;if(!hasVoice||all.length<rate*.25){fail('말소리를 감지하지 못했어요. 다시 시도하세요');return;}await analyze(all,rate,'마이크',end);}
$('mic').onclick=async()=>{
 if(recording){await stop();return;}if(busy||!ready)return;busy=true;controls();setStatus('마이크 준비 중… 아직 말하지 마세요');const current=generation;
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('HTTPS 주소와 마이크 지원 여부를 확인하세요');
  const incoming=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(current!==generation){incoming.getTracks().forEach(t=>t.stop());return;}stream=incoming;
  context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();if(current!==generation)return;
  source=context.createMediaStreamSource(stream);processor=context.createScriptProcessor(4096,1,1);silenceGain=context.createGain();silenceGain.gain.value=0;source.connect(processor);processor.connect(silenceGain);silenceGain.connect(context.destination);
  chunks=[];voiced=false;started=performance.now();lastVoice=started;recording=true;
  processor.onaudioprocess=e=>{if(!recording)return;const input=e.inputBuffer.getChannelData(0);chunks.push(input.slice());const rms=Math.sqrt(input.reduce((sum,v)=>sum+v*v,0)/input.length);$('level').value=rms;if(rms>.012){voiced=true;lastVoice=performance.now();}};
  timer=setInterval(()=>{if(performance.now()-started>8000||(voiced&&performance.now()-lastVoice>1100))stop();},100);controls();setStatus('지금 말하세요 · 예: 앞으로');
 }catch(e){await cleanup();if(current===generation)fail('마이크를 열 수 없습니다: '+e.name+' · '+e.message);}
};
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;const current=generation;busy=true;controls();setStatus('파일 읽는 중…');let decoder;try{decoder=new (window.AudioContext||window.webkitAudioContext)();const b=await decoder.decodeAudioData(await file.arrayBuffer());if(current!==generation)return;const length=Math.min(b.length,b.sampleRate*8),samples=new Float32Array(length);for(let c=0;c<b.numberOfChannels;c++){const data=b.getChannelData(c);for(let i=0;i<length;i++)samples[i]+=data[i]/b.numberOfChannels;}await analyze(samples,b.sampleRate,'파일');}catch(err){if(current===generation)fail('파일을 읽을 수 없습니다: '+err.message);}finally{await decoder?.close();e.target.value='';}};
async function transmit(command){
 const characteristic=writeCharacteristic;
 if(!characteristic||!device?.gatt.connected){const message='미전송: 기기를 연결해주세요';$('transmission').textContent=message;return message;}
 $('transmission').textContent=command+' 전송 중…';
 try{
  const bytes=new TextEncoder().encode(command+'\n');
  if(characteristic.properties.write&&characteristic.writeValueWithResponse)await characteristic.writeValueWithResponse(bytes);
  else if(characteristic.properties.writeWithoutResponse&&characteristic.writeValueWithoutResponse)await characteristic.writeValueWithoutResponse(bytes);
  else await characteristic.writeValue(bytes);
  const message=command+' 전송 완료';$('transmission').textContent=message;return message;
 }catch(e){const message=command+' 전송 실패: '+e.message;$('transmission').textContent=message;return message;}
}
$('ble').onclick=async()=>{ $('ble').disabled=true;try{
 if(!navigator.bluetooth)throw new Error('이 브라우저에는 Web Bluetooth가 없습니다');
 if(device?.gatt.connected)device.gatt.disconnect();writeCharacteristic=null;
 const selected=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'BBC micro:bit'}],optionalServices:['6e400001-b5a3-f393-e0a9-e50e24dcca9e']});device=selected;
 selected.addEventListener('gattserverdisconnected',()=>{if(device===selected){writeCharacteristic=null;$('bleStatus').textContent='연결 해제됨';}});
 const server=await selected.gatt.connect();const service=await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
 const characteristics=await service.getCharacteristics();
 writeCharacteristic=characteristics.find(c=>['6e400003-b5a3-f393-e0a9-e50e24dcca9e','6e400002-b5a3-f393-e0a9-e50e24dcca9e'].includes(c.uuid)&&(c.properties.write||c.properties.writeWithoutResponse));
 if(!writeCharacteristic)throw new Error('쓰기 가능한 UART 특성이 없습니다. 마이크로비트 예제 코드를 확인하세요');
 $('bleStatus').textContent=selected.name+' 연결됨 · 명령 자동 전송 준비 완료';
 }catch(e){writeCharacteristic=null;device?.gatt.disconnect();$('bleStatus').textContent='연결 실패: '+e.message;}finally{$('ble').disabled=false;}};
$('disconnect').onclick=()=>{writeCharacteristic=null;device?.gatt.disconnect();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({environment,records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='voice-check.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('pagehide',()=>{generation++;recording=false;cleanup();worker?.terminate();device?.gatt.disconnect();});
