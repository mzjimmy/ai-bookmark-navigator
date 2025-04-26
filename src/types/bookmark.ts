export interface BookmarkType {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  lastVisited?: string;
  visitCount?: number;
  isPinned?: boolean;
  position?: number;
}
