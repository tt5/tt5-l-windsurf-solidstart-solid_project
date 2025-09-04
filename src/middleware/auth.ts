import { APIEvent } from '@solidjs/start/server';
import { json } from 'solid-start/server';
import { getAuthUser } from '~/lib/server/auth/jwt';

export async function requireAuth(event: APIEvent) {
  const user = await getAuthUser(event.request);
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { user };
}

export function withAuth(handler: (event: APIEvent & { user: any }) => Promise<Response>) {
  return async (event: APIEvent) => {
    const auth = await requireAuth(event);
    if ('error' in auth) return auth;
    return handler({ ...event, user: auth.user });
  };
}
