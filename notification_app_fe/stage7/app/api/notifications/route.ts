import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const SOURCE_URL =
  "http://4.224.186.213/evaluation-service/notifications";

const getToken = () => {
  const envToken =
    process.env.NOTIFICATIONS_API_TOKEN?.trim() ||
    process.env.BEARER_TOKEN?.trim();

  if (envToken) {
    return envToken;
  }

  try {
    const middlewarePath = path.resolve(
      process.cwd(),
      "../../logging_middleware/src/.env"
    );
    const contents = readFileSync(middlewarePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();

      if (key === "BEARER_TOKEN") {
        return value;
      }
    }
  } catch {
    // File not found or unreadable; fall through
  }

  return "";
};

export async function GET(request: NextRequest) {
  const token = getToken();

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Missing BEARER_TOKEN in server environment or logging_middleware/.env"
      },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL(SOURCE_URL);
  upstreamUrl.search = request.nextUrl.search;

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(request.headers.get("x-user-id")
        ? { "X-User-Id": request.headers.get("x-user-id") as string }
        : {})
    },
    cache: "no-store"
  });

  const contentType =
    upstreamResponse.headers.get("content-type") ?? "application/json";
  const body = await upstreamResponse.text();

  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: {
      "content-type": contentType
    }
  });
}
