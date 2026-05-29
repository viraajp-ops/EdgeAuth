# Model Binary Folder

Place open-source TFLite binaries here for production/device validation:

- `blazeface-int8.tflite`
- `mobilefacenet-fp16.tflite`
- `antispoof-texture-int8.tflite`

The prototype runs with `SimulatedTfliteAdapter` until the real model adapter is connected.

## Runtime Integration

The working Android app uses live camera capture, local enrollment, liveness
sequence capture, offline template comparison, encrypted queueing, and
sync/purge. Verified `.tflite` files can be added in a separate production
branch once their model-weight licenses and React Native runtime compatibility
are confirmed.
