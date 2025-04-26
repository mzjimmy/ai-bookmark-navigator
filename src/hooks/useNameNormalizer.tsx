import { useState, useCallback, useEffect } from 'react';
import { createNameNormalizer, NameNormalizationResult } from '@/services/nameNormalizer';
import { BookmarkType } from '@/types/bookmark';

export const useNameNormalizer = () => {
  const [normalizing, setNormalizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NameNormalizationResult[]>([]);
  
  // 创建名称规范化服务实例
  const nameNormalizer = createNameNormalizer();
  
  useEffect(() => {
    console.log('useNameNormalizer钩子初始化');
    
    return () => {
      console.log('useNameNormalizer钩子卸载');
    };
  }, []);
  
  /**
   * 规范化单个书签名称
   */
  const normalizeBookmarkName = useCallback(async (
    originalName: string, 
    url?: string
  ): Promise<NameNormalizationResult> => {
    console.log('调用单个书签名称规范化:', { originalName, url });
    
    setNormalizing(true);
    setError(null);
    
    try {
      const result = await nameNormalizer.normalizeBookmarkName(originalName, url);
      
      setResults(prevResults => {
        // 替换相同原始名称的结果或添加新结果
        const existingIndex = prevResults.findIndex(r => r.originalName === originalName);
        if (existingIndex >= 0) {
          const newResults = [...prevResults];
          newResults[existingIndex] = result;
          return newResults;
        } else {
          return [...prevResults, result];
        }
      });
      
      console.log('单个书签名称规范化完成:', { 
        originalName, 
        normalizedName: result.normalizedName,
        confidence: result.confidence
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '名称规范化过程中发生未知错误';
      console.error('书签名称规范化错误:', errorMessage);
      setError(errorMessage);
      
      // 返回原始名称作为回退
      const fallbackResult: NameNormalizationResult = {
        originalName,
        normalizedName: originalName,
        description: originalName,
        websiteName: '',
        confidence: 0,
        isAlreadyNormalized: false
      };
      
      return fallbackResult;
    } finally {
      setNormalizing(false);
    }
  }, [nameNormalizer]);
  
  /**
   * 规范化多个书签名称
   */
  const normalizeBookmarkNames = useCallback(async (
    bookmarks: Array<{name: string, url?: string}> | BookmarkType[]
  ): Promise<NameNormalizationResult[]> => {
    console.log('开始批量规范化书签名称:', { count: bookmarks.length });
    
    if (bookmarks.length === 0) {
      console.log('没有书签需要规范化');
      return [];
    }
    
    setNormalizing(true);
    setProgress(0);
    setError(null);
    setResults([]);
    
    try {
      // 准备规范化的数据
      const itemsToNormalize = bookmarks.map(bookmark => {
        if ('title' in bookmark) {
          // 如果是BookmarkType
          return { name: bookmark.title, url: bookmark.url };
        }
        return bookmark;
      });
      
      // 分批处理，每批次处理5个
      const batchSize = 5;
      const results: NameNormalizationResult[] = [];
      
      for (let i = 0; i < itemsToNormalize.length; i += batchSize) {
        console.log(`处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemsToNormalize.length/batchSize)}`);
        
        const batch = itemsToNormalize.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(item => nameNormalizer.normalizeBookmarkName(item.name, item.url))
        );
        
        results.push(...batchResults);
        
        // 更新进度
        const progress = Math.min(100, Math.round((i + batch.length) / itemsToNormalize.length * 100));
        setProgress(progress);
        setResults(prevResults => [...prevResults, ...batchResults]);
        
        console.log('批量规范化进度更新:', { 
          progress, 
          processed: i + batch.length, 
          total: itemsToNormalize.length 
        });
      }
      
      console.log('批量规范化完成:', { 
        totalProcessed: results.length,
        alreadyNormalized: results.filter(r => r.isAlreadyNormalized).length,
        highConfidence: results.filter(r => r.confidence > 0.8).length
      });
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量名称规范化过程中发生未知错误';
      console.error('批量书签名称规范化错误:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setNormalizing(false);
      setProgress(100);
    }
  }, [nameNormalizer]);
  
  /**
   * 应用规范化结果到书签对象
   */
  const applyNormalization = useCallback((
    bookmark: BookmarkType, 
    result: NameNormalizationResult
  ): BookmarkType => {
    console.log('应用名称规范化结果到书签:', { 
      bookmarkId: bookmark.id, 
      originalTitle: bookmark.title,
      newTitle: result.normalizedName,
      confidence: result.confidence
    });
    
    return {
      ...bookmark,
      title: result.normalizedName
    };
  }, []);
  
  /**
   * 批量应用规范化结果到书签数组
   */
  const applyNormalizations = useCallback((
    bookmarks: BookmarkType[], 
    results: NameNormalizationResult[], 
    confidenceThreshold: number = 0.6
  ): BookmarkType[] => {
    console.log('批量应用名称规范化结果:', { 
      bookmarksCount: bookmarks.length, 
      resultsCount: results.length,
      confidenceThreshold
    });
    
    // 创建结果映射以便快速查找
    const resultMap = new Map<string, NameNormalizationResult>();
    results.forEach(result => {
      resultMap.set(result.originalName, result);
    });
    
    // 应用规范化结果
    const updatedBookmarks = bookmarks.map(bookmark => {
      const result = resultMap.get(bookmark.title);
      
      if (result && result.confidence >= confidenceThreshold) {
        return {
          ...bookmark,
          title: result.normalizedName
        };
      }
      
      return bookmark;
    });
    
    console.log('批量应用名称规范化完成:', { 
      updatedCount: updatedBookmarks.filter((b, i) => b.title !== bookmarks[i].title).length,
      totalCount: bookmarks.length
    });
    
    return updatedBookmarks;
  }, []);
  
  /**
   * 清除所有规范化结果并重置状态
   */
  const clearResults = useCallback(() => {
    console.log('清除名称规范化结果', { previousResultsCount: results.length });
    setResults([]);
    setProgress(0);
    setError(null);
    nameNormalizer.clearCache();
  }, [nameNormalizer, results.length]);

  return {
    normalizing,
    progress,
    error,
    results,
    normalizeBookmarkName,
    normalizeBookmarkNames,
    applyNormalization,
    applyNormalizations,
    clearResults
  };
}; 