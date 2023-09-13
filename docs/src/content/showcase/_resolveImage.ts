// source: https://github.com/withastro/astro.build/blob/a30f075b315e20f44801cd454a8f915d0b1f8ee1/src/content/showcase/_resolveImage.ts

import type { ImageMetadata } from "@astrojs/image/dist/vite-plugin-astro-image.js";
import type { CollectionEntry } from "astro:content";

const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/showcase/_images/*.{png,jpg,jpeg,webp}",
);

export async function resolveImage(entry: CollectionEntry<"showcase">) {
  const src = entry.data.image;

  if (!(src in allImages)) {
    throw new Error(
      `[showcase] Image for "${entry.data.title}" not found! Provided: "${src}", is there a typo?`,
    );
  }

  const { default: image } = await allImages[src]();

  return image;
}
