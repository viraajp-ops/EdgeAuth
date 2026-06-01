import { FaceGuardEngine } from "../src/faceguard/FaceGuardEngine";
import { createDemoFrameSequence } from "../src/faceguard/frameSamples";
import { LivenessEngine } from "../src/faceguard/liveness/LivenessEngine";
import { SimulatedTfliteAdapter } from "../src/faceguard/model/ModelAdapter";

describe("FaceGuard offline pipeline", () => {
  it("authenticates a valid offline liveness sequence", async () => {
    const engine = new FaceGuardEngine(new SimulatedTfliteAdapter());
    await engine.initialize();

    const result = await engine.authenticate({
      frames: createDemoFrameSequence(),
      deviceId: "test-device",
      useLocalEnrollment: false,
    });

    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(0.82);
    expect(result.livenessScore).toBeGreaterThan(0.74);
  });

  it("rejects frames without enough active liveness proof", () => {
    const engine = new LivenessEngine();
    const frames = createDemoFrameSequence().slice(0, 1);
    const result = engine.evaluate(frames, ["blink", "headTurn", "smile"]);

    expect(result.passed).toBe(false);
    expect(result.failedChallenges.length).toBeGreaterThan(0);
  });
});
