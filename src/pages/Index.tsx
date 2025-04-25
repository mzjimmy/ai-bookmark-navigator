
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BookmarkList from "@/components/BookmarkList";
import ImportModal from "@/components/ImportModal";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAI } from "@/hooks/useAI";

const Index = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const { 
    bookmarks, 
    categories, 
    addBookmark, 
    removeBookmark, 
    importBookmarks, 
    filteredBookmarks 
  } = useBookmarks(searchQuery, selectedCategory);
  const { analyzing, analyzeBookmarks, aiSuggestions } = useAI();

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
  }, [toast]);

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
          
          <Tabs defaultValue="bookmarks" className="w-full">
            <TabsList>
              <TabsTrigger value="bookmarks">书签列表</TabsTrigger>
              <TabsTrigger value="analysis">智能分析</TabsTrigger>
            </TabsList>
            <TabsContent value="bookmarks" className="mt-4">
              <BookmarkList 
                bookmarks={filteredBookmarks} 
                onDelete={removeBookmark} 
              />
            </TabsContent>
            <TabsContent value="analysis" className="mt-4">
              <AIAnalysisPanel 
                bookmarks={bookmarks}
                aiSuggestions={aiSuggestions}
                onAnalyze={() => analyzeBookmarks(bookmarks)}
                analyzing={analyzing}
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
