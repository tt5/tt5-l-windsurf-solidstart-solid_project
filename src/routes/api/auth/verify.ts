import { getAuthUser } from '~/lib/server/auth/jwt';
import { jsonResponse } from '~/lib/server/utils';

export const GET = async ({ request }: { request: Request }) => {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return jsonResponse({ valid: false }, 200);
    }

    return jsonResponse({
      valid: true,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return jsonResponse({ valid: false }, 200);
  }
};
