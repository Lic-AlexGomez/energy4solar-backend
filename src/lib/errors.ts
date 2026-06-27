export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ZohoAuthError extends AppError {
  constructor(message: string) {
    super(message, 502, "ZOHO_AUTH_ERROR")
    this.name = "ZohoAuthError"
  }
}

export class ZohoApiError extends AppError {
  constructor(
    message: string,
    public readonly zohoStatus?: number,
    public readonly payload?: unknown,
  ) {
    super(message, 502, "ZOHO_API_ERROR")
    this.name = "ZohoApiError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED")
    this.name = "UnauthorizedError"
  }
}
