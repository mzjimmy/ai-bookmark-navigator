import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BookmarkList from "@/components/BookmarkList";
import ImportModal from "@/components/ImportModal";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import NormalizeNameModal from "@/components/NormalizeNameModal";
import { Button } from "@/components/ui/button";
import { Search, Database, ArrowUpDown, Pin as PinIcon, Text, Brain } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks, SortOption } from "@/hooks/useBookmarks";
import { useAI } from "@/hooks/useAI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 排序选项
const sortOptions = [
  { value: 'pinned', label: '置顶优先' },
  { value: 'newest', label: '最新添加' },
  { value: 'oldest', label: '最早添加' },
  { value: 'title-asc', label: '标题升序' },
  { value: 'title-desc', label: '标题降序' },
  { value: 'visits', label: '访问次数' },
  { value: 'last-visited', label: '最近访问' },
];

const Index = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNormalizeModalOpen, setIsNormalizeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("pinned");
  const { toast } = useToast();
  const { 
    bookmarks, 
    categories, 
    addBookmark, 
    removeBookmark,
    updateBookmark, 
    importBookmarks, 
    filteredBookmarks,
    isLoading,
    toggleBookmarkPinStatus,
    refreshBookmarks
  } = useBookmarks(searchQuery, selectedCategory, sortOption);
  const { analyzing, analyzeBookmarks, aiSuggestions, error } = useAI();

  console.log('Index组件渲染:', { 
    bookmarksCount: bookmarks.length, 
    filteredCount: filteredBookmarks.length,
    selectedCategory,
    sortOption,
    pinnedCount: bookmarks.filter(b => b.isPinned).length
  });

  // 处理分类选择
  const handleCategorySelect = (category: string) => {
    console.log('选择分类:', { category, previousCategory: selectedCategory });
    setSelectedCategory(category);
  };

  // 处理导入
  const handleImport = (importedBookmarks: Omit<BookmarkType, 'id' | 'createdAt'>[]) => {
    console.log('导入书签:', { count: importedBookmarks.length });
    importBookmarks(importedBookmarks)
      .then((count) => {
        toast({
          title: "导入成功",
          description: `已导入 ${count} 个书签`,
        });
      })
      .catch((error) => {
        toast({
          title: "导入失败",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  // 处理排序变更
  const handleSortChange = (newSortOption: SortOption) => {
    console.log('更改排序选项:', { from: sortOption, to: newSortOption });
    setSortOption(newSortOption);
  };

  // 处理AI分析
  const handleAnalyze = () => {
    console.log('开始AI分析');
    analyzeBookmarks(bookmarks);
  };

  // 处理名称规范化
  const handleNormalizeNames = () => {
    console.log('打开名称规范化对话框');
    setIsNormalizeModalOpen(true);
  };

  // 应用规范化后的书签
  const handleNormalizeComplete = (updatedBookmarks: BookmarkType[]) => {
    console.log('应用名称规范化结果:', { updatedBookmarksCount: updatedBookmarks.length });
    
    // 批量更新书签
    const updatePromises = updatedBookmarks
      .filter((bookmark, index) => bookmark.title !== bookmarks[index].title)
      .map(bookmark => updateBookmark(bookmark.id, { title: bookmark.title }));
    
    Promise.all(updatePromises)
      .then(() => {
        toast({
          title: "规范化完成",
          description: `已更新 ${updatePromises.length} 个书签标题`,
        });
        refreshBookmarks();
      })
      .catch(error => {
        toast({
          title: "规范化应用失败",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect}
        onImport={() => setIsImportModalOpen(true)}
      />
      
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">AI书签导航</h1>
            <div className="flex gap-2">
              {/* 排序下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    {sortOption === 'pinned' ? <PinIcon className="mr-2 h-4 w-4" /> : <ArrowUpDown className="mr-2 h-4 w-4" />}
                    {sortOptions.find(opt => opt.value === sortOption)?.label || '排序'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => handleSortChange(option.value as SortOption)}
                      className={sortOption === option.value ? "bg-slate-100" : ""}
                    >
                      {option.value === 'pinned' && <PinIcon className="mr-2 h-4 w-4" />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI功能下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Brain className="mr-2 h-4 w-4" />
                    AI功能
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleNormalizeNames}>
                    <Text className="mr-2 h-4 w-4" />
                    <span>规范化书签名称</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索书签..."
                  className="pl-10 py-2 pr-4 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="bookmarks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookmarks" className="relative">
              书签列表
              <span className="ml-1 text-xs text-gray-500">({filteredBookmarks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="analysis">
              AI分析
              {analyzing && <span className="ml-1 text-xs text-blue-500">(分析中...)</span>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookmarks" className="space-y-4">
            <BookmarkList 
              bookmarks={filteredBookmarks}
              onDelete={removeBookmark}
              onUpdate={updateBookmark}
              isLoading={isLoading}
              onRefresh={refreshBookmarks}
            />
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisPanel 
              bookmarks={bookmarks}
              aiSuggestions={aiSuggestions}
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
              error={error}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      <NormalizeNameModal
        isOpen={isNormalizeModalOpen}
        onClose={() => setIsNormalizeModalOpen(false)}
        bookmarks={bookmarks}
        onNormalizeComplete={handleNormalizeComplete}
      />
    </div>
  );
};

export default Index;
