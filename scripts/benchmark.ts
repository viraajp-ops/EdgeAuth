import { FaceGuardEngine } from '../src/faceguard/FaceGuardEngine';
import { createDemoFrameSequence } from '../src/faceguard/frameSamples';

async function main() {
  const engine = new FaceGuardEngine();
  await engine.initialize();
  const runs = 25;
  const timings: number[] = [];

  for (let index = 0; index < runs; index += 1) {
    const result = await engine.authenticate({
      frames: createDemoFrameSequence(),
      deviceId: 'benchmark-snapdragon-665-profile'
    });
    timings.push(result.durationMs);
  }

  const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
  const max = Math.max(...timings);
  console.log(JSON.stringify({ runs, averageMs: average, maxMs: max, targetMs: 1000 }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
