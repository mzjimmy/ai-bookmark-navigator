import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trash2, Edit, Clock, EyeIcon, Save, X, PinIcon } from "lucide-react";
import { BookmarkType } from "@/types/bookmark";
import { getFaviconUrl, getDomainFromUrl, formatDate, cacheFaviconUrl } from "@/lib/utils";
import { updateBookmarkVisit, toggleBookmarkPin } from "@/lib/indexedDB";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updatedFields: Partial<BookmarkType>) => void;
  onPinToggle?: (id: string, isPinned: boolean) => void;
}

const BookmarkCard = ({ bookmark, onDelete, onUpdate, onPinToggle }: BookmarkCardProps) => {
  // 编辑状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || "",
    category: bookmark.category || "未分类",
    tags: bookmark.tags ? bookmark.tags.join(", ") : ""
  });
  
  console.log('BookmarkCard初始化:', { bookmarkId: bookmark.id, isEditing, isPinned: bookmark.isPinned });

  // 处理书签访问
  const handleVisit = async () => {
    try {
      // 记录访问并打开链接
      await updateBookmarkVisit(bookmark.id);
      window.open(bookmark.url, '_blank');
    } catch (error) {
      console.error('访问书签失败:', error);
      // 即使记录失败，也打开链接
      window.open(bookmark.url, '_blank');
    }
  };
  
  // 处理编辑按钮点击
  const handleEditClick = () => {
    const newEditingState = !isEditing;
    setIsEditing(newEditingState);
    console.log('BookmarkCard编辑状态切换:', { bookmarkId: bookmark.id, isEditing: newEditingState });
    
    if (newEditingState) {
      // 重置编辑数据
      setEditData({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || "",
        category: bookmark.category || "未分类",
        tags: bookmark.tags ? bookmark.tags.join(", ") : ""
      });
      console.log('初始化编辑表单数据:', { bookmarkId: bookmark.id, formData: editData });
    }
  };
  
  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditData({
      ...editData,
      [id]: value
    });
    console.log('编辑表单字段更新:', { bookmarkId: bookmark.id, field: id, value });
  };
  
  // 处理表单提交
  const handleSubmit = () => {
    // 表单验证
    if (!editData.title.trim() || !editData.url.trim()) {
      console.error('表单验证失败:', { title: editData.title, url: editData.url });
      return;
    }
    
    try {
      const tags = editData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
      
      const updatedData: Partial<BookmarkType> = {
        title: editData.title,
        url: editData.url,
        description: editData.description,
        category: editData.category,
        tags
      };
      
      console.log('编辑表单提交:', { bookmarkId: bookmark.id, updatedData });
      
      // 调用更新函数
      if (onUpdate) {
        onUpdate(bookmark.id, updatedData);
      }
      
      // 退出编辑模式
      setIsEditing(false);
    } catch (error) {
      console.error('提交书签编辑失败:', error);
    }
  };
  
  // 取消编辑
  const handleCancel = () => {
    console.log('取消编辑:', { bookmarkId: bookmark.id });
    setIsEditing(false);
  };
  
  // 处理置顶切换
  const handlePinToggle = async () => {
    try {
      // 切换置顶状态
      const updatedBookmark = await toggleBookmarkPin(bookmark.id);
      console.log('书签置顶状态更改:', { bookmarkId: bookmark.id, isPinned: updatedBookmark.isPinned });
      
      // 通知父组件
      if (onPinToggle) {
        onPinToggle(bookmark.id, updatedBookmark.isPinned);
      }
    } catch (error) {
      console.error('切换置顶状态失败:', error);
    }
  };
  
  // 编辑模式下的渲染
  if (isEditing) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">编辑书签</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">标题</Label>
            <Input 
              id="title" 
              value={editData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="url">网址</Label>
            <Input 
              id="url" 
              value={editData.url}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">描述</Label>
            <Textarea 
              id="description" 
              value={editData.description}
              onChange={handleInputChange}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">分类</Label>
            <Input 
              id="category" 
              value={editData.category}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">标签（用逗号分隔）</Label>
            <Input 
              id="tags" 
              value={editData.tags}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
            className="text-gray-500"
          >
            <X size={16} className="mr-1" /> 取消
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleSubmit}
            className="bg-blue-600"
          >
            <Save size={16} className="mr-1" /> 保存
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // 正常显示模式
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${bookmark.isPinned ? 'border-blue-400 border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 border border-gray-200">
              {/* Favicon加载状态 */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* 加载中状态指示器 */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-0">
                  <span className="animate-pulse w-4 h-4 rounded-full bg-gray-200"></span>
                </div>
                
                <img 
                  src={getFaviconUrl(bookmark.url)} 
                  alt="" 
                  className="h-5 w-5 relative z-10 object-contain"
                  loading="lazy"
                  onLoad={(e) => {
                    // 图标加载成功，缓存URL
                    const imgElement = e.target as HTMLImageElement;
                    const loadTime = performance.now();
                    console.log('Favicon加载状态:', {
                      url: bookmark.url, 
                      status: 'success', 
                      source: imgElement.src.includes('google.com/s2') ? 'google_service' : 'site_favicon',
                      loadTime: Math.round(loadTime)
                    });
                    
                    if (imgElement.src && !imgElement.src.includes('placeholder.svg')) {
                      cacheFaviconUrl(bookmark.url, imgElement.src);
                    }
                  }}
                  onError={(e) => {
                    console.log('Favicon加载状态:', {
                      url: bookmark.url, 
                      status: 'error', 
                      errorType: 'load_failure',
                      loadTime: Math.round(performance.now())
                    });
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                    // 防止循环重试
                    (e.target as HTMLImageElement).onerror = null;
                  }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">
                {bookmark.title || "无标题"}
                {bookmark.isPinned && (
                  <PinIcon className="inline-block ml-1 h-3 w-3 text-blue-500" />
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1 flex items-center">
                <span className="truncate">
                  {getDomainFromUrl(bookmark.url)}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {bookmark.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2 hover:line-clamp-none transition-all duration-300">
            {bookmark.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 transition-colors">
            {bookmark.category || '未分类'}
          </Badge>
          {bookmark.tags?.slice(0, 2).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs hover:bg-gray-200 transition-colors">
              {tag}
            </Badge>
          ))}
          {(bookmark.tags?.length || 0) > 2 && (
            <Badge variant="secondary" className="text-xs hover:bg-gray-200 transition-colors">
              +{(bookmark.tags?.length || 0) - 2}
            </Badge>
          )}
        </div>
        
        {/* 访问信息显示 */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" /> 
                  {formatDate(bookmark.createdAt)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>创建时间: {new Date(bookmark.createdAt).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {bookmark.lastVisited && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <EyeIcon size={12} className="mr-1" /> 
                    {bookmark.visitCount || 0}次访问
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>最后访问: {new Date(bookmark.lastVisited).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={handleEditClick}
            onMouseEnter={() => console.log('书签卡片交互:', {bookmarkId: bookmark.id, interactionType: 'hover_edit'})}
          >
            <Edit size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              console.log('书签卡片交互:', {bookmarkId: bookmark.id, interactionType: 'delete'});
              onDelete(bookmark.id);
            }}
          >
            <Trash2 size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={`h-8 w-8 p-0 ${bookmark.isPinned ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50 transition-colors`}
            onClick={() => {
              console.log('书签卡片交互:', {bookmarkId: bookmark.id, interactionType: 'toggle_pin'});
              handlePinToggle();
            }}
          >
            <PinIcon size={16} />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-blue-600 hover:bg-blue-100 transition-colors"
          onClick={() => {
            console.log('书签卡片交互:', {bookmarkId: bookmark.id, interactionType: 'visit'});
            handleVisit();
          }}
        >
          <ExternalLink size={16} className="mr-1" /> 
          访问
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookmarkCard;
