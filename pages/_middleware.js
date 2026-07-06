import { NextResponse, NextRequest } from "next/server";

export async function middleware(req, ev) {
    return NextResponse.next();
}
