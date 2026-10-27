export const BUSINESS_TIMEZONE = "America/Bogota";

export const BOOKING_MIN_HOUR = 7;
export const BOOKING_MAX_HOUR = 21;

export const BOOKING_MIN_HOURS = 1;
export const BOOKING_MAX_HOURS = 4;

export const BOOKING_MAX_ADVANCE_DAYS = 30;

export const BOOKING_MAX_FUTURE_RESERVATIONS = 3;

export const BOOKING_MIN_CANCELLATION_HOURS = 2;

const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const MINUTES_PER_HOUR = 60;

export type BookingErrorCode =
  | "SPACE_NOT_AVAILABLE"
  | "SPACE_ALREADY_RESERVED"
  | "USER_ALREADY_RESERVED"
  | "FUTURE_LIMIT_REACHED";

export class BookingRuleError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingRuleError";
    this.code = code;
  }
}

export type BookingField = "startAt" | "endAt";

export type BookingViolation = {
  path: BookingField;
  message: string;
};

type BusinessTimeParts = {
  hour: number;
  minute: number;
  second: number;
};

const businessTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIMEZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function readTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: "hour" | "minute" | "second",
): number {
  const value = parts.find((part) => part.type === type)?.value;

  return Number(value ?? "0");
}

export function getBusinessTimeParts(date: Date): BusinessTimeParts {
  const parts = businessTimeFormatter.formatToParts(date);

  return {
    hour: readTimePart(parts, "hour") % 24,
    minute: readTimePart(parts, "minute"),
    second: readTimePart(parts, "second"),
  };
}

export function getBusinessMinuteOfDay(date: Date): number {
  const { hour, minute } = getBusinessTimeParts(date);

  return hour * MINUTES_PER_HOUR + minute;
}

export function isWholeHour(date: Date): boolean {
  const { minute, second } = getBusinessTimeParts(date);

  return minute === 0 && second === 0 && date.getMilliseconds() === 0;
}

export function getDurationInHours(startAt: Date, endAt: Date): number {
  return (endAt.getTime() - startAt.getTime()) / MILLISECONDS_PER_HOUR;
}

export function getCancellationDeadline(startAt: Date): Date {
  return new Date(
    startAt.getTime() -
      BOOKING_MIN_CANCELLATION_HOURS * MILLISECONDS_PER_HOUR,
  );
}

export function canUserCancel(startAt: Date, now: Date = new Date()): boolean {
  return now.getTime() <= getCancellationDeadline(startAt).getTime();
}

function formatHour(hour: number): string {
  return String(hour).padStart(2, "0");
}

export function validateBookingSlot(
  startAt: Date,
  endAt: Date,
  now: Date = new Date(),
): BookingViolation | null {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return {
      path: "endAt",
      message: "Las fechas de la reserva no son válidas.",
    };
  }

  if (endAt.getTime() <= startAt.getTime()) {
    return {
      path: "endAt",
      message: "La fecha de finalización debe ser posterior a la de inicio.",
    };
  }

  if (!isWholeHour(startAt)) {
    return {
      path: "startAt",
      message: "La reserva debe iniciar en una hora exacta, por ejemplo 10:00.",
    };
  }

  if (!isWholeHour(endAt)) {
    return {
      path: "endAt",
      message:
        "La reserva debe terminar en una hora exacta, por ejemplo 12:00.",
    };
  }

  const durationHours = getDurationInHours(startAt, endAt);

  if (
    !Number.isInteger(durationHours) ||
    durationHours < BOOKING_MIN_HOURS ||
    durationHours > BOOKING_MAX_HOURS
  ) {
    return {
      path: "endAt",
      message: `La reserva debe durar entre ${BOOKING_MIN_HOURS} y ${BOOKING_MAX_HOURS} horas completas.`,
    };
  }

  if (startAt.getTime() <= now.getTime()) {
    return {
      path: "startAt",
      message: "La reserva debe comenzar en una fecha futura.",
    };
  }

  if (
    startAt.getTime() >
    now.getTime() + BOOKING_MAX_ADVANCE_DAYS * MILLISECONDS_PER_DAY
  ) {
    return {
      path: "startAt",
      message: `No se puede reservar con más de ${BOOKING_MAX_ADVANCE_DAYS} días de anticipación.`,
    };
  }

  const startMinuteOfDay = getBusinessMinuteOfDay(startAt);
  const endMinuteOfDay = getBusinessMinuteOfDay(endAt);
  const openingMinute = BOOKING_MIN_HOUR * MINUTES_PER_HOUR;
  const closingMinute = BOOKING_MAX_HOUR * MINUTES_PER_HOUR;
  const windowMessage = `Solo se puede reservar entre las ${formatHour(BOOKING_MIN_HOUR)}:00 y las ${formatHour(BOOKING_MAX_HOUR)}:00.`;

  if (startMinuteOfDay < openingMinute) {
    return { path: "startAt", message: windowMessage };
  }

  if (endMinuteOfDay > closingMinute || endMinuteOfDay <= startMinuteOfDay) {
    return { path: "endAt", message: windowMessage };
  }

  return null;
}
