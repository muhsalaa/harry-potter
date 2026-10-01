export type ApiFailure = {
  status: number;
  message: string;
};

export class ApiError extends Error {
  status: number;

  constructor({ status, message }: ApiFailure) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * One request helper for every slice. `same-origin` credentials so the session
 * cookie travels; relative paths so the Vite proxy handles dev.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...init.headers },
      ...init,
    });
  } catch {
    throw new ApiError({ status: 0, message: "The server is not answering. Is it running?" });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError({
      status: response.status,
      message: body?.error ?? `The server answered ${response.status}.`,
    });
  }

  // 204 has no body: logout proves itself by the absence of a session, not by
  // a payload.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const apiGet = <T>(path: string) => request<T>(path);
