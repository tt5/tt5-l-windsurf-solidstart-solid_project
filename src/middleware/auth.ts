import type { APIEvent } from '@solidjs/start/server';
import { jsonResponse } from '~/lib/server/utils';
import type { TokenPayload } from '~/lib/server/auth/jwt';
import { getAuthUser } from '~/lib/server/auth/jwt';

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
    // For SSE connections, we want to allow anonymous access but still pass the user if available
    const isSSE = event.request.headers.get('accept') === 'text/event-stream';
    
    if (isSSE) {
      // For SSE, try to get the user but don't block if not authenticated
      const user = await getAuthUser(event.request);
      if (user) {
        console.log(`[SSE] Authenticated SSE connection for user: ${user.userId}`);
        return handler({ ...event, user });
      } else {
        console.log('[SSE] Anonymous SSE connection');
        return handler({ ...event, user: { userId: 'anonymous', username: 'anonymous' } });
      }
    }
    
    // For non-SSE requests, use the regular auth flow
    const auth = await requireAuth(event);
    if ('user' in auth) {
      return handler({ ...event, user: auth.user });
    }
    return auth; // This is already a Response
  };
}
