/**
 * sketch.js
 * Boundary X Voice Controller Logic (V3 - SenseVoice ONNX 기반)
 *
 * 교실 환경의 네트워크 부담을 줄이기 위해 Cache API를 도입하여
 * 최초 1회만 모델을 다운로드하고 브라우저 저장소에 영구 보관합니다.
 */

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice = null;
let rxCharacteristic = null;
let isConnected = false;
let bluetoothStatus = "연결 대기 중";

let recognitionStatus = "블루투스 연결 및 모델 로드가 완료되면 사용할 수 있습니다.";

// 오디오 수집용 변수
let audioContext = null;
let micStream = null;
let scriptNode = null;
let audioChunks = []; // 녹음된 소리 조각들을 모아두는 곳

let isPressing = false;
let sentCommandsThisSession = new Set();

// 기존 명령어 세트
function containsKorean(text) {
  return /[가-힣ㄱ-ㆎ]/.test(text);
}

const voiceCommands = {
  forward: ["전진", "앞으로", "직진", "출발"],
  backward: ["뒤로", "후진"],
  stop: ["멈춰", "정지", "그만"],
  left: ["좌회전", "왼쪽", "좌측"],
  right: ["우회전", "오른쪽", "우측"],
  ring: ["사이렌", "소리", "경보"],
  dance: ["춤 춰", "춤춰", "댄스"],
};
let userCommands = {};

// ===================== SenseVoice ONNX 모델 및 캐시 설정 =====================
const CACHE_NAME = 'sensevoice-models-v3';

const MODELS = [
  {
    name: "한국어(SenseVoice)",
    files: [
      'models/sense-voice-encoder-int8.onnx',
      'models/chn_jpn_yue_eng_ko_spectok.bpe.model'
    ]
  }
];

let currentModel = MODELS[0];
let ortSession = null; // ONNX 세션 (AI 엔진)
let modelStatus = "idle";
let modelLoadProgress = 0;

function setup() {
  noCanvas();
  checkBrowserSupport();
  createBluetoothUI();
  createModelControlUI();
  createCommandTable();
  createUserCommandUI();
  createVoiceRecognitionUI();

  const excelInput = select("#excelInput");
  if (excelInput) {
    excelInput.elt.addEventListener("change", importCommandsFromExcel, false);
  }

  // 페이지 로드 시 캐시를 확인하며 모델 다운로드 시작
  loadSenseVoiceModel(currentModel);
}

function checkBrowserSupport() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("마이크 입력을 지원하지 않는 브라우저입니다.");
  }
}

// ===================== UI 생성 및 관리 =====================
function createBluetoothUI() {
  const statusElement = select("#bluetoothStatus");
  if (statusElement) statusElement.html(`상태: ${bluetoothStatus}`);

  const buttonContainer = select("#bluetooth-control-buttons");
  if (buttonContainer) {
    const connectButton = createButton("기기 연결").addClass("start-button");
    connectButton.mousePressed(connectBluetooth);
    buttonContainer.child(connectButton);

    const disconnectButton = createButton("연결 해제").addClass("stop-button");
    disconnectButton.mousePressed(disconnectBluetooth);
    buttonContainer.child(disconnectButton);
  }
}

function createModelControlUI() {
  const langContainer = select("#language-select-container");
  if (langContainer) {
    langContainer.html("");
    const languageSelect = createSelect();
    languageSelect.addClass("language-select");
    MODELS.forEach((model, index) => languageSelect.option(model.name, index));
    langContainer.child(languageSelect);
  }
  updateModelStatusUI();
}

