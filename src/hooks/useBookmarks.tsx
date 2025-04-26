import { useState, useEffect, useMemo } from 'react';
import { BookmarkType } from '@/types/bookmark';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { 
  getAllBookmarks, 
  saveBookmark, 
  saveBookmarks, 
  deleteBookmark as deleteBookmarkFromDB, 
  searchBookmarks, 
  getBookmarksByCategory,
  migrateFromLocalStorage,
  getSortedBookmarks,
  getBookmarksWithPinned,
  toggleBookmarkPin
} from '@/lib/indexedDB';

// 书签数量上限增加，IndexedDB支持更多数据
const MAX_BOOKMARKS = 1000;

// 排序选项类型
export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'visits' | 'last-visited' | 'pinned';

export const useBookmarks = (searchQuery: string = '', categoryFilter: string = 'all', sortOption: SortOption = 'newest') => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrated, setIsMigrated] = useState(false);
  const { toast } = useToast();

  // 迁移LocalStorage数据到IndexedDB
  useEffect(() => {
    const performMigration = async () => {
      try {
        // 检查是否已迁移
        const migrated = localStorage.getItem('indexeddb_migration_complete');
        if (migrated === 'true') {
          setIsMigrated(true);
          return;
        }

        const result = await migrateFromLocalStorage();
        if (result.success) {
          if (result.count > 0) {
            toast({
              title: "数据迁移成功",
              description: `已成功将${result.count}个书签从LocalStorage迁移至IndexedDB。`,
            });
          }
          localStorage.setItem('indexeddb_migration_complete', 'true');
          setIsMigrated(true);
        }
      } catch (error) {
        console.error('迁移失败:', error);
        toast({
          title: "迁移失败",
          description: "无法迁移数据到IndexedDB，将继续使用LocalStorage。",
          variant: "destructive",
        });
      }
    };

    performMigration();
  }, [toast]);

  // 根据排序选项和分类从IndexedDB加载书签
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        console.log(`开始加载书签: 排序=${sortOption}, 分类=${categoryFilter}`);
        setIsLoading(true);
        
        let bookmarksData: BookmarkType[] = [];
        
        // 根据排序选项获取书签
        switch (sortOption) {
          case 'pinned':
            // 使用专门的置顶排序函数
            bookmarksData = await getBookmarksWithPinned();
            console.log('按置顶状态和位置排序');
            break;
          case 'newest':
            bookmarksData = await getSortedBookmarks('createdAt', false);
            console.log('按创建时间降序排列');
            break;
          case 'oldest':
            bookmarksData = await getSortedBookmarks('createdAt', true);
            console.log('按创建时间升序排列');
            break;
          case 'title-asc':
            bookmarksData = await getSortedBookmarks('title', true);
            console.log('按标题升序排列');
            break;
          case 'title-desc':
            bookmarksData = await getSortedBookmarks('title', false);
            console.log('按标题降序排列');
            break;
          case 'visits':
            bookmarksData = await getSortedBookmarks('visitCount', false);
            console.log('按访问次数排列');
            break;
          case 'last-visited':
            bookmarksData = await getSortedBookmarks('lastVisited', false);
            console.log('按最近访问排列');
            break;
          default:
            bookmarksData = await getSortedBookmarks('createdAt', false);
            console.log('默认排序: 按创建时间降序');
        }
        
        // 如果有分类过滤，在内存中筛选
        if (categoryFilter !== 'all') {
          bookmarksData = bookmarksData.filter(bookmark => bookmark.category === categoryFilter);
          console.log(`分类过滤: ${categoryFilter}, 剩余书签: ${bookmarksData.length}`);
        }
        
        setBookmarks(bookmarksData);
      } catch (error) {
        console.error('加载书签失败:', error);
        toast({
          title: "加载失败",
          description: "无法从数据库加载书签。",
          variant: "destructive",
        });
        
        // 尝试从LocalStorage备份加载
        const backupBookmarks = localStorage.getItem('bookmarks_backup');
        if (backupBookmarks) {
          try {
            setBookmarks(JSON.parse(backupBookmarks));
            toast({
              title: "已加载备份",
              description: "已从备份中恢复书签数据。",
            });
          } catch (error) {
            console.error('加载备份失败:', error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 仅在迁移完成后加载书签
    if (isMigrated) {
      loadBookmarks();
    }
  }, [categoryFilter, isMigrated, toast, sortOption]);

  // 处理搜索查询
  useEffect(() => {
    if (!searchQuery || !isMigrated) return;

    const performSearch = async () => {
      try {
        console.log(`执行搜索: 查询="${searchQuery}"`);
        setIsLoading(true);
        if (searchQuery.trim() === '') {
          // 如果搜索框清空，重新加载所有书签
          const allBookmarks = await getSortedBookmarks('createdAt', false); // 默认排序
          setBookmarks(allBookmarks);
        } else {
          // 否则执行搜索
          const results = await searchBookmarks(searchQuery);
          console.log(`搜索结果: ${results.length}个匹配项`);
          setBookmarks(results);
        }
      } catch (error) {
        console.error('搜索书签失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 使用防抖处理搜索
    const debounceTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, isMigrated]);

  const addBookmark = async (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => {
    try {
      const newBookmark: BookmarkType = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ...bookmark,
      };
      
      // 保存到IndexedDB
      await saveBookmark(newBookmark);
      
      // 更新状态
      setBookmarks(prev => [newBookmark, ...prev]);
      
      toast({
        title: "书签已添加",
        description: `成功添加书签: ${newBookmark.title}`,
      });
    } catch (error) {
      console.error('添加书签失败:', error);
      toast({
        title: "添加失败",
        description: "无法添加书签，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const removeBookmark = async (id: string) => {
    try {
      // 从IndexedDB删除
      await deleteBookmarkFromDB(id);
      
      // 更新状态
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      
      toast({
        title: "书签已删除",
        description: "书签已成功删除。",
      });
    } catch (error) {
      console.error('删除书签失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除书签，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const updateBookmark = async (id: string, updatedFields: Partial<BookmarkType>) => {
    try {
      // 查找并更新书签
      const bookmarkToUpdate = bookmarks.find(b => b.id === id);
      
      if (!bookmarkToUpdate) {
        throw new Error('书签不存在');
      }
      
      const updatedBookmark = { ...bookmarkToUpdate, ...updatedFields };
      
      // 保存到IndexedDB
      await saveBookmark(updatedBookmark);
      
      // 更新状态
      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark.id === id ? updatedBookmark : bookmark
        )
      );
      
      toast({
        title: "书签已更新",
        description: "书签信息已成功更新。",
      });
    } catch (error) {
      console.error('更新书签失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新书签，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const importBookmarks = async (importedBookmarks: any[]) => {
    try {
      console.log('开始导入书签:', { count: importedBookmarks.length });
      
      const formattedBookmarks = importedBookmarks.map(bookmark => ({
        id: bookmark.id || uuidv4(),
        title: bookmark.title || 'Untitled',
        url: bookmark.url,
        description: bookmark.description || '',
        category: bookmark.category || '未分类',
        tags: bookmark.tags || [],
        createdAt: bookmark.createdAt || new Date().toISOString(),
        isPinned: bookmark.isPinned || false,
        position: bookmark.position || 0,
      }));
      
      // 限制导入数量
      const limitedImportedBookmarks = formattedBookmarks.slice(0, MAX_BOOKMARKS);
      
      if (limitedImportedBookmarks.length < formattedBookmarks.length) {
        toast({
          title: "导入限制",
          description: `只导入前${MAX_BOOKMARKS}个书签以避免性能问题。`,
          variant: "destructive",
        });
      }
      
      // 保存到IndexedDB
      await saveBookmarks(limitedImportedBookmarks);
      
      // 根据当前排序重新加载书签
      let updatedBookmarks;
      if (sortOption === 'pinned') {
        updatedBookmarks = await getBookmarksWithPinned();
      } else {
        updatedBookmarks = await getSortedBookmarks('createdAt', false);
      }
      
      // 更新状态
      setBookmarks(updatedBookmarks);
      
      toast({
        title: "导入成功",
        description: `成功导入${limitedImportedBookmarks.length}个书签。`,
      });
      
      console.log('书签导入完成:', { 
        importedCount: limitedImportedBookmarks.length,
        totalBookmarks: updatedBookmarks.length,
        categories: [...new Set(limitedImportedBookmarks.map(b => b.category || '未分类'))]
      });
      
      // 重新加载书签以更新分类统计
      refreshBookmarks();
    } catch (error) {
      console.error('导入书签失败:', error);
      toast({
        title: "导入失败",
        description: "导入书签时出错，请检查文件格式并重试。",
        variant: "destructive",
      });
    }
  };

  const exportBookmarks = () => {
    const bookmarksJson = JSON.stringify(bookmarks, null, 2);
    return new Blob([bookmarksJson], { type: 'application/json' });
  };

  // 过滤书签
  const filteredBookmarks = useMemo(() => {
    // 如果已经在数据库层面过滤过，则不需要再次过滤
    if (searchQuery || categoryFilter !== 'all') {
      return bookmarks;
    }
    
    return bookmarks;
  }, [bookmarks, searchQuery, categoryFilter]);

  // 获取所有分类
  const categories = useMemo(() => {
    // 分类计数映射
    const categoryCountMap: Record<string, number> = {};
    
    // 统计各个分类的书签数量
    bookmarks.forEach(bookmark => {
      const category = bookmark.category || '未分类';
      if (categoryCountMap[category]) {
        categoryCountMap[category]++;
      } else {
        categoryCountMap[category] = 1;
      }
    });
    
    // 转换为侧边栏需要的格式
    const categoriesWithCount = Object.entries(categoryCountMap).map(([name, count]) => ({
      name,
      count
    }));
    
    // 排序分类（将"未分类"放在最后）
    return categoriesWithCount.sort((a, b) => {
      if (a.name === '未分类') return 1;
      if (b.name === '未分类') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [bookmarks]);

  // 切换书签置顶状态
  const toggleBookmarkPinStatus = async (id: string) => {
    try {
      // 使用IndexedDB函数切换置顶状态
      const updatedBookmark = await toggleBookmarkPin(id);
      
      // 更新本地状态
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.id === id ? updatedBookmark : bookmark
      ));
      
      toast({
        title: updatedBookmark.isPinned ? "书签已置顶" : "书签已取消置顶",
        description: updatedBookmark.isPinned ? 
          `已将"${updatedBookmark.title}"置顶显示` : 
          `已取消"${updatedBookmark.title}"的置顶显示`,
      });
      
      console.log('书签置顶状态更改:', {bookmarkId: id, isPinned: updatedBookmark.isPinned});
      
      return updatedBookmark;
    } catch (error) {
      console.error('切换书签置顶状态失败:', error);
      toast({
        title: "操作失败",
        description: "无法更改书签置顶状态，请稍后重试。",
        variant: "destructive",
      });
      throw error;
    }
  };

  // 刷新书签列表
  const refreshBookmarks = async () => {
    try {
      setIsLoading(true);
      
      // 根据当前的排序选项重新加载书签
      switch (sortOption) {
        case 'pinned':
          const pinnedBookmarks = await getBookmarksWithPinned();
          setBookmarks(pinnedBookmarks);
          break;
        default:
          // 使用现有的排序逻辑重新加载
          const allBookmarks = await getSortedBookmarks('createdAt', false);
          setBookmarks(allBookmarks);
      }
      
      console.log('书签列表已刷新');
    } catch (error) {
      console.error('刷新书签列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bookmarks,
    categories,
    filteredBookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    importBookmarks,
    exportBookmarks,
    toggleBookmarkPinStatus,
    refreshBookmarks
  };
};
