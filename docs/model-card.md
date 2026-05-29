# FaceGuard Model Card

## Intended Use

Authenticate enrolled field personnel in remote locations without active internet connectivity.

## Non-Goals

- Public surveillance.
- Criminal identification.
- Continuous background tracking.
- Authentication of non-enrolled people.

## Training Data Requirement

For final submission, train or fine-tune on opt-in, consented datasets covering:

- Indian demographics across regions and skin tones.
- Ages 18 to 65.
- Outdoor lighting: harsh sunlight, low light, shadows.
- Field accessories: helmets, turbans, hijabs, safety glasses.

## Evaluation Targets

| Metric | Target |
| --- | ---: |
| Recognition accuracy | > 95% |
| False accept rate | < 0.1% |
| False reject rate | < 2.5% |
| Liveness accuracy | > 98% |
| Full authentication latency | < 1 second |
| Model bundle size | < 20 MB |

## Bias And Robustness Checks

Evaluate each model split by region, lighting, skin tone range, age bucket, gender presentation, and common field accessories. Report both aggregate and worst-segment performance.

## Open-Source License Requirement

Only include datasets, model code, and pretrained weights whose licenses allow hackathon distribution and app integration without extra commercial fees.

## Candidate Model Sources

- BlazeFace detector: Google MediaPipe/BlazeFace family, typically Apache-2.0.
- MobileFaceNet recognizer: use a MobileFaceNet TFLite export whose model weights are explicitly MIT or otherwise permissive.
- Anti-spoofing: MiniFASNet-style passive liveness models can be Apache-2.0 when sourced from verified upstream releases.

Do not rely only on a repository code license. Confirm the actual weight-file
license and dataset constraints before shipping biometric recognition weights.
