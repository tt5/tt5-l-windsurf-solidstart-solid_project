import { APIEvent, json } from "@solidjs/start/server";

export function GET({ request }: APIEvent) {
  return json({ message: "Test endpoint is working!" });
}
