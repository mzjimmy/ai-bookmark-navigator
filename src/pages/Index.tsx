import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BookmarkList from "@/components/BookmarkList";
import ImportModal from "@/components/ImportModal";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import { Button } from "@/components/ui/button";
import { Search, Database, ArrowUpDown, Pin as PinIcon } from "lucide-react";
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

const Index = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  // 排序选项映射
  const sortOptions = [
    { value: 'pinned', label: '置顶优先' },
    { value: 'newest', label: '最新添加' },
    { value: 'oldest', label: '最早添加' },
    { value: 'title-asc', label: '标题 A-Z' },
    { value: 'title-desc', label: '标题 Z-A' },
    { value: 'visits', label: '访问次数' },
    { value: 'last-visited', label: '最近访问' },
  ];

  useEffect(() => {
    // Check if the app has been initialized before
    const initialized = localStorage.getItem("app_initialized");
    if (!initialized) {
      toast({
        title: "欢迎使用AI书签管理器",
        description: "请导入您的书签或开始添加新书签",
      });
      localStorage.setItem("app_initialized", "true");
    }
    
    // 检查并提示用户IndexedDB迁移
    const migrated = localStorage.getItem("indexeddb_migration_complete");
    if (migrated === 'true') {
      toast({
        title: "存储升级完成",
        description: "书签数据已升级至IndexedDB，现在可以存储更多书签！",
        icon: <Database className="h-4 w-4" />
      });
    }
  }, [toast]);

  // 处理排序选项变更
  const handleSortChange = (value: SortOption) => {
    console.log(`排序选项变更为: ${value}`);
    setSortOption(value);
  };

  // 处理书签更新
  const handleBookmarkUpdate = (id: string, updatedFields: any) => {
    console.log('处理书签更新:', { bookmarkId: id, updatedFields });
    updateBookmark(id, updatedFields);
  };
  
  // 处理书签置顶状态变更
  const handleBookmarkPinToggle = (id: string, isPinned: boolean) => {
    console.log('处理书签置顶状态变更:', { bookmarkId: id, isPinned });
    // 如果当前不是按置顶排序，切换到置顶排序
    if (sortOption !== 'pinned') {
      setSortOption('pinned');
      toast({
        title: "已切换到置顶排序",
        description: "已自动切换到置顶优先排序，以便更好地查看置顶书签。",
      });
    }
    // 刷新书签列表
    refreshBookmarks();
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-white">
      <Sidebar 
        categories={categories} 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onImportClick={() => setIsImportModalOpen(true)}
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
          
          <Tabs defaultValue="bookmarks" className="w-full">
            <TabsList>
              <TabsTrigger value="bookmarks">书签列表</TabsTrigger>
              <TabsTrigger value="analysis">智能分析</TabsTrigger>
            </TabsList>
            <TabsContent value="bookmarks" className="mt-4">
              <BookmarkList 
                bookmarks={filteredBookmarks} 
                onDelete={removeBookmark}
                onUpdate={handleBookmarkUpdate}
                isLoading={isLoading}
                onRefresh={refreshBookmarks}
              />
            </TabsContent>
            <TabsContent value="analysis" className="mt-4">
              <AIAnalysisPanel 
                bookmarks={bookmarks}
                aiSuggestions={aiSuggestions}
                onAnalyze={() => analyzeBookmarks(bookmarks)}
                analyzing={analyzing || isLoading}
                error={error}
              />
            </TabsContent>
          </Tabs>
        </header>
      </div>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImport={importBookmarks}
      />
    </div>
  );
};

export default Index;
