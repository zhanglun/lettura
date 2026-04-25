import { toast } from "sonner";
import { t } from "i18next";
import { AxiosError } from "axios";

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

export const getErrorType = (error: unknown): ErrorType => {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
      return ErrorType.NETWORK;
    }
    if (error.response?.status === 400 || error.response?.status === 422) {
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

  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.statusText) {
      return error.response.statusText;
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

  toast.error(message, {
    duration: 4000,
  });
};

export const showSuccessToast = (message: string): void => {
  toast.success(message);
};

export const withErrorToast = async <T>(
  promise: Promise<T>,
  fallbackMessage?: string,
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    showErrorToast(error, fallbackMessage);
    return null;
  }
};
