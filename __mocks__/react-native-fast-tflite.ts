export type TensorflowModel = {
  run: (input: unknown[]) => Promise<unknown[]>;
  runSync: (input: unknown[]) => unknown[];
  inputs: unknown[];
  outputs: unknown[];
  delegate: string;
};

export async function loadTensorflowModel(): Promise<TensorflowModel> {
  throw new Error('react-native-fast-tflite is not available in Jest.');
}

export function useTensorflowModel(): { state: 'error'; model: undefined; error: Error } {
  return {
    state: 'error',
    model: undefined,
    error: new Error('react-native-fast-tflite is not available in Jest.')
  };
}
