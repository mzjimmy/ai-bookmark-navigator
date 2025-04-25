import { useState, useEffect, useMemo } from 'react';
import { BookmarkType } from '@/types/bookmark';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

const MAX_BOOKMARKS = 100;

export const useBookmarks = (searchQuery: string = '', categoryFilter: string = 'all') => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load bookmarks from localStorage on mount
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save bookmarks to localStorage whenever they change
    try {
      // Limit the number of bookmarks to prevent exceeding quota
      const limitedBookmarks = bookmarks.slice(0, MAX_BOOKMARKS);
      
      if (limitedBookmarks.length < bookmarks.length) {
        toast({
          title: "警告",
          description: `书签数量已超过${MAX_BOOKMARKS}个，只保存最新的${MAX_BOOKMARKS}个书签。`,
          variant: "destructive",
        });
        // Update state with limited bookmarks
        setBookmarks(limitedBookmarks);
        return;
      }
      
      localStorage.setItem('bookmarks', JSON.stringify(limitedBookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      toast({
        title: "存储错误",
        description: "无法保存书签到本地存储，请尝试减少书签数量或清理其他网站的存储空间。",
        variant: "destructive",
      });
    }
  }, [bookmarks, toast]);

  const addBookmark = (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => {
    const newBookmark: BookmarkType = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...bookmark,
    };
    
    setBookmarks(prev => {
      // Ensure we don't exceed the maximum number of bookmarks
      const updatedBookmarks = [newBookmark, ...prev];
      if (updatedBookmarks.length > MAX_BOOKMARKS) {
        return updatedBookmarks.slice(0, MAX_BOOKMARKS);
      }
      return updatedBookmarks;
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  const updateBookmark = (id: string, updatedFields: Partial<BookmarkType>) => {
    setBookmarks(prev => 
      prev.map(bookmark => 
        bookmark.id === id ? { ...bookmark, ...updatedFields } : bookmark
      )
    );
  };

  const importBookmarks = (importedBookmarks: any[]) => {
    const formattedBookmarks = importedBookmarks.map(bookmark => ({
      id: bookmark.id || uuidv4(),
      title: bookmark.title || 'Untitled',
      url: bookmark.url,
      description: bookmark.description || '',
      category: bookmark.category || '未分类',
      tags: bookmark.tags || [],
      createdAt: bookmark.createdAt || new Date().toISOString(),
    }));
    
    // Limit the number of imported bookmarks to prevent quota issues
    const limitedImportedBookmarks = formattedBookmarks.slice(0, MAX_BOOKMARKS);
    
    if (limitedImportedBookmarks.length < formattedBookmarks.length) {
      toast({
        title: "导入限制",
        description: `只导入前${MAX_BOOKMARKS}个书签以避免存储空间不足。`,
        variant: "warning",
      });
    }
    
    setBookmarks(prev => {
      const combined = [...limitedImportedBookmarks, ...prev];
      return combined.slice(0, MAX_BOOKMARKS);
    });
  };

  const exportBookmarks = () => {
    const bookmarksJson = JSON.stringify(bookmarks, null, 2);
    return new Blob([bookmarksJson], { type: 'application/json' });
  };

  // Compute categories
  const categories = useMemo(() => {
    const categoryMap = bookmarks.reduce((acc, bookmark) => {
      const category = bookmark.category || '未分类';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryMap).map(([name, count]) => ({ 
      name, 
      count 
    })).sort((a, b) => b.count - a.count);
  }, [bookmarks]);

  // Filter bookmarks based on search query and category
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const matchesSearch = 
        !searchQuery || 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bookmark.tags?.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        bookmark.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [bookmarks, searchQuery, categoryFilter]);

  return {
    bookmarks,
    categories,
    filteredBookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    importBookmarks,
    exportBookmarks,
  };
};
