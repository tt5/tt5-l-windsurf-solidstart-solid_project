import { APIEvent } from "@solidjs/start/server";
import { jsonResponse } from '~/lib/server/utils';

export async function POST({ request }: APIEvent) {
  // This endpoint can be used for any server-side cleanup
  // when a user logs out
  return jsonResponse({ success: true });
}
