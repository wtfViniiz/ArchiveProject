"use client";

import dynamic from "next/dynamic";

const CircularGallery = dynamic(() => import("./circular-gallery"), { ssr: false });

interface GalleryItem {
  image: string;
  text: string;
}

interface MembersGalleryProps {
  items: GalleryItem[];
}

export function MembersGallery({ items }: MembersGalleryProps) {
  return (
    <CircularGallery
      items={items}
      bend={3}
      textColor="#ffffff"
      borderRadius={0.05}
      scrollSpeed={2}
      scrollEase={0.02}
      fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
      font="bold 30px Orbitron"
    />
  );
}
