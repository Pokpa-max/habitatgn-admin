import { NextResponse, NextRequest } from "next/server";

export async function middleware(req, ev) {
    const { pathname } = req.nextUrl;
    if (pathname === "/settings") {
        const url = req.nextUrl.clone();
        url.pathname = `${pathname}/categories`;
        return NextResponse.redirect(url);
    }
    if (pathname == "/users") {
        const url = req.nextUrl.clone();
        url.pathname = `${pathname}/customers`;
        return NextResponse.redirect(url);

    }

    return NextResponse.next();
}
