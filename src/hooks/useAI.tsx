import { useState } from 'react';
import { BookmarkType } from '@/types/bookmark';
import { OpenRouterClient, createOpenRouterClient } from '@/services/openRouter';

export const useAI = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    categories?: { name: string; count: number }[];
    topDomains?: { domain: string; count: number }[];
    insights?: string[];
    categoryRecommendations?: { bookmarkId: string; categories: string[] }[];
  }>({});

  // 创建OpenRouter客户端实例
  const openRouter = createOpenRouterClient();

  const analyzeBookmarks = async (bookmarks: BookmarkType[]) => {
    if (bookmarks.length === 0) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      console.log('开始AI分析书签:', { bookmarkCount: bookmarks.length });
      
      // 从传入的书签数据中提取分析所需的数据
      const bookmarksToAnalyze = bookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category || '未分类',
        description: bookmark.description,
        tags: bookmark.tags,
      }));
      
      // 调用OpenRouter API进行真实AI分析
      const analysisResult = await openRouter.analyzeBookmarks(bookmarksToAnalyze);
      console.log('AI分析结果:', { responseData: analysisResult, processingTime: Date.now() });
      
      // 根据AI分析结果格式化数据
      // 这部分可能需要根据实际API返回结果进行调整
      try {
        // 尝试解析AI返回的结果
        // 在实际实现中，我们可能需要添加更复杂的解析逻辑
        // 或者修改AI提示让它返回特定格式的JSON
        
        // 计算分类数据
        const categoryMap: Record<string, number> = {};
        bookmarks.forEach(bookmark => {
          const category = bookmark.category || '未分类';
          categoryMap[category] = (categoryMap[category] || 0) + 1;
        });
        
        const categories = Object.entries(categoryMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        // 计算顶级域名
        const domainMap: Record<string, number> = {};
        bookmarks.forEach(bookmark => {
          try {
            const url = new URL(bookmark.url);
            const domain = url.hostname.replace('www.', '');
            domainMap[domain] = (domainMap[domain] || 0) + 1;
          } catch (error) {
            // 处理无效URL
          }
        });
        
        const topDomains = Object.entries(domainMap)
          .map(([domain, count]) => ({ domain, count }))
          .sort((a, b) => b.count - a.count);
        
        // 使用AI返回的分析作为洞察
        const insights = [analysisResult];
        
        // 提取AI建议的分类推荐
        // 这里简化处理，实际应根据AI返回格式调整
        const categoryRecommendations = bookmarks
          .filter(b => b.category === '未分类' || !b.category)
          .slice(0, 5)
          .map(bookmark => ({
            bookmarkId: bookmark.id,
            categories: suggestCategoriesForBookmark(bookmark, categories.map(c => c.name)),
          }));
        
        setAiSuggestions({
          categories,
          topDomains,
          insights,
          categoryRecommendations,
        });
      } catch (parseError) {
        console.error('解析AI分析结果错误:', parseError);
        // 即使解析失败，也至少展示原始AI输出
        setAiSuggestions({
          insights: [analysisResult],
        });
      }
    } catch (error) {
      console.error('AI分析错误:', error);
      setError(error instanceof Error ? error.message : '分析过程中发生未知错误');
    } finally {
      setAnalyzing(false);
    }
  };

  // 辅助函数，为未分类的书签生成一些可能的分类
  const suggestCategoriesForBookmark = (bookmark: BookmarkType, existingCategories: string[]): string[] => {
    const title = bookmark.title.toLowerCase();
    const url = bookmark.url.toLowerCase();
    
    const keywords: Record<string, string[]> = {
      '技术': ['github', 'stack', 'dev', 'code', 'tech', '技术', '编程', '开发'],
      '学习': ['learn', 'course', 'edu', 'tutorial', '教程', '学习', '课程'],
      '生活': ['life', 'shop', 'food', 'travel', '生活', '美食', '旅行'],
      '工作': ['work', 'job', 'career', 'office', '工作', '职业', '办公'],
      '娱乐': ['game', 'movie', 'music', 'video', '游戏', '电影', '音乐'],
    };
    
    // 使用已存在的分类
    const suggestions: string[] = [...existingCategories]
      .filter(category => category !== '未分类')
      .slice(0, 2);
    
    // 基于关键词增加建议
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => title.includes(word) || url.includes(word))) {
        if (!suggestions.includes(category)) {
          suggestions.push(category);
        }
      }
    }
    
    // 如果没有找到合适的分类，返回一个默认分类
    if (suggestions.length === 0) {
      suggestions.push('其他');
    }
    
    return suggestions.slice(0, 3);
  };

  return {
    analyzing,
    error,
    aiSuggestions,
    analyzeBookmarks,
  };
};
