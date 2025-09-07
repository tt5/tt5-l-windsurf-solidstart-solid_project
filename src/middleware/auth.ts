import { APIEvent } from '@solidjs/start/server';
import { jsonResponse } from '~/lib/server/utils';
import { getAuthUser } from '~/lib/server/auth/jwt';

type AuthResponse = 
  | { user: any }  // Replace 'any' with your User type if available
  | Response;      // The error response

export async function requireAuth(event: APIEvent): Promise<AuthResponse> {
  const user = await getAuthUser(event.request);
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  return { user };
}

export function withAuth(handler: (event: APIEvent & { user: any }) => Promise<Response>) {
  return async (event: APIEvent): Promise<Response> => {
    const auth = await requireAuth(event);
    if ('error' in auth) return auth;
    return handler({ ...event, user: (auth as { user: any }).user });
  };
}
