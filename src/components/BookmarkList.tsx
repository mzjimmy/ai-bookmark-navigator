
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus } from "lucide-react";
import { BookmarkType } from "@/types/bookmark";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkModal from "./AddBookmarkModal";

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  onDelete: (id: string) => void;
}

const BookmarkList = ({ bookmarks, onDelete }: BookmarkListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addBookmark } = useBookmarks();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">我的书签</h2>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> 添加书签
        </Button>
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
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={addBookmark}
      />
    </div>
  );
};

export default BookmarkList;
