
export const parseHtmlBookmarks = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bookmarks: any[] = [];

  const traverse = (node: Element) => {
    const links = node.getElementsByTagName('a');
    for (const link of Array.from(links)) {
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
    traverse(dt);
  }

  return bookmarks;
};
