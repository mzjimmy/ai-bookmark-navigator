import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, ExternalLink, Trash2, Edit, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkType } from "@/types/bookmark";
import { useBookmarks } from "@/hooks/useBookmarks";
import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils";

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  onDelete: (id: string) => void;
}

const BookmarkList = ({ bookmarks, onDelete }: BookmarkListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    title: "",
    url: "",
    description: "",
    category: "未分类",
    tags: ""
  });
  const { addBookmark } = useBookmarks();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = newBookmark.tags.split(",").map(tag => tag.trim()).filter(Boolean);
    addBookmark({
      ...newBookmark,
      tags
    });
    setNewBookmark({
      title: "",
      url: "",
      description: "",
      category: "未分类",
      tags: ""
    });
    setIsAddModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">我的书签</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> 添加书签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新书签</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input 
                  id="title" 
                  placeholder="书签标题" 
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">网址</Label>
                <Input 
                  id="url" 
                  placeholder="https://example.com" 
                  value={newBookmark.url}
                  onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea 
                  id="description" 
                  placeholder="书签描述（可选）" 
                  value={newBookmark.description}
                  onChange={(e) => setNewBookmark({...newBookmark, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input 
                  id="category" 
                  placeholder="分类（如：工作、学习）" 
                  value={newBookmark.category}
                  onChange={(e) => setNewBookmark({...newBookmark, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input 
                  id="tags" 
                  placeholder="标签（以逗号分隔）" 
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark({...newBookmark, tags: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  取消
                </Button>
                <Button type="submit">添加</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">没有找到书签</h3>
          <p className="mt-2 text-sm text-gray-500">
            添加您的第一个书签或导入现有书签。
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsAddModalOpen(true)}>
              添加书签
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    <div className="h-6 w-6 rounded overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100">
                      <img 
                        src={getFaviconUrl(bookmark.url)} 
                        alt="" 
                        className="h-4 w-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {bookmark.title || "无标题"}
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
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {bookmark.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="bg-blue-50">
                    {bookmark.category}
                  </Badge>
                  {bookmark.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {(bookmark.tags?.length || 0) > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(bookmark.tags?.length || 0) - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => window.open(bookmark.url, '_blank')}
                  title={bookmark.url}
                >
                  <ExternalLink size={16} className="mr-1" /> 访问
                </Button>
                <div className="flex">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => onDelete(bookmark.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkList;
