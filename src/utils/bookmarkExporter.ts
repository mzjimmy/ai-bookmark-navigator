import { BookmarkType } from '@/types/bookmark';

/**
 * 生成标准的浏览器书签HTML格式
 * @param bookmarks 要导出的书签数组
 * @returns HTML格式的书签文件内容
 */
export const generateBookmarksHtml = (bookmarks: BookmarkType[]): string => {
  console.log('生成HTML书签格式:', { bookmarkCount: bookmarks.length });
  
  const title = "AI书签导航器导出的书签";
  const dateNow = new Date().toISOString();
  
  // 按类别组织书签
  const categorizedBookmarks: Record<string, BookmarkType[]> = {};
  bookmarks.forEach(bookmark => {
    const category = bookmark.category || '未分类';
    if (!categorizedBookmarks[category]) {
      categorizedBookmarks[category] = [];
    }
    categorizedBookmarks[category].push(bookmark);
  });
  
  // 生成HTML开头部分
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>${title}</TITLE>
<H1>${title}</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}" PERSONAL_TOOLBAR_FOLDER="true">导出的书签</H3>
    <DL><p>
`;

  // 为每个类别生成HTML
  Object.keys(categorizedBookmarks).forEach(category => {
    html += `        <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}">${category}</H3>
        <DL><p>
`;
    
    // 为该类别下的每个书签生成HTML
    categorizedBookmarks[category].forEach(bookmark => {
      const createdTimestamp = bookmark.createdAt ? 
        Math.floor(new Date(bookmark.createdAt).getTime() / 1000) : 
        Math.floor(Date.now() / 1000);
      
      const lastVisitedTimestamp = bookmark.lastVisited ? 
        Math.floor(new Date(bookmark.lastVisited).getTime() / 1000) : 
        '';
      
      // 构建标签属性
      let tagAttrs = '';
      if (bookmark.tags && bookmark.tags.length > 0) {
        tagAttrs = ` TAGS="${bookmark.tags.join(',')}"`;
      }
      
      // 添加书签条目
      html += `            <DT><A HREF="${bookmark.url}" ADD_DATE="${createdTimestamp}"${
        lastVisitedTimestamp ? ` LAST_VISIT="${lastVisitedTimestamp}"` : ''
      }${
        bookmark.visitCount ? ` VISIT_COUNT="${bookmark.visitCount}"` : ''
      }${tagAttrs} DESCRIPTION="${bookmark.description || ''}">${bookmark.title}</A></DT>\n`;
    });
    
    html += `        </DL><p>\n`;
  });
  
  // 结束HTML
  html += `    </DL><p>
</DL><p>`;

  console.log('HTML书签生成完成，总字节数:', html.length);
  return html;
};

/**
 * 下载HTML书签文件
 * @param bookmarks 要导出的书签数组
 * @param filename 导出文件名
 */
export const downloadBookmarksAsHtml = (bookmarks: BookmarkType[], filename: string = 'bookmarks.html'): void => {
  try {
    console.log('书签导出操作:', { format: 'HTML', bookmarkCount: bookmarks.length });
    
    const html = generateBookmarksHtml(bookmarks);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('书签HTML导出成功:', { filename, size: blob.size });
    }, 100);
  } catch (error) {
    console.error('书签导出失败:', error);
    throw error;
  }
}; 