import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus, RefreshCw, CheckSquare, Square, Trash2, Edit, Tag, X, FileDown, PinIcon } from "lucide-react";
import { BookmarkType } from "@/types/bookmark";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkModal from "./AddBookmarkModal";
import ExportModal from "./ExportModal";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookmarksWithPinned } from "@/lib/indexedDB";

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updatedFields: Partial<BookmarkType>) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const BookmarkList = ({ bookmarks, onDelete, onUpdate, isLoading = false, onRefresh }: BookmarkListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { addBookmark } = useBookmarks();
  
  // 批量选择管理
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // 批量编辑表单状态
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchEditData, setBatchEditData] = useState({
    category: "",
    tags: ""
  });

  // 排序后的书签列表
  const [sortedBookmarks, setSortedBookmarks] = useState<BookmarkType[]>(bookmarks);

  // 当bookmarks变化时，重新排序
  useEffect(() => {
    // 由于直接传入的bookmarks不一定是按照置顶状态和位置排序的
    // 这里我们手动根据置顶状态和位置进行排序
    const sorted = [...bookmarks].sort((a, b) => {
      // 1. 先按置顶状态排序
      const isPinnedA = a.isPinned || false;
      const isPinnedB = b.isPinned || false;
      
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      
      // 2. 再按照position排序（position较小的排前面）
      const positionA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
      const positionB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
      
      return positionA - positionB;
    });
    
    setSortedBookmarks(sorted);
    console.log('书签列表已重新排序:', { 
      totalBookmarks: bookmarks.length, 
      pinnedCount: bookmarks.filter(b => b.isPinned).length 
    });
  }, [bookmarks]);

  console.log('BookmarkList 渲染:', { 
    bookmarksCount: bookmarks.length, 
    isLoading,
    selectMode,
    selectedCount: selectedBookmarks.length,
    batchEditMode,
    isExportModalOpen
  });

  // 切换选择模式
  const toggleSelectMode = () => {
    const newMode = !selectMode;
    setSelectMode(newMode);
    if (!newMode) {
      // 退出选择模式时清空选择
      setSelectedBookmarks([]);
    }
    console.log('切换选择模式:', { newMode, clearedSelection: !newMode });
  };

  // 选择/取消选择书签
  const toggleBookmarkSelection = (id: string) => {
    setSelectedBookmarks(prev => {
      if (prev.includes(id)) {
        const newSelection = prev.filter(bookmarkId => bookmarkId !== id);
        console.log('取消选择书签:', { bookmarkId: id, remainingSelected: newSelection.length });
        return newSelection;
      } else {
        const newSelection = [...prev, id];
        console.log('选择书签:', { bookmarkId: id, totalSelected: newSelection.length });
        return newSelection;
      }
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedBookmarks.length === bookmarks.length) {
      // 如果已经全选，则取消全选
      setSelectedBookmarks([]);
      console.log('取消全选书签');
    } else {
      // 否则全选
      const allIds = bookmarks.map(bookmark => bookmark.id);
      setSelectedBookmarks(allIds);
      console.log('全选书签:', { count: allIds.length });
    }
  };

  // 批量删除书签
  const handleBatchDelete = () => {
    console.log('批量删除书签:', { selectedCount: selectedBookmarks.length });
    // 确认删除
    if (window.confirm(`确定要删除选中的 ${selectedBookmarks.length} 个书签吗？`)) {
      selectedBookmarks.forEach(id => {
        onDelete(id);
      });
      setSelectedBookmarks([]);
      setSelectMode(false);
    }
  };

  // 进入批量编辑模式
  const enterBatchEditMode = () => {
    console.log('进入批量编辑模式:', { selectedCount: selectedBookmarks.length });
    setBatchEditMode(true);
  };

  // 退出批量编辑模式
  const exitBatchEditMode = () => {
    console.log('退出批量编辑模式');
    setBatchEditMode(false);
    setBatchEditData({
      category: "",
      tags: ""
    });
  };

  // 处理批量编辑表单字段变化
  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setBatchEditData({
      ...batchEditData,
      [id]: value
    });
    console.log('批量编辑表单字段更新:', { field: id, value });
  };

  // 提交批量编辑
  const handleBatchEditSubmit = () => {
    console.log('提交批量编辑:', { selectedCount: selectedBookmarks.length, formData: batchEditData });
    
    // 准备更新数据
    const updates: Partial<BookmarkType> = {};
    
    if (batchEditData.category.trim()) {
      updates.category = batchEditData.category.trim();
    }
    
    if (batchEditData.tags.trim()) {
      const tags = batchEditData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
      
      if (tags.length > 0) {
        updates.tags = tags;
      }
    }
    
    // 检查是否有实际更新
    if (Object.keys(updates).length === 0) {
      console.log('批量编辑：没有有效的更新数据');
      alert('请至少填写一个要更新的字段');
      return;
    }
    
    // 执行批量更新
    if (onUpdate) {
      selectedBookmarks.forEach(id => {
        console.log('更新书签:', { bookmarkId: id, updates });
        onUpdate(id, updates);
      });
    }
    
    // 重置状态
    setSelectedBookmarks([]);
    setSelectMode(false);
    setBatchEditMode(false);
    setBatchEditData({
      category: "",
      tags: ""
    });
  };

  // 处理书签置顶状态变化
  const handlePinToggle = (id: string, isPinned: boolean) => {
    console.log('书签置顶状态已更改:', { bookmarkId: id, isPinned });
    // 通知父组件刷新数据
    if (onRefresh) {
      onRefresh();
    }
  };

  // 加载状态下的骨架屏组件
  const BookmarkSkeleton = () => (
    <div className="border rounded-lg p-4 shadow-sm space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );

  // 显示加载中的骨架屏
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">正在加载书签</h2>
          <RefreshCw className="animate-spin text-blue-500" size={20} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, index) => (
            <BookmarkSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // 批量编辑表单
  if (batchEditMode) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            批量编辑 ({selectedBookmarks.length} 个书签)
          </h2>
          <Button variant="ghost" onClick={exitBatchEditMode}>
            <X size={16} className="mr-1" /> 取消
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">分类（将应用于所有选中书签）</Label>
              <Input 
                id="category" 
                placeholder="新分类（如：工作、学习）" 
                value={batchEditData.category}
                onChange={handleBatchInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">标签（将应用于所有选中书签，用逗号分隔）</Label>
              <Input 
                id="tags" 
                placeholder="新标签（用逗号分隔）" 
                value={batchEditData.tags}
                onChange={handleBatchInputChange}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={exitBatchEditMode}>
                取消
              </Button>
              <Button onClick={handleBatchEditSubmit}>
                更新所选书签
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 正常显示的书签列表
  return (
    <div>
      <AddBookmarkModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addBookmark}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)} 
        bookmarks={bookmarks}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          我的书签 ({bookmarks.length})
          {bookmarks.filter(b => b.isPinned).length > 0 && (
            <span className="text-sm font-normal text-blue-500 ml-2">
              <PinIcon className="inline-block h-3 w-3 mr-1" />
              {bookmarks.filter(b => b.isPinned).length} 个置顶
            </span>
          )}
        </h2>
        
        <div className="flex gap-2">
          {selectMode ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleSelectAll}
                className="text-gray-600"
              >
                {selectedBookmarks.length === bookmarks.length ? (
                  <>
                    <Square size={16} className="mr-1" /> 取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare size={16} className="mr-1" /> 全选
                  </>
                )}
              </Button>
              
              {selectedBookmarks.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={enterBatchEditMode}
                    className="text-blue-600"
                  >
                    <Edit size={16} className="mr-1" /> 编辑 ({selectedBookmarks.length})
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBatchDelete}
                    className="text-red-600"
                  >
                    <Trash2 size={16} className="mr-1" /> 删除
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleSelectMode}
                className="text-gray-500"
              >
                <X size={16} className="mr-1" /> 退出
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus size={16} className="mr-1" /> 添加
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsAddModalOpen(true)}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>添加书签</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>导出书签</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleSelectMode}
                className="text-gray-600"
              >
                <CheckSquare size={16} className="mr-1" /> 选择
              </Button>
            </>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>还没有保存任何书签</p>
          <Button 
            variant="link" 
            className="mt-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            添加你的第一个书签
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className={`relative ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleBookmarkSelection(bookmark.id) : undefined}
            >
              {selectMode && (
                <div className="absolute -left-2 -top-2 z-10 bg-white rounded-full shadow">
                  {selectedBookmarks.includes(bookmark.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-300" />
                  )}
                </div>
              )}
              
              <BookmarkCard
                bookmark={bookmark}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onPinToggle={handlePinToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkList;
