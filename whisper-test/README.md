# On-device Whisper test

Open https://boundary-x.github.io/voice_recogntion_ondevice/whisper-test/ in Bluefy. Select Base (default), prepare the model, then tap once and wait for the listening message. Audio is processed locally with Transformers.js 3.8.1, quantized multilingual Whisper and single-thread WASM. Internet is needed for initial assets and models.

Compare Tiny with the same audio file. Results include model, language and inference time. Optional BLE connection sends no commands. Desktop Edge model/file/microphone-path tests passed using an English fixture; physical iPhone compatibility remains to be tested. The eight-second limit and amplitude-based silence detection are experimental. The original app is unchanged.
