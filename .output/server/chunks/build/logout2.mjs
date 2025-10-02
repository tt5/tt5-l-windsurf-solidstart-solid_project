import { serialize } from 'cookie';

async function n({ request: s }) {
  const e = serialize("auth_token", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", expires: /* @__PURE__ */ new Date(0) });
  return new Response(JSON.stringify({ success: true, message: "Successfully logged out" }), { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": e } });
}

export { n as POST };
//# sourceMappingURL=logout2.mjs.map
