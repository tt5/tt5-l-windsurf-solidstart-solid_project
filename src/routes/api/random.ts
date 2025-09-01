import type { APIEvent } from '@solidjs/start/server';

export async function GET({ params, request }: APIEvent) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '1', 10);
  const max = parseInt(url.searchParams.get('max') || '100', 10);

  // Validate inputs
  if (isNaN(count) || count < 1 || count > 1000) {
    return Response.json(
      { error: 'Count must be between 1 and 1000' },
      { status: 400 }
    );
  }

  if (isNaN(max) || max < 1) {
    return Response.json(
      { error: 'Max must be a positive number' },
      { status: 400 }
    );
  }

  // Generate array of random numbers
  const randomNumbers = Array.from(
    { length: count },
    () => Math.floor(Math.random() * (max + 1))
  );

  return json({
    numbers: randomNumbers,
    count,
    max
  });
}
