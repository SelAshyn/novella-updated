import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// Helper function to upload image from base64
export async function uploadBookCover(base64Image: string, bookId: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "novella/book-covers",
      public_id: `book-${bookId}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 400, height: 600, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

// Helper function to delete image
export async function deleteBookCover(bookId: string) {
  try {
    await cloudinary.uploader.destroy(`novella/book-covers/book-${bookId}`);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

// Generate Cloudinary upload signature for client-side uploads
export function generateUploadSignature(folder: string = "novella/book-covers") {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    transformation: "w_400,h_600,c_fill,g_auto/q_auto,f_auto",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}
