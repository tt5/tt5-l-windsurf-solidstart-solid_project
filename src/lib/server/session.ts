import { APIEvent } from 'solid-start';
import * as jwt from 'jsonwebtoken';
import type { User } from '~/types/user';

declare module 'jsonwebtoken' {
  interface JwtPayload {
    user: User;
  }
}

export async function requireUser(event: APIEvent): Promise<User> {
  const authHeader = event.request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as jwt.JwtPayload;
    if (!decoded.user) {
      throw new Error('Invalid token payload');
    }
    return decoded.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}
