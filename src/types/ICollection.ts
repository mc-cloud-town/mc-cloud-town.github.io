import { IImageContent } from '@/types/IImageContent.ts';

export interface ICollection extends IImageContent {
  tags?: string[];
  creator: string[];
  credits?: {
    name: string;
    url?: string;
  }[];
  date: string;
  videosUrl?: {
    url: string;
    thumbnailUrl: string;
  }[];
  galleryImagesUrl?: string[];
  introductions: string[];
  downloadUrl?: string;
}
