# 🎙️ Boundary X - AI Voice Recognition (On-device)

**Boundary X - AI Voice Recognition** is a web-based application that uses the multilingual **Whisper Base** model to convert speech into text directly on the user's device.

It integrates with **BBC Micro:bit** through the **Web Bluetooth API**, sending a mapped command when a registered phrase is included in the recognized text.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Tech](https://img.shields.io/badge/Stack-p5.js%20%7C%20Transformers.js%20%7C%20Whisper-orange)

## ✨ Key Features

### 1. 🗣️ On-device Speech Recognition (Whisper Base)
- **Local Processing:** Runs the quantized multilingual Whisper Base model through Transformers.js and single-thread WebAssembly. Audio is processed on the device rather than uploaded to a transcription service.
- **Language Selection:** Supports Korean and English transcription. The built-in command phrases are Korean; add custom phrases to map English speech to hardware commands.
- **Model Preparation:** Downloads the model and runtime when needed. Browser caching can reduce subsequent downloads, but permanent storage and offline startup are not guaranteed.

### 2. 🔗 Wireless Control (Web Bluetooth API)
- **Direct Connection:** Connects to a micro:bit running a compatible **Nordic UART Service** project. The app uses the direct receive-characteristic lookup verified in the Bluefy prototype.
- **Phrase Matching:** Recognizes a command within a longer sentence. For example, "앞으로 움직여" contains "앞으로" and sends `forward`.
- **Transmission Feedback:** Displays recognized text and transmission progress, success, or failure. Write completion does not confirm that the robot executed the command.

### 3. 📝 Custom Commands & Excel Management
- **Editable Mappings:** Add or delete custom voice phrases and their output data. Custom mappings take priority over built-in commands.
- **Excel Import / Export:** Back up and restore custom mappings with `Command` and `Data` columns. Invalid import rows are skipped.
- **Data Validation:** Output data accepts printable ASCII characters without line breaks. Export custom commands before leaving the page if you need to retain them.

### 4. 📱 Responsive UI & Clear Speaking Cues
- **Familiar Layout:** Retains the card layout, command table, rounded buttons, and responsive styling of the voice recognition app.
- **Hold to Speak:** Hold the microphone button, wait for the listening message, and speak while holding. Release to end capture and start recognition. Silence does not submit audio. After 30 seconds without completion, capture is canceled without sending a command.
- **Cancel Support:** Cancel an unfinished utterance. Canceling inference stops the model worker and requires preparing the model again.

---

## 🚀 Getting Started

1. Open the [web app](https://boundary-x.github.io/voice_recogntion_ondevice/) over HTTPS. On iPhone, use **Bluefy** for Bluetooth connectivity.
2. Select the recognition language and click **Prepare Model (모델 준비하기)**. Internet access is needed to download uncached model and runtime files.
3. Load a compatible UART project onto the micro:bit and click **Connect Device (기기 연결)**.
4. Hold the microphone button, wait for **Speak Now (지금 말하세요)**, speak while holding, then release.
5. Check the recognized text, transmission status, and the device's response.

**No Node.js installation or API key is required for end users.** Microphone permission is required. Recognition can be tried without a Bluetooth connection, but data will not be sent.

## 📡 Communication Protocol

After recognition, the app searches for registered phrases contained in the text. Matching normalizes Unicode and removes whitespace. Custom commands are checked first, followed by built-in commands in table order. **Only the first matching output is sent once per utterance.** Repeating the command in a new utterance sends it again.

**Data Format:**
```text
{Mapped Command}\n
```

**Examples:**
- **"앞으로 움직여" contains "앞으로":** `forward\n`
- **"뒤로 가줘" contains "뒤로":** `backward\n`
- **"멈춰 주세요" contains "멈춰":** `stop\n`
- **No registered phrase is found:** No data is sent.
- **Recording is canceled:** No new command is sent; cancellation does not send `stop`.

**Built-in Commands:**

| Voice Phrases | Output |
| --- | --- |
| 전진, 앞으로, 직진, 출발 | `forward` |
| 뒤로, 후진 | `backward` |
| 멈춰, 정지, 그만 | `stop` |
| 좌회전, 왼쪽, 좌측 | `left` |
| 우회전, 오른쪽, 우측 | `right` |
| 사이렌, 소리, 경보 | `ring` |
| 이름, 너의 이름 | `name` |
| 안녕, 반가워 | `happy` |
| 혼날래, 화났어 | `angry` |
| 춤 춰, 춤춰, 댄스 | `dance` |

Matching is based on phrase inclusion, not sentence intent or negation. If multiple commands occur in one sentence, the priority described above determines the output. A connection change during an utterance suppresses that utterance's pending transmission. Failed writes are not automatically retried.

**Tech Stack:**
- **Frontend:** HTML5, CSS3
- **UI Library:** p5.js 1.6.0
- **AI Engine:** Transformers.js 3.8.1 / multilingual Whisper Base (`q8`)
- **Execution:** Web Worker / single-thread WebAssembly
- **Audio Capture:** Web Audio API / microphone input
- **Excel Files:** SheetJS
- **Connectivity:** Web Bluetooth API (BLE / Nordic UART)

**Validation:**
- Desktop checks cover real model inference with simulated microphone input, phrase inclusion, custom commands, Excel import/export, simulated BLE writes and failures, and responsive viewport layouts.
- The user verified the earlier prototype on Bluefy. Actual recognition accuracy, latency, and hardware behavior should be checked on the target devices with the integrated app.
- The [comparison page](https://boundary-x.github.io/voice_recogntion_ondevice/whisper-test/) remains available for Base/Tiny testing.

**License:**
- Copyright © 2024 Boundary X Co. All rights reserved.
- All rights to the application source code and design belong to BoundaryX. Third-party libraries and model weights remain subject to their respective licenses.
- Web: [boundaryx.io](https://boundaryx.io)
- Contact: [Boundary X](https://boundaryx.io/contact)

Model and Bluetooth status panels use amber while preparing, green when ready/connected, red for errors, and neutral gray when idle/disconnected. Model failures display the reported error details and relevant retry guidance.

Mouse, touch and keyboard (hold Space or Enter) are supported. Releasing before microphone readiness shows guidance and discards the input. Pointer cancellation or leaving the page cancels capture without submitting it.
