# FaceGuard for Datalake 3.0

Offline facial recognition and liveness detection prototype for Hackathon 7.0.

FaceGuard is a React Native codebase designed for remote field authentication where no network is available. The implementation follows the supplied PPT: BlazeFace-style face detection, MobileFaceNet-style embedding match, active liveness checks, encrypted local queueing, and sync/purge after connectivity returns.

## What Is Included

- React Native + TypeScript mobile prototype for Android and iOS.
- Offline authentication engine with model adapter boundaries.
- Blink, head-turn, smile, and texture-score liveness pipeline.
- Face embedding match with cosine similarity thresholding.
- Encrypted local pending queue using SecureStore-backed key material and SQLite.
- Network-aware sync service with purge only after server acknowledgement.
- Benchmark script and unit tests for the offline pipeline.
- Technical documentation and AWS sync contract.

## Prototype Status

The project runs with a simulated TFLite adapter so the judging panel can inspect and execute the full offline flow without proprietary training artifacts. To move from prototype to production, place open-source `.tflite` binaries in `models/` and implement the same `ModelAdapter` interface with the chosen React Native TFLite bridge.

Target constraints from the PPT:

| Constraint | Implementation Target |
| --- | --- |
| Model footprint | 14.5 MB planned bundle, under 20 MB |
| Auth speed | Under 1 second target |
| Devices | Android 8.0+, iOS 12+, 3 GB RAM |
| Framework | React Native cross-platform |
| Network | Fully offline auth, sync only after connectivity |
| Licenses | Open-source stack only |

## Run

```bash
npm install
npm run prepare:models
npm test
npm run benchmark
npm start
```

For a device build:

```bash
npm run android
npm run ios
```

## Important Files

- `src/faceguard/FaceGuardEngine.ts`: end-to-end offline auth orchestration.
- `src/faceguard/model/ModelAdapter.ts`: swap point for real TFLite inference.
- `src/faceguard/liveness/LivenessEngine.ts`: active and passive liveness scoring.
- `src/faceguard/storage/OfflineQueue.ts`: encrypted local queue.
- `src/faceguard/sync/SyncService.ts`: connectivity-aware upload and purge.
- `src/screens/AuthScreen.tsx`: field authentication screen.
- `docs/technical-design.md`: architecture, models, benchmarks, and risks.
- `docs/integration-guide.md`: Datalake 3.0 integration steps.

## Production Model Swap

1. Run `npm run prepare:models`.
2. Replace the placeholder files in `models/` with open-source model binaries:
   - `blazeface-int8.tflite`
   - `mobilefacenet-fp16.tflite`
   - `antispoof-texture-int8.tflite`
3. Add a native TFLite adapter that implements `ModelAdapter`.
4. Validate bundle size with `docs/model-card.md` and benchmark on a mid-range Android device.

## Submission Notes

This repository is structured as a hackathon-ready prototype plus integration guide. It does not claim trained production biometric accuracy until final open-source datasets, model weights, and device benchmark evidence are attached.
