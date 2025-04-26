import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// favicon缓存
const faviconCache: Record<string, string> = {};

export function getFaviconUrl(url: string): string {
  const startTime = performance.now();
  let status = 'init';
  let source = 'unknown';
  
  try {
    // 检查是否已经有缓存
    const hostname = new URL(url).hostname;
    
    // 如果在内存缓存中存在
    if (faviconCache[hostname]) {
      status = 'success';
      source = 'memory_cache';
      console.log('Favicon加载状态:', {url, status, source, loadTime: 0});
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
          status = 'success';
          source = 'local_storage';
          console.log('Favicon加载状态:', {url, status, source, loadTime: 0});
          return cache[hostname];
        }
      } catch (e) {
        // 解析错误，忽略缓存
        status = 'error';
        source = 'parse_cache';
        console.error('解析favicon缓存失败:', e);
      }
    }
    
    const parsedUrl = new URL(url);
    
    // 多种 favicon 获取方式
    // 1. 使用Google的favicon服务作为主要来源
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    status = 'pending';
    source = 'google_service';
    
    // 2. 直接从网站根目录获取favicon作为备选
    const siteFaviconUrl = `${parsedUrl.origin}/favicon.ico`;
    
    // 返回Google的favicon服务URL (更可靠且支持不同尺寸)
    console.log('Favicon加载状态:', {
      url, 
      status, 
      source,
      loadTime: Math.round(performance.now() - startTime)
    });
    return googleFaviconUrl;
  } catch (error) {
    // 如果URL解析失败，返回占位图
    status = 'error';
    source = 'invalid_url';
    console.log('Favicon加载状态:', {
      url, 
      status, 
      source, 
      error: (error as Error).message,
      loadTime: Math.round(performance.now() - startTime)
    });
    return '/placeholder.svg';
  }
}

// 缓存favicon URL
export function cacheFaviconUrl(url: string, faviconUrl: string): void {
  const startTime = performance.now();
  let action = 'update';
  let cacheStatus = 'pending';
  
  try {
    const hostname = new URL(url).hostname;
    
    // 检查是否已经在内存缓存中
    if (faviconCache[hostname] === faviconUrl) {
      action = 'skip';
      cacheStatus = 'already_cached';
      console.log('Favicon缓存操作:', {url, action, cacheStatus, processTime: 0});
      return;
    }
    
    // 更新内存缓存
    faviconCache[hostname] = faviconUrl;
    
    // 更新localStorage缓存
    try {
      const cachedFavicons = localStorage.getItem('favicon_cache') || '{}';
      const cache = JSON.parse(cachedFavicons);
      
      // 检查是否需要更新存储
      if (cache[hostname] !== faviconUrl) {
        cache[hostname] = faviconUrl;
        localStorage.setItem('favicon_cache', JSON.stringify(cache));
        cacheStatus = 'success';
      } else {
        action = 'skip';
        cacheStatus = 'no_change';
      }
      
      console.log('Favicon缓存操作:', {
        url, 
        action, 
        cacheStatus,
        source: faviconUrl.includes('google.com/s2') ? 'google_service' : 'site_favicon',
        processTime: Math.round(performance.now() - startTime)
      });
    } catch (e) {
      cacheStatus = 'storage_error';
      console.error('更新favicon缓存失败:', e);
    }
  } catch (error) {
    cacheStatus = 'error';
    console.error('缓存favicon URL失败:', error);
    console.log('Favicon缓存操作:', {
      url, 
      action, 
      cacheStatus, 
      error: (error as Error).message,
      processTime: Math.round(performance.now() - startTime)
    });
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
