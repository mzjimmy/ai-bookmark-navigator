
import { useState } from 'react';
import { BookmarkType } from '@/types/bookmark';

export const useAI = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    categories?: { name: string; count: number }[];
    topDomains?: { domain: string; count: number }[];
    insights?: string[];
    categoryRecommendations?: { bookmarkId: string; categories: string[] }[];
  }>({});

  const analyzeBookmarks = async (bookmarks: BookmarkType[]) => {
    if (bookmarks.length === 0) return;
    
    setAnalyzing(true);
    
    try {
      // 在真实情况下，这里会调用一个AI API，但目前我们模拟AI分析结果
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      // 生成洞察
      const insights = [
        `您的书签集中在 ${categories[0]?.name} 和 ${categories[1]?.name} 领域，显示出您的主要关注点。`,
        `您最常访问的网站是 ${topDomains[0]?.domain}，占您所有书签的 ${Math.round(topDomains[0]?.count * 100 / bookmarks.length)}%。`,
        `有 ${bookmarks.filter(b => !b.description).length} 个书签缺少描述，添加描述可以提高搜索效果。`,
        `根据您的浏览模式，您可能对 ${generateRandomInterests(categories)} 相关内容感兴趣。`,
      ];
      
      // 生成分类推荐
      const categoryRecommendations = bookmarks
        .filter(b => b.category === '未分类' || !b.category)
        .slice(0, 3)
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
    } catch (error) {
      console.error('AI分析错误:', error);
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
  
  // 根据分类生成可能的兴趣
  const generateRandomInterests = (categories: { name: string; count: number }[]): string => {
    const interests = {
      '技术': ['开源项目', '编程语言', '软件开发'],
      '学习': ['在线课程', '技能提升', '知识管理'],
      '生活': ['健康生活', '美食烹饪', '旅游攻略'],
      '工作': ['职业发展', '效率工具', '远程工作'],
      '娱乐': ['流媒体内容', '游戏', '音乐发现'],
      '其他': ['个人成长', '时间管理', '社交网络'],
    };
    
    const categoryNames = categories.map(c => c.name);
    let result = [];
    
    for (const category of categoryNames) {
      const options = interests[category as keyof typeof interests] || interests['其他'];
      if (options) {
        result.push(options[Math.floor(Math.random() * options.length)]);
        if (result.length >= 2) break;
      }
    }
    
    return result.join('和');
  };

  return {
    analyzing,
    aiSuggestions,
    analyzeBookmarks,
  };
};
