import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// favicon缓存
const faviconCache: Record<string, string> = {};

export function getFaviconUrl(url: string): string {
  try {
    // 检查是否已经有缓存
    const hostname = new URL(url).hostname;
    
    // 如果在内存缓存中存在
    if (faviconCache[hostname]) {
      return faviconCache[hostname];
    }
    
    // 检查localStorage缓存
    const cachedFavicons = localStorage.getItem('favicon_cache');
    if (cachedFavicons) {
      try {
        const cache = JSON.parse(cachedFavicons);
        if (cache[hostname]) {
          // 更新内存缓存
          faviconCache[hostname] = cache[hostname];
          return cache[hostname];
        }
      } catch (e) {
        // 解析错误，忽略缓存
        console.error('解析favicon缓存失败:', e);
      }
    }
    
    const parsedUrl = new URL(url);
    
    // 尝试多种 favicon 获取方式
    // 1. 使用Google的favicon服务（已知可能会有404错误）
    // return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    
    // 2. 直接从网站根目录获取favicon (更可靠但也可能失败)
    const faviconUrl = `${parsedUrl.origin}/favicon.ico`;
    
    // 注意：这两种方法都可能失败，但我们在组件中使用onError处理了失败情况
    return faviconUrl;
  } catch (error) {
    // 如果URL解析失败，返回占位图
    return '/placeholder.svg';
  }
}

// 缓存favicon URL
export function cacheFaviconUrl(url: string, faviconUrl: string): void {
  try {
    const hostname = new URL(url).hostname;
    
    // 更新内存缓存
    faviconCache[hostname] = faviconUrl;
    
    // 更新localStorage缓存
    try {
      const cachedFavicons = localStorage.getItem('favicon_cache') || '{}';
      const cache = JSON.parse(cachedFavicons);
      cache[hostname] = faviconUrl;
      localStorage.setItem('favicon_cache', JSON.stringify(cache));
    } catch (e) {
      console.error('更新favicon缓存失败:', e);
    }
  } catch (error) {
    console.error('缓存favicon URL失败:', error);
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch (error) {
    return '';
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
}
