type ValidationError = Record<string, unknown>;

export type ApiResult<T> =
  | {
      error: false;
      data: T;
    }
  | {
      error: true;
      message: string | ValidationError;
      status?: number;
    };
