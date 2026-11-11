// Basic command snapshot from the production app; no Bluetooth connection or writes.
const diagnosticCommands=[{"phrase":"전진","data":"forward"},{"phrase":"앞으로","data":"forward"},{"phrase":"직진","data":"forward"},{"phrase":"출발","data":"forward"},{"phrase":"뒤로","data":"backward"},{"phrase":"후진","data":"backward"},{"phrase":"멈춰","data":"stop"},{"phrase":"정지","data":"stop"},{"phrase":"그만","data":"stop"},{"phrase":"좌회전","data":"left"},{"phrase":"왼쪽","data":"left"},{"phrase":"좌측","data":"left"},{"phrase":"우회전","data":"right"},{"phrase":"오른쪽","data":"right"},{"phrase":"우측","data":"right"},{"phrase":"사이렌","data":"ring"},{"phrase":"소리","data":"ring"},{"phrase":"경보","data":"ring"},{"phrase":"이름","data":"name"},{"phrase":"너의 이름","data":"name"},{"phrase":"안녕","data":"happy"},{"phrase":"반가워","data":"happy"},{"phrase":"혼날래","data":"angry"},{"phrase":"화났어","data":"angry"},{"phrase":"춤 춰","data":"dance"},{"phrase":"춤춰","data":"dance"},{"phrase":"댄스","data":"dance"}];
function initSegmentSession(s){
 s.started=performance.now();s.event=0;s.sent=0;s.previousCommand=null;
 s.tracker=new SpeechSession.CommandTracker(diagnosticCommands);
 $('send-count').textContent='0회 (현재 테스트)';
}
function appendCells(id,values,highlight=false){
 const row=document.createElement('tr');if(highlight)row.className='duplicate';
 for(const value of values){const td=document.createElement('td');td.textContent=value;row.append(td);}
 $(id).append(row);while($(id).children.length>160)$(id).firstElementChild.remove();
}
function recordSegments(s,e){
 const elapsed=((performance.now()-s.started)/1000).toFixed(2)+'초',event=++s.event;
 const snapshot=[];
 for(let i=0;i<e.results.length;i++){
  const text=e.results[i][0].transcript,isFinal=e.results[i].isFinal,changed=i>=e.resultIndex;
  snapshot.push({index:i,isFinal,changed,text});
  appendCells('segments',[s.id+' / '+event,elapsed,i,isFinal?'확정':'중간',changed?'변경':'유지',text]);
  if(!changed)continue;
  // Same production tracker, in ascending result-index order. isFinal is logged,
  // but does not gate sending: production sends interim commands immediately.
  const sends=s.tracker.update([{index:i,text}]);
  for(const command of sends){
   const repeated=s.previousCommand===command;s.previousCommand=command;s.sent++;
   appendCells('transmissions',[s.id+' / '+event,elapsed,i,isFinal?'확정':'중간',command,repeated?'같은 명령 연속':'새 명령'],repeated);
   log('SIMULATED_SEND',JSON.stringify({test:s.id,event,elapsed,index:i,isFinal,command,repeated}));
  }
 }
 log('RESULT_SEGMENTS',JSON.stringify({test:s.id,event,elapsed,resultIndex:e.resultIndex,segments:snapshot}));
 $('send-count').textContent=s.sent+'회 (현재 테스트)';
}
