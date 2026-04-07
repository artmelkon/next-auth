import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SECRET_KEY;
if (!secretKey) throw new Error("Missing SECRET_KEY environment variable");
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    // use a short expiration (20 seconds)
    .setExpirationTime("20s")
    .sign(key);
}
export async function decrypt(token: string): Promise<any | null> {
  // Validate token input strictly: must be a non-empty string
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (err: any) {
    // If the token is expired or otherwise invalid, return null so callers
    // can handle unauthenticated state instead of crashing the app.
    // jose throws an error with name 'JWTExpired' for expired tokens.
    if (err?.name === "JWTExpired" || err?.name === "JOSEError") {
      return null;
    }
    // Re-throw unexpected errors so they can be observed during development.
    throw err;
  }
}
export async function login(formatData: FormData): Promise<any> {
  // In a real application, you would validate the user credentials here
  const user = { email: formatData.get("email") as string, name: "Demo User" };

  // For demonstration, we create a simple session object
  const expires = new Date(Date.now() + 20 * 1000); // 20 seconds from now
  const session = await encrypt({ user, expires });

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set("session", session, { httpOnly: true, path: "/" });
}
export async function logout() {
  // Clear the session cookie
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
}
export async function getSession() {
  // Read the `session` cookie value and return the decrypted payload (or null)
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("session")?.value;
  if (!sessionValue) return null;
  return await decrypt(sessionValue);
}
export async function updateSession(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) return;
  const parsed = await decrypt(sessionCookie);
  // If the token is expired/invalid, decrypt returns null — nothing to update.
  if (!parsed) return;

  const expiresDate = new Date(Date.now() + 20 * 1000); // Extend expiration by 20 seconds
  parsed.expires = expiresDate;
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: expiresDate,
  });
  return res;
}
