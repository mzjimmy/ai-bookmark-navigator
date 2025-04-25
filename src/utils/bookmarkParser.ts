
// Maximum number of HTML bookmarks to parse to avoid memory issues
const MAX_HTML_BOOKMARKS = 500;

export const parseHtmlBookmarks = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bookmarks: any[] = [];

  const traverse = (node: Element) => {
    if (bookmarks.length >= MAX_HTML_BOOKMARKS) {
      return; // Stop parsing if we've reached the limit
    }
    
    const links = node.getElementsByTagName('a');
    for (const link of Array.from(links)) {
      if (bookmarks.length >= MAX_HTML_BOOKMARKS) {
        break;
      }
      
      const bookmark = {
        title: link.textContent || 'Untitled',
        url: link.getAttribute('href') || '',
        description: link.getAttribute('description') || '',
        category: link.closest('dl')?.closest('dt')?.querySelector('h3')?.textContent || '未分类',
        tags: [],
        createdAt: link.getAttribute('add_date') 
          ? new Date(parseInt(link.getAttribute('add_date')!) * 1000).toISOString()
          : new Date().toISOString()
      };
      if (bookmark.url) {
        bookmarks.push(bookmark);
      }
    }
  };

  const dts = doc.getElementsByTagName('dt');
  for (const dt of Array.from(dts)) {
    if (bookmarks.length >= MAX_HTML_BOOKMARKS) {
      break;
    }
    traverse(dt);
  }

  return bookmarks;
};
