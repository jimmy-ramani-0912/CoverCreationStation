import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import sharp from "sharp";
import { db } from "@/db";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ configId: z.string().optional() }))
    .middleware(async ({ input }) => {
      return { input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const { configId } = metadata.input;

        console.log("metadata.input:", metadata.input);
        console.log("configId:", configId);
        console.log("file.url:", file.url);

        const res = await fetch(file.url);
        const buffer = await res.arrayBuffer();

        const imgMetadata = await sharp(buffer).metadata();
        const { width, height } = imgMetadata;

        // Handle the case where metadata.input is empty
        if (!configId) {
          console.log("Creating new configuration");

          const configuration = await db.configuration.create({
            data: {
              imageUrl: file.url,
              height: height || 500,
              width: width || 500,
            },
          });

          console.log("Created configuration:", configuration);
          return { configId: configuration.id };
        } else {
          console.log("Updating existing configuration");

          const updatedConfiguration = await db.configuration.update({
            where: {
              id: configId,
            },
            data: {
              croppedImageUrl: file.url,
            },
          });

          console.log("Updated configuration:", updatedConfiguration);
          return { configId: updatedConfiguration.id };
        }
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
