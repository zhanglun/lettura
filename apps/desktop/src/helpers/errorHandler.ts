import { t } from "i18next";
import { toast } from "./toast";

export enum ErrorType {
  NETWORK = "NETWORK",
  SYNC = "SYNC",
  VALIDATION = "VALIDATION",
  UNKNOWN = "UNKNOWN",
}

const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: t("Network error. Please check your connection"),
  [ErrorType.SYNC]: t("Sync failed. Please try again"),
  [ErrorType.VALIDATION]: t("Invalid input. Please check your data"),
  [ErrorType.UNKNOWN]: t("An unexpected error occurred"),
};

/** 结构化探测 HTTP 类错误（fetch 封装或带 response 的任何错误对象） */
type HttpLikeError = {
  code?: string;
  response?: {
    status?: number;
    statusText?: string;
    data?: { message?: string };
  };
};

const asHttpError = (error: unknown): HttpLikeError | null =>
  error && typeof error === "object" ? (error as HttpLikeError) : null;

export const getErrorType = (error: unknown): ErrorType => {
  const http = asHttpError(error);
  if (http) {
    if (http.code === "ERR_NETWORK" || http.code === "ECONNABORTED") {
      return ErrorType.NETWORK;
    }
    if (http.response?.status === 400 || http.response?.status === 422) {
      return ErrorType.VALIDATION;
    }
  }

  if (typeof error === "string") {
    const lowerError = error.toLowerCase();
    if (lowerError.includes("network") || lowerError.includes("connection")) {
      return ErrorType.NETWORK;
    }
    if (lowerError.includes("sync") || lowerError.includes("fetch")) {
      return ErrorType.SYNC;
    }
    if (lowerError.includes("invalid") || lowerError.includes("validation")) {
      return ErrorType.VALIDATION;
    }
  }

  return ErrorType.UNKNOWN;
};

export const getUserFriendlyMessage = (error: unknown): string => {
  const errorType = getErrorType(error);

  const http = asHttpError(error);
  if (http?.response) {
    if (http.response.data?.message) {
      return http.response.data.message;
    }
    if (http.response.statusText) {
      return http.response.statusText;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return errorMessages[errorType];
};

export const showErrorToast = (
  error: unknown,
  fallbackMessage?: string,
): void => {
  console.error("Error:", error);

  const message = fallbackMessage || getUserFriendlyMessage(error);

  toast.error(message);
};
