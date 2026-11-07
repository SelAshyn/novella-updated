import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadBookCover } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Maximum 5MB image size (~7MB base64 encoded)
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;
// Must be an allowed raster image data URI: jpeg, jpg, png, webp (SVGs and URLs strictly blocked)
const ALLOWED_DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: NextRequest) {
  // 1. Rate limit by IP
  const ip = getClientIp(req);
  const ipRl = await rateLimit(`upload-cover-ip:${ip}`, 20, 60 * 1000);
  if (!ipRl.success) return rateLimitResponse(ipRl.retryAfter);

  try {
    // 2. Verify authentication
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Rate limit per user: max 15 uploads per minute
    const userRl = await rateLimit(`upload-cover-user:${user.id}`, 15, 60 * 1000);
    if (!userRl.success) return rateLimitResponse(userRl.retryAfter);

    // 4. Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { bookId, image } = body ?? {};

    if (!bookId || typeof bookId !== "string" || !image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Book ID and image data are required" },
        { status: 400 }
      );
    }

    // 5. Size check (protects against storage exhaustion and memory spikes)
    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowed size (5MB)" },
        { status: 413 }
      );
    }

    // 6. Format and SSRF check: MUST be a valid base64 data URI (never a remote URL or non-image)
    if (!ALLOWED_DATA_URI_PATTERN.test(image)) {
      return NextResponse.json(
        { error: "Invalid image format. Only JPEG, PNG, and WebP data URIs are allowed." },
        { status: 400 }
      );
    }

    // 7. Verify book belongs to user
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: user.id,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or access denied" },
        { status: 404 }
      );
    }

    // 8. Upload to Cloudinary
    const imageUrl = await uploadBookCover(image, bookId);

    // 9. Update book with cover image URL
    await prisma.book.update({
      where: { id: bookId },
      data: { coverImageUrl: imageUrl },
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
