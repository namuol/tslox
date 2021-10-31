export type Result<ErrT, T> =
  | { err: ErrT; val?: undefined }
  | { val: T; err?: undefined };

export const err = <ErrT, T>(error: ErrT): Result<ErrT, T> => ({ err: error });
export const ok = <ErrT, T>(val: T): Result<ErrT, T> => ({ val });
