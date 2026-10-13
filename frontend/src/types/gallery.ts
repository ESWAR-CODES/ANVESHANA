export interface GalleryImage {
  publicId: string;
  url: string;
  caption?: string;
  displayOrder: number;
}

export interface EventGalleryData {
  event: {
    id: string;
    title: string;
    slug: string;
    eventDate?: string;
  };
  images: GalleryImage[];
}

export interface AdminEventGalleryData {
  eventId: string;
  eventTitle: string;
  images: GalleryImage[];
}
