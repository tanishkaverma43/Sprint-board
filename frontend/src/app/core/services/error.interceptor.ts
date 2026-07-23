import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from './notification.service';

/**
 * Functional HTTP interceptor that surfaces a friendly toast for every failed
 * API call while still propagating the error so callers can react locally.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      notifications.error(extractMessage(error));
      return throwError(() => error);
    })
  );
};

function extractMessage(error: HttpErrorResponse): string {
  const body = error.error;

  if (body?.details && Array.isArray(body.details) && body.details.length > 0) {
    return body.details.join(' ');
  }

  if (typeof body?.message === 'string' && body.message.trim()) {
    return body.message;
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection.';
  }

  if (error.status === 400) {
    return 'Validation failed. Please check the form and try again.';
  }

  return `Request failed (${error.status}). Please try again.`;
}
