import { BookmarkType } from '@/types/bookmark';

/**
 * IndexedDB数据库配置
 */
const DB_NAME = 'ai-bookmark-navigator';
const DB_VERSION = 3;
const BOOKMARK_STORE = 'bookmarks';

/**
 * 打开IndexedDB数据库连接
 * @returns Promise<IDBDatabase>
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 数据库需要升级或首次创建
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      console.log(`数据库升级: ${oldVersion} -> ${DB_VERSION}`);
      
      // 创建书签对象存储
      if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
        const bookmarkStore = db.createObjectStore(BOOKMARK_STORE, { keyPath: 'id' });
        
        // 创建索引以优化查询
        bookmarkStore.createIndex('category', 'category', { unique: false });
        bookmarkStore.createIndex('createdAt', 'createdAt', { unique: false });
        bookmarkStore.createIndex('url', 'url', { unique: false });
        bookmarkStore.createIndex('title', 'title', { unique: false });
        
        console.log('书签存储及索引创建成功');
      }
      
      // 从v1升级到v2，添加新索引
      if (oldVersion < 2 && db.objectStoreNames.contains(BOOKMARK_STORE)) {
        console.log('进行v1->v2升级，添加lastVisited和visitCount索引');
        const bookmarkStore = request.transaction!.objectStore(BOOKMARK_STORE);
        
        // 添加新索引，如果不存在
        if (!bookmarkStore.indexNames.contains('lastVisited')) {
          bookmarkStore.createIndex('lastVisited', 'lastVisited', { unique: false });
        }
        
        if (!bookmarkStore.indexNames.contains('visitCount')) {
          bookmarkStore.createIndex('visitCount', 'visitCount', { unique: false });
        }
      }
      
      // 从v2升级到v3，添加isPinned和position索引
      if (oldVersion < 3 && db.objectStoreNames.contains(BOOKMARK_STORE)) {
        console.log('进行v2->v3升级，添加isPinned和position索引');
        console.log('数据库结构升级:', {newFields: ['position', 'isPinned']});
        
        const bookmarkStore = request.transaction!.objectStore(BOOKMARK_STORE);
        
        // 添加新索引，如果不存在
        if (!bookmarkStore.indexNames.contains('isPinned')) {
          bookmarkStore.createIndex('isPinned', 'isPinned', { unique: false });
        }
        
        if (!bookmarkStore.indexNames.contains('position')) {
          bookmarkStore.createIndex('position', 'position', { unique: false });
        }
        
        // 更新所有现有书签，设置默认值
        const getAllRequest = bookmarkStore.getAll();
        getAllRequest.onsuccess = () => {
          const bookmarks = getAllRequest.result;
          console.log(`准备更新${bookmarks.length}个现有书签，添加isPinned和position字段`);
          
          bookmarks.forEach((bookmark, index) => {
            // 为现有书签添加新字段
            bookmark.isPinned = false;
            bookmark.position = index;
            bookmarkStore.put(bookmark);
          });
          
          console.log('现有书签更新完成，添加了isPinned和position字段');
        };
      }
    };

    // 连接成功
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    // 连接失败
    request.onerror = (event) => {
      console.error('数据库连接失败:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * 添加或更新书签
 * @param bookmark 书签对象
 * @returns Promise<string> 书签ID
 */
export const saveBookmark = async (bookmark: BookmarkType): Promise<string> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    const request = store.put(bookmark);
    
    request.onsuccess = () => {
      resolve(bookmark.id);
    };
    
    request.onerror = (event) => {
      console.error('保存书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 批量保存书签
 * @param bookmarks 书签对象数组
 * @returns Promise<void>
 */
export const saveBookmarks = async (bookmarks: BookmarkType[]): Promise<void> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    bookmarks.forEach(bookmark => {
      store.put(bookmark);
    });
    
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    
    transaction.onerror = (event) => {
      console.error('批量保存书签失败:', transaction.error);
      reject(transaction.error);
    };
  });
};

/**
 * 获取所有书签
 * @returns Promise<BookmarkType[]>
 */
