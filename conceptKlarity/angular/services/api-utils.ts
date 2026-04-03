import { HttpErrorResponse } from '@angular/common/http';

export function formatHttpError(err: HttpErrorResponse | any, fallback = 'Request failed'): string {
  if (!err) return fallback;
  if (err.status === 0) return 'Network error — cannot reach server';
  if (err.status === 401 || err.status === 403) return 'Unauthorized — please login';
  if (err.status === 400) return 'Invalid request (bad input)';
  if (err.status >= 500) return 'Server error — try again later';
  return fallback;
}
