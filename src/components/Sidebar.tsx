
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, FolderPlus, Upload, Download, Settings, Bookmark } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { saveAs } from "file-saver";

interface SidebarProps {
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onImportClick: () => void;
}

const Sidebar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onImportClick 
}: SidebarProps) => {
  const { exportBookmarks } = useBookmarks();
  
  const handleExport = () => {
    const bookmarksBlob = exportBookmarks();
    saveAs(bookmarksBlob, "bookmarks-export.json");
  };

  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-screen border-r border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-center mb-6">
          <Bookmark className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-slate-800">书签管理器</h2>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="outline"
            className="w-full justify-start gap-2" 
            onClick={onImportClick}
          >
            <Upload size={18} />
            导入书签
          </Button>
          
          <Button 
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download size={18} />
            导出书签
          </Button>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="px-4 mb-2">
        <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">分类</h3>
      </div>
      
      <div className="flex-1 overflow-auto px-4">
        <div className="space-y-1">
          <button 
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === "all" 
                ? "bg-blue-100 text-blue-700" 
                : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => onSelectCategory("all")}
          >
            全部书签
            <Badge variant="secondary" className="ml-2">
              {categories.reduce((acc, cat) => acc + cat.count, 0)}
            </Badge>
          </button>
          
          {categories.filter(cat => cat.name !== "未分类").map(category => (
            <button 
              key={category.name}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${
                selectedCategory === category.name 
                  ? "bg-blue-100 text-blue-700" 
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => onSelectCategory(category.name)}
            >
              <span className="truncate">{category.name}</span>
              <Badge variant="secondary">{category.count}</Badge>
            </button>
          ))}
          
          <button 
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === "未分类" 
                ? "bg-blue-100 text-blue-700" 
                : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => onSelectCategory("未分类")}
          >
            未分类
            <Badge variant="secondary" className="ml-2">
              {categories.find(cat => cat.name === "未分类")?.count || 0}
            </Badge>
          </button>
        </div>
      </div>
      
      <div className="p-4 mt-auto">
        <Button variant="outline" className="w-full flex justify-between">
          <span className="flex items-center">
            <Settings size={18} className="mr-2" />
            设置
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
