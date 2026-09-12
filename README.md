# Boundary X — On-device Voice Recognition

A browser-based micro:bit voice controller using multilingual Whisper Base, Transformers.js 3.8.1, and single-thread WASM (q8). Speech is transcribed on the device; model/runtime downloads need internet. Browser caching can reduce repeat downloads but does not guarantee permanent storage or offline startup. End users do not need Node.js or an API key.

## Usage

1. Open the HTTPS app. On iPhone, use Bluefy for Bluetooth support.
2. Select the recognition language and prepare the model.
3. Connect a micro:bit running a compatible Nordic UART project.
4. Tap the microphone once, wait for the listening message, then speak. Silence after speech, a second tap, or the eight-second limit ends capture.
5. Check recognized text and transmission status. Cancel discards an unfinished utterance; canceling model inference requires reloading the model.

The existing card layout, command table, custom command addition/deletion and Excel import/export are retained. The standalone `whisper-test/` page remains available for diagnostics.

## Command matching and transmission

Matching uses substring inclusion after Unicode normalization and whitespace removal. For example, `앞으로 움직여` matches `앞으로` and sends `forward\n`. Custom commands take priority; otherwise the first matching command in table order wins. Only one packet is sent per utterance, and a repeated utterance can send the same command again. This is keyword matching, not intent or negation analysis.

Default outputs: `forward`, `backward`, `stop`, `left`, `right`, `ring`, `name`, `happy`, `angry`, `dance`. Custom data accepts printable ASCII without line breaks. Excel files use `Command` and `Data` columns; invalid rows are skipped. Export before leaving if you need to retain custom commands.

The micro:bit receive characteristic is resolved directly as `6e400003-b5a3-f393-e0a9-e50e24dcca9e` in service `6e400001-b5a3-f393-e0a9-e50e24dcca9e`, matching the Bluefy-tested connection path. UART initialization errors retain the connection and show the error instead of force-disconnecting. Success means the browser write completed, not that the robot executed the command. No automatic retries. A connection change during an utterance suppresses its pending transmission.

## Deployment

Deploy `index.html`, `style.css`, `sketch.js`, `command-ui.js`, and `worker.js` together. Existing legacy model assets are retained but are not loaded by this version.

## Validation

Desktop checks cover custom command creation/deletion, substring matching, repeated newline-delimited packets, simulated write failure, Excel import/export including numeric zero and invalid rows. Prior prototype Bluefy validation was reported successful by the user. Physical hardware validation of this integrated UI remains a follow-up; desktop simulated input does not measure classroom Korean accuracy.

Integrated validation also exercised real Base inference with simulated microphone audio, result-to-BLE dispatch, suppression after connection changes, and 320/390/768/1280 pixel viewport overflow checks. The simulated audio test verifies execution, not recognition accuracy.
