import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const videoUrl = request.nextUrl.searchParams.get("url");

    if (!videoUrl) {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    const response = await fetch(videoUrl, {
      headers: {
        "Range": request.headers.get("Range") || "",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch video" }, { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    headers.set("Accept-Ranges", "bytes");

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const range = request.headers.get("Range");
    if (range) {
      headers.set("Content-Range", response.headers.get("Content-Range") || "");
      return new NextResponse(response.body, {
        status: 206,
        headers,
      });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return NextResponse.json(
      { message: "Error proxying video" },
      { status: 500 }
    );
  }
}
