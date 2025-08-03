export interface MusicMetadataInterface {
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  release_date: string;
  language: string;
  tags: string[];
  mood: string;
  lyrics: Array<{ time: number; text: string }>;
  cover_url: string;
  created_at: Date;
  updated_at: Date;
}