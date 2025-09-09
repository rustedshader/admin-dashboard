/**
 * Utility functions for API error handling and token management
 */

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export function isTokenExpiredError(error: any): boolean {
  if (typeof error === "string") {
    return (
      error.includes("Could not validate credentials") ||
      error.includes("token") ||
      error.includes("expired")
    );
  }

  if (error?.message) {
    return (
      error.message.includes("Could not validate credentials") ||
      error.message.includes("token") ||
      error.message.includes("expired")
    );
  }

  if (error?.details) {
    return (
      error.details.includes("Could not validate credentials") ||
      error.details.includes("token") ||
      error.details.includes("expired")
    );
  }

  return false;
}

export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorData: ApiErrorResponse;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check for token expiration
    if (response.status === 401 || isTokenExpiredError(errorData)) {
      throw new Error("TOKEN_EXPIRED");
    }

    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export function formatApiError(error: any): string {
  if (error.message === "TOKEN_EXPIRED") {
    return "Your session has expired. Please login again.";
  }

  if (error.message?.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return error.message || "An unexpected error occurred";
}
