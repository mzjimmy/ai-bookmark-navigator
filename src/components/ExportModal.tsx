import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BookmarkType } from "@/types/bookmark";
import { downloadBookmarksAsHtml } from "@/utils/bookmarkExporter";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
}

const ExportModal = ({ isOpen, onClose, bookmarks }: ExportModalProps) => {
  const { toast } = useToast();
  const [filename, setFilename] = useState("bookmarks.html");
  const [includeAll, setIncludeAll] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 获取所有可用分类
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    bookmarks.forEach(bookmark => {
      if (bookmark.category) {
        categorySet.add(bookmark.category);
      } else {
        categorySet.add("未分类");
      }
    });
    return Array.from(categorySet);
  }, [bookmarks]);

  // 处理分类复选框变化
  const handleCategoryChange = (category: string, checked: boolean) => {
    console.log('导出分类选择变更:', { category, checked });
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  // 处理全选/取消全选
  const handleIncludeAllChange = (checked: boolean) => {
    console.log('导出全选状态变更:', { checked });
    setIncludeAll(checked);
    if (checked) {
      setSelectedCategories([]);
    }
  };

  // 处理导出操作
  const handleExport = () => {
    try {
      // 根据选项过滤书签
      let bookmarksToExport = bookmarks;
      if (!includeAll && selectedCategories.length > 0) {
        bookmarksToExport = bookmarks.filter(bookmark => {
          const category = bookmark.category || "未分类";
          return selectedCategories.includes(category);
        });
      }
      
      console.log('准备导出书签:', { 
        format: 'HTML', 
        filename, 
        totalBookmarks: bookmarks.length, 
        selectedBookmarks: bookmarksToExport.length,
        includeAll,
        selectedCategories
      });
      
      if (bookmarksToExport.length === 0) {
        toast({
          title: "导出警告",
          description: "没有选择任何书签进行导出。",
          variant: "destructive",
        });
        return;
      }
      
      // 执行导出
      downloadBookmarksAsHtml(bookmarksToExport, filename);
      
      toast({
        title: "导出成功",
        description: `成功导出 ${bookmarksToExport.length} 个书签为HTML文件。`,
      });
      
      onClose();
    } catch (error) {
      console.error("导出错误:", error);
      toast({
        title: "导出错误",
        description: "导出书签时发生错误，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>导出书签为HTML</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="bookmarks.html"
            />
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-all" 
                checked={includeAll}
                onCheckedChange={(checked) => handleIncludeAllChange(checked as boolean)}
              />
              <Label htmlFor="include-all">导出所有书签</Label>
            </div>
          </div>
          
          {!includeAll && (
            <div className="grid gap-2">
              <Label>选择要导出的分类</Label>
              <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category, checked as boolean)
                      }
                    />
                    <Label htmlFor={`category-${category}`}>{category}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleExport}>导出HTML</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal; 