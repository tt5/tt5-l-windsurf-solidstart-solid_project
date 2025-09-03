import { APIEvent } from '@solidjs/start/server';

type BasePoint = [number, number];

let basePoints = [
  [1,1],
  [2,2]
]

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '5');
  
    
  return new Response(JSON.stringify({ basePoints }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
