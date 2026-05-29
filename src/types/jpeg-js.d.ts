declare module 'jpeg-js' {
  export type JpegDecodeOptions = {
    useTArray?: boolean;
    colorTransform?: boolean;
  };

  export type JpegDecodeResult = {
    width: number;
    height: number;
    data: Uint8Array;
  };

  export function decode(
    jpegData: Uint8Array,
    options?: JpegDecodeOptions
  ): JpegDecodeResult;
}
