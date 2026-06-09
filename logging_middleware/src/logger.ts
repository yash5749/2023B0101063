import axios from "axios";
import type {
  Level,
  PackageByStack,
  Stack
} from "./types";

const BASE_URL =
  "http://4.224.186.213/evaluation-service/logs";

let token = process.env.BEARER_TOKEN ?? "";

export const initializeLogger = (
  accessToken: string
) => {
  token = accessToken.trim();
};

type LogSuccessResponse = {
  logID: string;
  message: string;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : undefined;

    return apiMessage ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown logging error";
};

export const Log = async <TStack extends Stack>(
  stack: TStack,
  level: Level,
  packageName: PackageByStack[TStack],
  message: string
) : Promise<LogSuccessResponse> => {
  if (!token) {
    throw new Error(
      "Logger token is missing. Set BEARER_TOKEN or call initializeLogger()."
    );
  }

  try {
    const response = await axios.post(
      BASE_URL,
      {
        stack,
        level,
        package: packageName,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Log request failed: ${getErrorMessage(error)}`);
  }
};