export const getAllBookmarks = async (): Promise<BookmarkType[]> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('获取书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 根据ID获取书签
 * @param id 书签ID
 * @returns Promise<BookmarkType | undefined>
 */
export const getBookmarkById = async (id: string): Promise<BookmarkType | undefined> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('获取书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 根据类别获取书签
 * @param category 书签类别
 * @returns Promise<BookmarkType[]>
 */
export const getBookmarksByCategory = async (category: string): Promise<BookmarkType[]> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const index = store.index('category');
    
    const request = index.getAll(category);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('获取书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 删除书签
 * @param id 书签ID
 * @returns Promise<void>
 */
export const deleteBookmark = async (id: string): Promise<void> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error('删除书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 清空所有书签
 * @returns Promise<void>
 */
export const clearAllBookmarks = async (): Promise<void> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOKMARK_STORE], 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);
    
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error('清空书签失败:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * 从LocalStorage迁移书签到IndexedDB
 * @returns Promise<{success: boolean, count: number}>
 */
export const migrateFromLocalStorage = async (): Promise<{success: boolean, count: number}> => {
  try {
    // 从LocalStorage获取书签
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (!savedBookmarks) {
      return { success: true, count: 0 };
    }
    
    const bookmarks: BookmarkType[] = JSON.parse(savedBookmarks);
    
    // 保存到IndexedDB
    await saveBookmarks(bookmarks);
    
    // 将LocalStorage备份但不删除
    localStorage.setItem('bookmarks_backup', savedBookmarks);
    
    return { success: true, count: bookmarks.length };
  } catch (error) {
    console.error('从LocalStorage迁移失败:', error);
    return { success: false, count: 0 };
  }
};

/**
 * 搜索书签
 * @param query 搜索关键词
 * @returns Promise<BookmarkType[]>
 */
export const searchBookmarks = async (query: string): Promise<BookmarkType[]> => {
  const allBookmarks = await getAllBookmarks();
  
  // 本地搜索过滤 - 未来可优化为使用IndexedDB的索引进行服务端过滤
  const lowerCaseQuery = query.toLowerCase();
  return allBookmarks.filter(bookmark => {
    return (
      bookmark.title.toLowerCase().includes(lowerCaseQuery) ||
      bookmark.url.toLowerCase().includes(lowerCaseQuery) ||
      (bookmark.description?.toLowerCase().includes(lowerCaseQuery)) ||
      (bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
    );
  });
};

/**
 * 更新书签访问记录
 * @param id 书签ID
 * @returns Promise<void>
 */
export const updateBookmarkVisit = async (id: string): Promise<void> => {
  try {
    // 获取书签
    const bookmark = await getBookmarkById(id);
    if (!bookmark) {
      throw new Error('书签不存在');
    }
    
    // 更新访问信息
    const updatedBookmark: BookmarkType = {
      ...bookmark,
      lastVisited: new Date().toISOString(),
      visitCount: (bookmark.visitCount || 0) + 1
    };
    
    // 保存更新后的书签
    await saveBookmark(updatedBookmark);
    
    console.log(`更新书签访问记录: ${id}, 访问次数: ${updatedBookmark.visitCount}`);
  } catch (error) {
    console.error('更新书签访问记录失败:', error);
    throw error;
  }
};

/**
 * 获取按特定字段排序的书签
 * @param sortBy 排序字段
 * @param ascending 是否升序
 * @returns Promise<BookmarkType[]>
 */
export const getSortedBookmarks = async (
  sortBy: 'createdAt' | 'title' | 'lastVisited' | 'visitCount' | 'position', 
  ascending: boolean = false
): Promise<BookmarkType[]> => {
  try {
    // 获取所有书签
    const bookmarks = await getAllBookmarks();
    
    // 日志记录
    console.log(`获取排序书签: 排序字段=${sortBy}, 升序=${ascending}`);
    
    // 首先按置顶状态排序
    const sortedBookmarks = [...bookmarks].sort((a, b) => {
      // 1. 首先按照置顶状态排序
      const isPinnedA = a.isPinned || false;
      const isPinnedB = b.isPinned || false;
      
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      
      // 2. 如果置顶状态相同，则按照指定字段排序
      let result = 0;
      
      switch (sortBy) {
        case 'title':
          result = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'createdAt':
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastVisited':
          // 如果没有访问记录，则放在最后
          if (!a.lastVisited && !b.lastVisited) result = 0;
          else if (!a.lastVisited) result = 1;
          else if (!b.lastVisited) result = -1;
          else result = new Date(a.lastVisited).getTime() - new Date(b.lastVisited).getTime();
          break;
        case 'visitCount':
          const countA = a.visitCount || 0;
          const countB = b.visitCount || 0;
          result = countA - countB;
          break;
        case 'position':
          const positionA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
          const positionB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
          result = positionA - positionB;
          break;
      }
      
      // 如果是降序，反转结果
      return ascending ? result : -result;
    });
    
    return sortedBookmarks;
  } catch (error) {
    console.error('获取排序书签失败:', error);
    throw error;
  }
};

/**
 * 切换书签的置顶状态
 * @param id 书签ID
 * @returns Promise<BookmarkType> 更新后的书签
 */
export const toggleBookmarkPin = async (id: string): Promise<BookmarkType> => {
  try {
    // 获取书签
    const bookmark = await getBookmarkById(id);
    if (!bookmark) {
      throw new Error('书签不存在');
    }
    
    // 更新置顶状态
    const updatedBookmark: BookmarkType = {
      ...bookmark,
      isPinned: !(bookmark.isPinned || false)
    };
    
    // 日志记录
    console.log('书签置顶状态更改:', {bookmarkId: id, isPinned: updatedBookmark.isPinned});
    
    // 保存更新后的书签
    await saveBookmark(updatedBookmark);
    
    return updatedBookmark;
  } catch (error) {
    console.error('切换书签置顶状态失败:', error);
    throw error;
  }
};

/**
 * 获取所有书签，并按置顶状态和位置排序
 * @returns Promise<BookmarkType[]>
 */
export const getBookmarksWithPinned = async (): Promise<BookmarkType[]> => {
  try {
    const bookmarks = await getAllBookmarks();
    
    // 按照置顶和位置排序
    return bookmarks.sort((a, b) => {
      // 1. 先按置顶状态排序
      const isPinnedA = a.isPinned || false;
      const isPinnedB = b.isPinned || false;
      
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      
      // 2. 再按照position排序（position较小的排前面）
      const positionA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
      const positionB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
      
      return positionA - positionB;
    });
  } catch (error) {
    console.error('获取带置顶的书签列表失败:', error);
    throw error;
  }
}; 