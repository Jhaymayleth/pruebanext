export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type SessionStatus = "loading" | "authenticated" | "anonymous";

export type SessionSnapshot = {
  status: SessionStatus;
  user: SessionUser | null;
};

const SERVER_SNAPSHOT: SessionSnapshot = Object.freeze({
  status: "loading",
  user: null,
});

let snapshot: SessionSnapshot = SERVER_SNAPSHOT;
let listeners: Array<() => void> = [];
let inFlight: Promise<void> | null = null;

function publish(next: SessionSnapshot) {
  if (
    next.status === snapshot.status &&
    next.user?.id === snapshot.user?.id &&
    next.user?.role === snapshot.user?.role
  ) {
    return;
  }

  snapshot = next;

  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

export function getSnapshot(): SessionSnapshot {
  return snapshot;
}

export function getServerSnapshot(): SessionSnapshot {
  return SERVER_SNAPSHOT;
}

async function readUser(response: Response): Promise<SessionUser | null> {
  if (!response.ok) {
    return null;
  }

  try {
    const payload = (await response.json()) as { user?: SessionUser | null };
    return payload.user ?? null;
  } catch {
    return null;
  }
}

export function syncSession(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const current = await fetch("/api/auth/me", { cache: "no-store" });
      const currentUser = await readUser(current);

      if (currentUser) {
        publish({ status: "authenticated", user: currentUser });
        return;
      }

      const refreshed = await fetch("/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
      });
      const renewedUser = await readUser(refreshed);

      if (renewedUser) {
        publish({ status: "authenticated", user: renewedUser });
        return;
      }

      publish({ status: "anonymous", user: null });
    } catch {
      publish({ status: "anonymous", user: null });
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function endSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });
  } finally {
    publish({ status: "anonymous", user: null });
  }
}