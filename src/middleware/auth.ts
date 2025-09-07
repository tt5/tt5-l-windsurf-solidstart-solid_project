import { APIEvent } from '@solidjs/start/server';
import { jsonResponse } from '~/lib/server/utils';
import { getAuthUser, TokenPayload } from '~/lib/server/auth/jwt';

type AuthResponse = 
  | { user: TokenPayload }
  | Response;

export async function requireAuth(event: APIEvent): Promise<AuthResponse> {
  const user = await getAuthUser(event.request);
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  return { user };
}

export function withAuth(handler: (event: APIEvent & { user: TokenPayload }) => Promise<Response>) {
  return async (event: APIEvent): Promise<Response> => {
    const auth = await requireAuth(event);
    if ('error' in auth) return auth;
    return handler({ ...event, user: auth.user });
  };
}
