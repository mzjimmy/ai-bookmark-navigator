
import { useState, useEffect, useMemo } from 'react';
import { BookmarkType } from '@/types/bookmark';
import { v4 as uuidv4 } from 'uuid';

export const useBookmarks = (searchQuery: string = '', categoryFilter: string = 'all') => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);

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
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => {
    const newBookmark: BookmarkType = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...bookmark,
    };
    
    setBookmarks(prev => [newBookmark, ...prev]);
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
    
    setBookmarks(prev => [...formattedBookmarks, ...prev]);
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
