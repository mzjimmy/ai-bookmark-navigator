import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkType } from "@/types/bookmark";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => void;
}

const AddBookmarkModal = ({ isOpen, onClose, onAdd }: AddBookmarkModalProps) => {
  const [newBookmark, setNewBookmark] = useState({
    title: "",
    url: "",
    description: "",
    category: "未分类",
    tags: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = newBookmark.tags.split(",").map(tag => tag.trim()).filter(Boolean);
    onAdd({
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
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkModal;
