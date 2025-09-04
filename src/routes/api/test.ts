import { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  return new Response(JSON.stringify({ 
    status: "success",
    message: "Test endpoint working"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
