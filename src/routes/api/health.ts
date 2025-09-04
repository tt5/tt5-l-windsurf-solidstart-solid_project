import { APIEvent, json } from "solid-start/api";

export async function GET({ request }: APIEvent) {
  return json({ status: "ok", message: "API is healthy" });
}