// ===================== 스마트 다운로드 (Cache API) =====================
async function loadSenseVoiceModel(modelData) {
  modelStatus = "loading";
  modelLoadProgress = 0;
  setMicButtonEnabled(false);
  updateModelStatusUI();

  try {
    const cache = await caches.open(CACHE_NAME);
    let loadedCount = 0;
    const totalFiles = modelData.files.length;

    for (const filePath of modelData.files) {
      let response = await cache.match(filePath);
      
      // 기기에 파일이 없다면 다운로드
      if (!response) {
        recognitionStatus = `${filePath.split('/').pop()} 다운로드 중...`;
        displayRecognitionStatus();
        
        response = await fetch(filePath);
        if (response.ok) {
          await cache.put(filePath, response.clone()); // 영구 저장
        } else {
          throw new Error("파일 로드 실패: " + filePath);
        }
      }
      
      loadedCount++;
      modelLoadProgress = Math.round((loadedCount / totalFiles) * 100);
      updateModelStatusUI();
    }

    recognitionStatus = "AI 모델 준비 중...";
    displayRecognitionStatus();

    // 저장된 파일에서 ONNX 세션 초기화
    const encoderResponse = await cache.match('models/sense-voice-encoder-int8.onnx');
    const modelBuffer = await encoderResponse.arrayBuffer();
    
    // WebAssembly를 사용하여 웹에서 가볍게 AI 엔진 실행
    ortSession = await ort.InferenceSession.create(modelBuffer, { executionProviders: ['wasm'] });

    modelStatus = "ready";
    setMicButtonEnabled(true);
    recognitionStatus = "마이크 버튼을 눌러 명령을 말해보세요.";
    updateModelStatusUI();
    displayRecognitionStatus();

  } catch (error) {
    console.error("SenseVoice 로드 에러:", error);
    modelStatus = "error";
    setMicButtonEnabled(false);
    recognitionStatus = "AI 모델을 불러오지 못했습니다. 새로고침 해주세요.";
    updateModelStatusUI();
    displayRecognitionStatus();
  }
}

function updateModelStatusUI() {
  const el = select("#modelStatus");
  const bar = select("#modelProgressBar");
  if (el) {
    el.removeClass("status-connected").removeClass("status-error").removeClass("status-loading");
    if (modelStatus === "loading") {
      el.html(`상태: AI 모델 확인 및 로드 중... (${modelLoadProgress}%)`).addClass("status-loading");
    } else if (modelStatus === "ready") {
      el.html(`상태: 음성 인식 준비 완료`).addClass("status-connected");
    } else if (modelStatus === "error") {
      el.html("상태: 다운로드 실패").addClass("status-error");
    }
  }
  if (bar) bar.style("width", `${modelLoadProgress}%`);
}

function setMicButtonEnabled(enabled) {
  const micBtn = select(".mic-button");
  if (!micBtn) return;
  micBtn.elt.disabled = !enabled;
  enabled ? micBtn.removeClass("disabled") : micBtn.addClass("disabled");
}

// ===================== 명령어 데이터셋 엑셀 연동 =====================
function createCommandTable() {
  const tableContainer = select("#command-table-container");
  if (tableContainer) {
    tableContainer.html("");
    const table = createElement("table");
    tableContainer.child(table);
    updateCommandTable();
  }
}

function updateCommandTable() {
  const table = select("table");
  if (table) {
    table.html("");
    const header = createElement("tr");
    header.child(createElement("th", "음성 명령")).child(createElement("th", "데이터")).child(createElement("th", "삭제"));
    table.child(header);

    Object.entries(voiceCommands).forEach(([command, phrases]) => {
      const row = createElement("tr");
      row.child(createElement("td", phrases.join(", "))).child(createElement("td", command)).child(createElement("td", ""));
      table.child(row);
    });

    Object.entries(userCommands).forEach(([command, data]) => {
      const row = createElement("tr");
      row.child(createElement("td", command)).child(createElement("td", data[0]));
      
      const deleteBtn = createButton("X").style("color", "#EA4335").style("border", "none").style("background", "transparent").style("cursor", "pointer");
      deleteBtn.mousePressed(() => { delete userCommands[command]; updateCommandTable(); });
      row.child(createElement("td").child(deleteBtn)).style("background-color", "#F1F8E9");
      table.child(row);
    });
  }
}

