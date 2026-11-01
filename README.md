# 🎙️ Boundary X - AI Voice Recognition

**Boundary X - AI Voice Recognition** is a web-based application that offers **Web Speech API** recognition (default) and on-device **Whisper Base** recognition in one interface.

It integrates with **BBC Micro:bit** through the **Web Bluetooth API**, sending a mapped command when a registered phrase is included in the recognized text.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Tech](https://img.shields.io/badge/Stack-p5.js%20%7C%20Transformers.js%20%7C%20Whisper-orange)

## ✨ Key Features

### 1. 🗣️ Selectable Speech Recognition
- **Web Speech API (default):** Korean browser-based recognition sends matching commands while the button is held. PC/Android is recommended. Service availability depends on the browser and network; audio may be processed by the browser provider.
- **Whisper Base:** Recommended for iPhone/iPad with Bluefy. Hold to record, release to analyze and send. Analysis time depends on the device.
- **Manual Selection:** Both choices remain available on every device. Switching cancels pending recognition while preserving custom commands and the Bluetooth connection.
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
- **Live Feedback:** Engine-specific step indicators, a ready beep and red microphone, and an audio-level ring clarify when to speak. Whisper shows a loading indicator during analysis. Successful Bluetooth writes briefly highlight the output; offline previews do not show a success highlight. The optional Web Speech audio meter falls back to a static ring if unavailable. Reduced-motion settings disable ring motion and spinner rotation.
- **Familiar Layout:** Retains the card layout, command table, rounded buttons, and responsive styling of the voice recognition app.
- **Hold to Speak:** Hold the microphone button, wait for the listening message, and speak while holding. Web Speech recognizes and sends while speaking; release ends input. Whisper starts analysis after release. Sessions are limited to 30 seconds. Commands already sent by Web Speech cannot be undone.
- **Cancel Support:** Cancel an unfinished utterance. Canceling Whisper inference stops the model worker and requires preparing the model again. Canceling Web Speech discards pending results but does not undo completed transmissions.

---

## 🚀 Getting Started

1. Open the [web app](https://boundary-x.github.io/voice_recogntion_ondevice/) over HTTPS. On iPhone, use **Bluefy** for Bluetooth connectivity.
2. Choose an engine. Web Speech needs no model download. For Whisper, choose Korean or English and click **Prepare Model (모델 준비하기)**; internet access is needed for uncached files.
3. Load a compatible UART project onto the micro:bit and click **Connect Device (기기 연결)**.
4. Hold the microphone button, wait for **Speak Now (지금 말하세요)**, speak while holding, then release.
5. Check the recognized text, transmission status, and the device's response.

**No Node.js installation or API key is required for end users.** Microphone permission is required. Recognition can be tried without a Bluetooth connection, but data will not be sent.

## 📡 Communication Protocol

After recognition, the app searches for registered phrases contained in the text. Matching normalizes Unicode and removes whitespace. Custom commands are checked first, followed by built-in commands in table order. Whisper sends the first matching output once after analysis. Web Speech checks each incoming result and sends each distinct matching output at most once per press session. A new session can send the same output again.

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
- The unified-engine tests cover default selection, immediate command dispatch, duplicate suppression, stale-result cancellation, queued-send cancellation, connection changes, and preservation of custom commands and prepared Whisper state. Browser checks cover both engine UIs and all ten walkthrough steps.
- Real speech latency and physical BLE behavior of this integrated release still require target-device testing. The in-app test browser reported a Web Speech network error; Chrome/network guidance is shown for that case.
- The user verified the earlier prototype on Bluefy. Actual recognition accuracy, latency, and hardware behavior should be checked on the target devices with the integrated app.
- The [comparison page](https://boundary-x.github.io/voice_recogntion_ondevice/whisper-test/) remains available for Base/Tiny testing.

**License:**
- Copyright © 2024 Boundary X Co. All rights reserved.
- All rights to the application source code and design belong to BoundaryX. Third-party libraries and model weights remain subject to their respective licenses.
- Web: [boundaryx.io](https://boundaryx.io)
- Contact: [Boundary X](https://boundaryx.io/contact)

Model and Bluetooth status panels use amber while preparing, green when ready/connected, red for errors, and neutral gray when idle/disconnected. Model failures display the reported error details and relevant retry guidance.

Mouse, touch and keyboard (hold Space or Enter) are supported. Releasing before microphone readiness shows guidance and discards the input. Pointer cancellation or leaving the page cancels pending input. Previously transmitted Web Speech commands are not reversed.

## In-app guide and support

The header Help button opens a collapsible support card with a ten-step highlighted walkthrough that adapts to the selected engine, five MakeCode examples, two teaching resources, troubleshooting, and update notes. The guide follows the current hold-to-speak interaction and does not operate the controls. The header badge is V2. See [INTRO_PAGE_REVIEW.md](INTRO_PAGE_REVIEW.md) for the introduction page review and proposed Korean replacement copy.


