// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return apiError("No file provided");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Détecter le type de ressource
    const resourceType = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : "raw";

    // Upload vers Cloudinary via stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: "nextalk",
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });

    console.log("✅ Cloudinary upload success:", result.secure_url);

    return apiResponse({
      url: result.secure_url,
      key: result.public_id,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error("Upload error:", err.message);
    return apiError(`Upload failed: ${err.message}`, 500);
  }
}
