import { NextResponse } from "next/server";
import { applyDoorEnv, readOffersFile } from "@/lib/frontDoor/loadOffers";
import { decideAdmission } from "@/lib/frontDoor/traffic";

export async function POST() {
  const offers = applyDoorEnv(readOffersFile());
  const id = crypto.randomUUID();
  const decision = decideAdmission(offers, id);
  const response = NextResponse.json({
    visitor_key: id,
    admitted: decision.admitted,
  });
  response.cookies.set("fd_visitor", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/front-door",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
