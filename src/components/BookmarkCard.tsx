
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trash2, Edit } from "lucide-react";
import { BookmarkType } from "@/types/bookmark";
import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils";

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onDelete: (id: string) => void;
}

const BookmarkCard = ({ bookmark, onDelete }: BookmarkCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
  );
};

export default BookmarkCard;
