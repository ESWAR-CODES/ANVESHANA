export interface GalleryImage {
  publicId: string;
  url: string;
  caption?: string;
  altText?: string;
  displayOrder: number;
}

export interface EventGalleryWinner {
  position: string;
  name: string;
  project?: string;
}

export interface EventGalleryData {
  event: {
    id: string;
    title: string;
    slug: string;
    eventDate?: string;
  };
  title?: string;
  eventDate?: string;
  shortSummary?: string;
  fullStory?: string;
  challenges?: string;
  highlights?: string[];
  winners?: EventGalleryWinner[];
  coverImage?: { publicId: string; url: string } | null;
  images: GalleryImage[];
}

export interface AdminEventGalleryData {
  eventId: string;
  eventTitle: string;
  title?: string;
  eventDate?: string;
  shortSummary?: string;
  fullStory?: string;
  challenges?: string;
  highlights?: string[];
  winners?: EventGalleryWinner[];
  coverImage?: { publicId: string; url: string } | null;
  images: GalleryImage[];
}
