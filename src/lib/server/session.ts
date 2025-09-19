import { APIEvent } from 'solid-start';
import { getSession } from '@solid-mediakit/auth';
import { authOptions } from '~/server/auth';

export async function requireUser(event: APIEvent) {
  const session = await getSession(event.request, authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  return session.user;
}