function createUserCommandUI() {
  const inputContainer = select("#user-command-ui");
  if (inputContainer) {
    const commandInput = createInput().attribute("placeholder", "새 명령어");
    const dataInput = createInput().attribute("placeholder", "영어 데이터");
    
    const addButton = createButton("추가").addClass("start-button");
    addButton.mousePressed(() => {
      const cmd = commandInput.value().trim();
      const data = dataInput.value().trim();
      if (!cmd || !data) return alert("모두 입력해주세요.");
      if (containsKorean(data)) return alert("데이터는 영어로 입력해주세요.");
      userCommands[cmd] = [data];
      updateCommandTable();
      commandInput.value(""); dataInput.value("");
    });
    
    inputContainer.child(commandInput).child(dataInput).child(addButton);
    
    const exportBtn = createButton("엑셀 내보내기").addClass("excel-button");
    exportBtn.mousePressed(exportCommandsToExcel);
    const importBtn = createButton("엑셀 불러오기").addClass("excel-button");
    importBtn.mousePressed(() => select("#excelInput").elt.click());
    
    inputContainer.child(exportBtn).child(importBtn);
  }
}

function exportCommandsToExcel() {
  if (Object.keys(userCommands).length === 0) return alert("명령어가 없습니다.");
  const wsData = [["Command", "Data"]];
  Object.entries(userCommands).forEach(([key, val]) => wsData.push([key, val[0]]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "UserCommands");
  XLSX.writeFile(wb, "commands_backup.xlsx");
}

function importCommandsFromExcel(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    for (let i = 1; i < jsonData.length; i++) {
      if (jsonData[i][0] && jsonData[i][1]) userCommands[jsonData[i][0]] = [String(jsonData[i][1])];
    }
    updateCommandTable();
    select("#excelInput").value("");
  };
  reader.readAsArrayBuffer(file);
}

