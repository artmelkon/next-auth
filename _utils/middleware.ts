import { NextRequest } from "next/server";
import { updateSession } from "./auth";

export async function middleware(req: NextRequest) {
  return await updateSession(req);
}
