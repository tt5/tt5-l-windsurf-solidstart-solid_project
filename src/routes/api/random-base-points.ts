import { APIEvent } from '@solidjs/start/server';

type BasePoint = [number, number];

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '5');
  
  // Generate random base points
  const basePoints: BasePoint[] = [];
  for (let i = 0; i < count; i++) {
    // Generate random coordinates between 0 and 9 (adjust range as needed)
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);
    basePoints.push([x, y]);
  }
  
  return new Response(JSON.stringify({ basePoints }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