// ===================== 마이크 제어 및 AI 추론 =====================
function createVoiceRecognitionUI() {
  const container = select("#voice-recognition-ui");
  if (container) {
    const micBtn = createButton("").addClass("mic-button disabled");
    micBtn.elt.disabled = true;
    micBtn.html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`);

    const handleDown = async (e) => {
      if (e.cancelable) e.preventDefault();
      if (!isConnected) return alert("블루투스를 연결해주세요.");
      if (modelStatus !== "ready" || !ortSession) return alert("AI 모델이 준비되지 않았습니다.");

      isPressing = true;
      micBtn.addClass("active");
      sentCommandsThisSession.clear();
      audioChunks = []; // 이전 소리 초기화
      
      recognitionStatus = "듣고 있습니다...";
      displayRecognitionStatus();

      try {
        // 1. 마이크 권한 요청 및 소리 길 연결
        micStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        
        const source = audioContext.createMediaStreamSource(micStream);
        
        // 2. 소리를 조각내어 모으는 역할 (버퍼 크기 4096)
        scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
        scriptNode.onaudioprocess = (event) => {
          if (!isPressing) return;
          const inputData = event.inputBuffer.getChannelData(0);
          audioChunks.push(new Float32Array(inputData)); // 소리 조각 저장
        };

        source.connect(scriptNode);
        scriptNode.connect(audioContext.destination);
      } catch (err) {
        console.error("마이크 시작 오류:", err);
        recognitionStatus = "마이크 접근 권한이 필요합니다.";
        displayRecognitionStatus();
      }
    };

    const handleUp = async (e) => {
      if (e.cancelable) e.preventDefault();
      if (!isPressing) return;
      
      isPressing = false;
      micBtn.removeClass("active");
      recognitionStatus = "AI가 명령을 분석 중입니다...";
      displayRecognitionStatus();
      
      // 마이크 장치 끄기
      if (scriptNode) scriptNode.disconnect();
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      if (audioContext) audioContext.close();

      // 모아둔 소리 조각들을 하나로 합치기
      if (audioChunks.length > 0) {
        processAndRunAI(audioChunks);
      } else {
        recognitionStatus = "대기 중";
        displayRecognitionStatus();
      }
    };

    micBtn.elt.addEventListener("mousedown", handleDown);
    micBtn.elt.addEventListener("mouseup", handleUp);
    micBtn.elt.addEventListener("mouseleave", handleUp);
    micBtn.elt.addEventListener("touchstart", handleDown, { passive: false });
    micBtn.elt.addEventListener("touchend", handleUp, { passive: false });
    container.child(micBtn);
  }
}

async function processAndRunAI(chunks) {
  // 전체 소리 길이 계산
  let totalLength = 0;
  for (let chunk of chunks) totalLength += chunk.length;
  
  // 하나의 긴 소리 데이터로 병합
  let mergedAudio = new Float32Array(totalLength);
  let offset = 0;
  for (let chunk of chunks) {
    mergedAudio.set(chunk, offset);
    offset += chunk.length;
  }

  try {
    // 소리 데이터를 AI가 이해할 수 있는 형태(Tensor)로 변환
    // [batch_size=1, sequence_length]
    const tensor = new ort.Tensor('float32', mergedAudio, [1, mergedAudio.length]);
    
    // AI 모델에게 데이터 전달 및 결과 받기
    const results = await ortSession.run({ input: tensor });
    
    // 인식된 텍스트 결과 (결과 반환 객체의 이름은 모델마다 다를 수 있으나 보통 output 또는 logits)
    const recognizedText = results[Object.keys(results)[0]].data; 
    
    // 결과 확인 후 마이크로비트로 전송
    if (recognizedText && checkAndSendCommand(String(recognizedText))) {
      recognitionStatus = `명령 실행: ${recognizedText}`;
    } else {
      recognitionStatus = `인식 불가 / 대기 중`;
    }
  } catch (error) {
    console.error("AI 추론 에러:", error);
    recognitionStatus = "분석 중 오류가 발생했습니다.";
  }
  displayRecognitionStatus();
}

function displayRecognitionStatus() {
  const statusContainer = select("#status-container");
  if (statusContainer) {
    let statusDiv = select("#recognitionStatus");
    if (!statusDiv) { statusDiv = createDiv().id("recognitionStatus").parent(statusContainer); }
    statusDiv.html(recognitionStatus);
  }
}

function checkAndSendCommand(text) {
  for (const [key, data] of Object.entries(userCommands)) {
    if (text.includes(key)) return trySendOnce(data[0]);
  }
  for (const [key, phrases] of Object.entries(voiceCommands)) {
    if (phrases.some(p => text.includes(p))) return trySendOnce(key);
  }
  return false;
}

function trySendOnce(data) {
  if (sentCommandsThisSession.has(data)) return false;
  sentCommandsThisSession.add(data);
  sendBluetoothData(data);
  return true;
}

// ===================== 블루투스 (Micro:bit 연결) =====================
async function connectBluetooth() {
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "BBC micro:bit" }], optionalServices: [UART_SERVICE_UUID] });
    const server = await bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE_UUID);
    rxCharacteristic = await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);
    
    isConnected = true;
    bluetoothStatus = `${bluetoothDevice.name} 연결됨`;
    updateBluetoothStatusUI("connected");
  } catch (error) {
    bluetoothStatus = "연결 실패 (다시 시도해주세요)";
    updateBluetoothStatusUI("error");
  }
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) bluetoothDevice.gatt.disconnect();
  isConnected = false;
  bluetoothStatus = "연결 해제됨";
  updateBluetoothStatusUI("default");
}

async function sendBluetoothData(data) {
  if (!rxCharacteristic || !isConnected) return;
  const encoder = new TextEncoder();
  await rxCharacteristic.writeValue(encoder.encode(`${data}\n`));
}

function updateBluetoothStatusUI(type) {
  const el = select("#bluetoothStatus");
  if (el) {
    el.removeClass("status-connected").removeClass("status-error").html(`상태: ${bluetoothStatus}`);
    if (type === "connected") el.addClass("status-connected");
    else if (type === "error") el.addClass("status-error");
  }
}