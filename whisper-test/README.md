# Whisper voice and BLE test

Base is the default model; Tiny is available for comparison. Prepare the model, connect a micro:bit running a UART project, tap once and speak after the ready message. One recognized command is sent per result, for both microphone and audio file input. Unknown phrases are not sent. Exact normalized phrase matching avoids triggering commands inside unrelated sentences.

Commands: forward, backward, stop, left, right, ring, name, happy, angry, dance. Each packet ends with a newline. The page finds a writable UART characteristic and reports write success or failure. Write completion does not confirm robot execution. No automatic retries are performed. Repeating a command in a new utterance sends it again.

Model execution is local (Transformers.js 3.8.1, WASM, q8). Initial downloads require internet. Desktop simulated BLE tests covered all ten commands, newline framing, repeated commands, failure and disconnection. Physical Bluefy and micro:bit receipt must be tested on device.
