import { NextResponse } from "next/server";

type ApiSuccessResponse<T> = { success: true; data: T };
type ApiErrorResponse = { success: false; error: string };

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function apiError(error: string, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false as const, error }, { status });
}
