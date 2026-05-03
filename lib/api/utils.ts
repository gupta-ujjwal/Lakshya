import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export function validateBody<T extends z.ZodType>(
  schema: T,
  request: NextRequest
): Promise<z.infer<T>> {
  return request.json().then((body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.errors);
    }
    return result.data;
  });
}

export function parseQueryParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> | null {
  const params: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const result = schema.safeParse(params);
  if (!result.success) {
    return null;
  }
  return result.data;
}

export type ValidationErrorDetail = {
  path: (string | number)[];
  message: string;
};

export class ValidationError extends Error {
  constructor(public errors: ValidationErrorDetail[]) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.errors },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}