/* Read-only voice walkthrough. */
(()=>{ 'use strict'; const $=id=>document.getElementById(id); const support=$('support-card');support.innerHTML="<summary><span><strong>사용 가이드 및 지원</strong><small>사용법 · 예제 코드 · 문제 해결</small></span><span class=\"support-chevron\" aria-hidden=\"true\">⌄</span></summary><div class=\"support-content\"><p class=\"support-intro\">음성을 명령으로 바꾸고 마이크로비트 프로젝트에 활용해보세요.</p><div class=\"support-actions\"><button type=\"button\" data-tour=\"all\" class=\"support-primary\">사용법 둘러보기 <span aria-hidden=\"true\">→</span></button></div><details class=\"support-section\" id=\"help-examples\"><summary>마이크로비트 예제 코드</summary><div class=\"support-answer example-codes\"><div class=\"example-code\"><a  href=\"https://makecode.microbit.org/S49771-77509-50114-72682\" target=\"_blank\" rel=\"noopener noreferrer\">블루투스 이름 확인 코드 ↗</a><p>연결할 마이크로비트의 장치 이름을 확인합니다. LED 매트릭스에 출력되는 이름(알파벳 소문자 5자리)을 확인한 뒤 아래 프로젝트 코드를 다운로드하세요.</p></div><div class=\"example-code\"><a id=\"project-example-link\" href=\"https://makecode.microbit.org/_TbRVyuL5sRRL\" target=\"_blank\" rel=\"noopener noreferrer\">마이크로비트 기본 예제 ↗</a><p>인식된 명령 데이터를 받아 원하는 동작을 실행하는 예제입니다.</p></div><div class=\"example-code\"><a  href=\"https://makecode.microbit.org/#pub:26167-61925-19454-72916\" target=\"_blank\" rel=\"noopener noreferrer\">마이크로비트 + 서보모터 예제 ↗</a><p>음성 명령을 서보모터 동작에 활용합니다.</p></div><div class=\"example-code\"><a  href=\"https://makecode.microbit.org/#pub:19507-15465-36439-58986\" target=\"_blank\" rel=\"noopener noreferrer\">AI 포니봇 · 음성인식 서빙로봇 ↗</a><p>포니봇 프로젝트에 음성 명령을 활용합니다.</p></div><div class=\"example-code\"><a  href=\"https://makecode.microbit.org/#pub:95404-70976-20260-60096\" target=\"_blank\" rel=\"noopener noreferrer\">비트런 · AI 반려로봇 ↗</a><p>비트런의 동작과 음성 명령을 연결합니다.</p></div><p>이름 확인 후 사용할 프로젝트 예제를 다운로드하세요. 다운로드하면 기존 마이크로비트 코드가 교체됩니다.</p></div></details><details class=\"support-section\" id=\"help-troubleshooting\"><summary>문제 해결 <span class=\"support-meta\">증상별 안내</span></summary><div class=\"support-answer support-faq\"><details ><summary>모델 다운로드가 안 되거나 느려요</summary><p>인터넷 연결과 모델 상태창의 오류 문구를 확인하세요. 준비 중은 노란색, 완료는 초록색, 실패는 빨간색입니다. 모델 준비하기로 재시도하세요. 첫 다운로드가 필요하고 캐시가 삭제되면 다시 다운로드할 수 있습니다. 다른 탭을 닫으면 메모리 확보에 도움이 될 수 있습니다.</p></details><details ><summary>마이크를 눌렀는데 인식되지 않아요</summary><p>마이크 권한을 허용하고 모델 준비를 마치세요. 버튼을 계속 누른 채 준비 안내와 짧은 신호음을 기다린 뒤 말하세요. 손을 떼면 분석합니다. 준비 전에 떼면 입력이 취소됩니다. 30초가 지나도 손을 떼지 않으면 전송 없이 취소됩니다.</p></details><details ><summary>인식 결과가 나오는 데 시간이 걸려요</summary><p>Whisper Base는 손을 뗀 뒤 이 기기에서 음성을 분석합니다. 듣는 중에는 데이터를 보내지 않습니다. 분석 중에는 기다려주세요. 기기 성능과 음성 길이에 따라 시간이 달라집니다.</p></details><details id=\"help-connection\"><summary>연결이 안 되거나 바로 끊겨요</summary><p>아이폰에서는 Bluefy를 사용하세요. 마이크로비트 전원, UART 예제 다운로드, 다른 앱과의 연결 여부를 확인하세요. 소개 페이지의 예제 설정에 맞게 페어링 옵션을 확인하세요. UART 준비 실패가 표시되면 해당 오류 내용을 확인하세요. 연결 중 노란색, 완료 초록색, 오류 빨간색, 해제 회색으로 표시됩니다.</p></details><details ><summary>말은 맞게 인식했는데 기기가 움직이지 않아요</summary><p>연결 상태와 전송 상태를 따로 확인하세요. “전송 완료”는 브라우저의 블루투스 쓰기 완료이며 로봇 실행 확인은 아닙니다. 예제 코드의 조건문과 전송 데이터의 철자·대소문자가 같은지 확인하세요. 인식 도중 연결이 바뀌면 다시 말해야 합니다.</p></details><details ><summary>여러 명령이나 긴 문장은 어떻게 처리하나요?</summary><p>“앞으로 움직여”에 “앞으로”가 포함되면 forward를 보냅니다. 사용자 명령을 먼저 찾고, 이후 표 순서상 첫 일치 데이터 하나만 보냅니다. 부정 표현의 의미는 해석하지 않으므로 한 번에 명령 하나를 말해주세요.</p></details><details ><summary>엑셀·사용자 명령은 어떻게 저장하나요?</summary><p>사용자 명령은 페이지를 떠나기 전 엑셀 내보내기로 저장하세요. 불러올 파일은 Command / Data 열을 사용하며, 잘못된 행은 제외됩니다. 데이터는 줄바꿈 없는 영문·숫자·기호로 입력하세요. 기본 명령은 내보내기에 포함되지 않습니다.</p></details><details ><summary>취소하면 로봇도 정지하나요?</summary><p>취소는 음성 입력만 취소하고 stop을 보내지 않습니다. “멈춰”가 인식되면 stop과 줄바꿈을 전송합니다. 연결이 끊기면 데이터를 보낼 수 없습니다.</p></details></div></details><details class=\"support-section\" id=\"help-materials\"><summary>수업 자료</summary><div class=\"support-answer\"><p><a href=\"https://1drv.ms/p/c/fae158da74b76feb/IQBkwH_vf9odTKuCqmsoo8_9AW5sgwab1gp-MPeeBjy52Ok?e=DAP4MX\" target=\"_blank\" rel=\"noopener noreferrer\">포니봇 · 음성으로 명령하는 AI 서빙 로봇 ↗</a></p><p><a href=\"https://1drv.ms/p/c/fae158da74b76feb/IQBcdFHe7_1lRLCQSavye2IXAf9wAkMqifVyxhhRxPp0GaM?e=K1sVTD\" target=\"_blank\" rel=\"noopener noreferrer\">비트런 · 사람의 말을 인식하고 반응하는 AI 반려 로봇 ↗</a></p><p class=\"support-caption\">소개 페이지에 연결된 자료입니다. 화면과 조작법은 현재 앱의 가이드를 기준으로 확인하세요.</p></div></details><details class=\"support-section\" id=\"help-updates\"><summary>업데이트 노트</summary><div class=\"support-answer\"><p class=\"support-release\">V2 · 온디바이스 음성인식</p><ul><li>Whisper Base로 기기 내 음성 인식, Bluefy 연결 방식 적용</li><li>누른 채 말하고 손을 떼면 분석·전송</li><li>모델·연결 상태 색상과 오류 상세 표시</li><li>문장에 포함된 명령어 매칭, 전송 성공·실패 구분</li><li>사용 가이드·예제·문제 해결 추가</li></ul></div></details><a class=\"support-original\" href=\"https://boundaryx.io/ai/?bmode=view&idx=163120391\" target=\"_blank\" rel=\"noopener noreferrer\">개념 설명 · 프로젝트 아이디어 보기 ↗</a></div>";
const allSteps=[["#model-control-group","음성 모델을 준비하세요","한국어 또는 English를 선택하고 모델 준비하기를 누르세요. 첫 다운로드에는 인터넷이 필요합니다. 초록색 준비 완료를 기다리세요."],["#command-table-group h3","명령어와 데이터를 확인하세요","“앞으로 움직여”처럼 문장 안에 “앞으로”가 포함되면 forward를 보냅니다. 영어 인식을 사용한다면 영어 사용자 명령을 추가하세요."],["#project-example-link","프로젝트 예제를 준비하세요","이름 확인 코드로 LED의 소문자 5자리를 확인한 뒤 사용할 예제를 다운로드하세요. 마이크로비트의 조건문과 앱 전송 데이터를 맞추세요."],["#bluetooth-control-buttons","마이크로비트를 연결하세요","기기 연결을 눌러 내 마이크로비트를 선택하세요. 아이폰에서는 Bluefy를 사용하세요. 인식만 시험하려면 연결 없이도 사용할 수 있습니다."],["#voice-recognition-ui","누르고 있는 동안 말하세요","마이크를 꾹 누르고 “지금 말하세요” 안내 후 말하세요. 말이 끝나면 손을 떼세요. 준비 전에 떼면 취소됩니다. 키보드는 Space 또는 Enter를 누른 채 사용할 수 있습니다."],["#status-container","인식 결과와 전송을 확인하세요","손을 떼면 인식 중으로 바뀝니다. 결과에 명령이 포함되면 연결된 기기로 한 번 전송합니다. 전송 완료는 로봇 동작 완료와 다릅니다."],["#user-command-group h3","사용자 명령을 추가하세요","말할 문구와 전송할 영문·숫자 데이터를 입력하고 추가를 누르세요. 사용자 명령이 기본 명령보다 우선합니다. X로 삭제할 수 있습니다."],["#user-command-group h3","엑셀로 명령을 저장하세요","페이지를 떠나기 전에 엑셀 내보내기로 사용자 명령을 저장하세요. 엑셀 불러오기로 복원할 수 있습니다."],["#cancel-voice","취소와 정지를 구분하세요","취소는 현재 음성 입력을 버립니다. stop은 보내지 않습니다. 분석 중 취소하면 모델을 다시 준비해야 합니다."]]; const chapters=[{label:'모델·명령',start:0},{label:'기기 연결',start:2},{label:'말하기·저장',start:4}];
const dialog = document.createElement('dialog');
  dialog.id = 'guide-dialog';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.setAttribute('aria-describedby', 'guide-description');
  dialog.innerHTML = `<div id="guide-spotlight" aria-hidden="true"></div><section id="guide-panel"><div class="guide-topline"><span id="guide-progress"></span><button id="guide-close" type="button" aria-label="화면 안내 종료">닫기 ×</button></div><nav class="guide-chapters" aria-label="안내 구간">${chapters.map((chapter, i) => `<button type="button" data-chapter="${i}" aria-pressed="false">${chapter.label}</button>`).join('')}</nav><div aria-live="polite" aria-atomic="true"><h2 id="guide-title"></h2><p id="guide-description"></p></div><p class="guide-caption">화면 안내입니다. 닫은 뒤 직접 눌러보세요.</p><button id="guide-skip-device" type="button" hidden>기기 연결 건너뛰기 →</button><div class="guide-navigation"><button id="guide-prev" type="button">이전</button><button id="guide-next" type="button">다음</button></div></section>`;
  document.body.appendChild(dialog);
  let steps = [], index = 0, target = null, opener = null, originalScroll = 0, pendingFrame = 0;

  let examplesWereOpen = false;

  function openHelp(section) {
    support.open = true;
    if (section) {
      $('help-troubleshooting').open = true;
      $(section).open = true;
    }
    const heading = (section ? $(section) : support).querySelector('summary');
    heading.scrollIntoView({block: 'center', behavior: 'instant'});
    heading.focus({preventScroll: true});
  }
  document.querySelectorAll('[data-help]').forEach(button => button.addEventListener('click', () => openHelp(button.dataset.help || null)));

  function renderStep() {
    const [selector, title, description] = steps[index];
    if (selector === '#project-example-link') $('help-examples').open = true;
    target = document.querySelector(selector);
    const chapterIndex = index < chapters[1].start ? 0 : index < chapters[2].start ? 1 : 2;
    dialog.querySelectorAll('[data-chapter]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === chapterIndex)));
    $('guide-skip-device').hidden = chapterIndex !== 1;
    $('guide-progress').textContent = `${chapters[chapterIndex].label}${chapterIndex === 1 ? ' · 선택' : ''} · ${index + 1} / ${steps.length}`;
    $('guide-title').textContent = title;
    $('guide-description').textContent = description;
    $('guide-prev').disabled = index === 0;
    $('guide-next').textContent = index === steps.length - 1 ? '안내 마치기' : '다음';
    if (target) target.scrollIntoView({block: 'center', behavior: 'instant'});
    positionGuide(true);
  }

  function positionGuide(reveal = false) {
    if (!dialog.open) return;
    const panel = $('guide-panel'), spot = $('guide-spotlight');
    const width = window.innerWidth, height = window.innerHeight, gap = 16;
    panel.style.width = Math.min(360, width - 24) + 'px';
    const ph = panel.getBoundingClientRect().height, pw = panel.getBoundingClientRect().width;
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    let r = target ? target.getBoundingClientRect() : null;
    // Narrow screens reserve the lower area for the explanation. A temporary bottom
    // spacer allows the last control to scroll above it without altering saved data.
    const narrow = width < 700;
    if (reveal && r && narrow) {
      const top = Math.max(12, headerBottom + 16);
      window.scrollBy({top: r.top - top, behavior: 'instant'});
      r = target.getBoundingClientRect();
    }
    let x = width - pw - 12, y = height - ph - 12;
    if (r && !narrow) {
      const candidates = [
        [r.left - pw - gap, Math.max(12, Math.min(r.top, height - ph - 12))],
        [r.right + gap, Math.max(12, Math.min(r.top, height - ph - 12))],
        [Math.max(12, Math.min(r.left, width - pw - 12)), r.bottom + gap],
        [Math.max(12, Math.min(r.left, width - pw - 12)), r.top - ph - gap]
      ];
      const fit = candidates.find(([cx, cy]) => cx >= 12 && cy >= 12 && cx + pw <= width - 12 && cy + ph <= height - 12);
      if (fit) [x,y] = fit;
      else if (r.left < x - 28) r = {left:r.left,top:r.top,right:Math.min(r.right,x-16),bottom:r.bottom};
    }
    panel.style.left = x + 'px'; panel.style.top = Math.max(12, y) + 'px';
    if (r) {
      const top = Math.max(4, r.top - 5), left = Math.max(4, r.left - 5);
      const bottom = Math.min(height - 4, narrow ? y - 12 : height - 4, r.bottom + 5);
      spot.hidden = bottom <= top || r.right <= 0 || r.left >= width;
      Object.assign(spot.style, {left: left + 'px', top: top + 'px', width: Math.max(0, Math.min(width - 4, r.right + 5) - left) + 'px', height: Math.max(0, bottom - top) + 'px'});
    } else spot.hidden = true;
  }
  function startTour(kind, button) {
    if (kind !== 'all') return;
    opener = button; originalScroll = window.scrollY;
    steps = allSteps; index = 0;
    examplesWereOpen = $('help-examples').open;
    document.body.classList.add('guide-active');
    dialog.showModal();
    renderStep();
    $('guide-next').focus({preventScroll:true});
  }
  support.querySelectorAll('[data-tour]').forEach(button => button.addEventListener('click', () => startTour(button.dataset.tour, button)));
  $('guide-prev').addEventListener('click', () => { if (index > 0) { index--; renderStep(); } });
  $('guide-next').addEventListener('click', () => { if (index === steps.length - 1) dialog.close(); else { index++; renderStep(); } });
  dialog.querySelectorAll('[data-chapter]').forEach(button => button.addEventListener('click', () => { index = chapters[Number(button.dataset.chapter)].start; renderStep(); }));
  $('guide-skip-device').addEventListener('click', () => { index = chapters[2].start; renderStep(); $('guide-next').focus({preventScroll:true}); });
  $('guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('guide-active');
    $('help-examples').open = examplesWereOpen;
    window.scrollTo({top:originalScroll, behavior:'instant'});
    if (opener) opener.focus({preventScroll:true});
  });
  const reposition = () => {
    if (!dialog.open || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => { pendingFrame = 0; positionGuide(); });
  };
  window.addEventListener('resize', () => { if (dialog.open) renderStep(); });
  window.addEventListener('scroll', reposition, {passive:true});
  if (location.hash === '#support-card') requestAnimationFrame(() => openHelp());
})();


