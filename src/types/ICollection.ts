import { IImageContent } from '@/types/IImageContent.ts';

export interface ICollection extends IImageContent {
  tags?: string[];
  creator: string[];
  date: string;
  videosUrl?: string[];
  galleryImagesUrl?: string[];
  introductions: string[];
  downloadUrl?: string;
}
