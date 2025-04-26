import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookmarkType } from "@/types/bookmark";
import { useNameNormalizer } from "@/hooks/useNameNormalizer";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface NormalizeNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  onNormalizeComplete: (updatedBookmarks: BookmarkType[]) => void;
}

const NormalizeNameModal = ({
  isOpen,
  onClose,
  bookmarks,
  onNormalizeComplete,
}: NormalizeNameModalProps) => {
  const {
    normalizing,
    progress,
    error,
    results,
    normalizeBookmarkNames,
    applyNormalizations,
    clearResults,
  } = useNameNormalizer();

  const [selectedBookmarks, setSelectedBookmarks] = useState<BookmarkType[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [displayedResults, setDisplayedResults] = useState<
    Array<{ bookmark: BookmarkType; oldTitle: string; newTitle: string; confidence: number }>
  >([]);

  useEffect(() => {
    console.log('NormalizeNameModal打开，初始书签数:', bookmarks.length);
    
    if (isOpen) {
      // 当对话框打开时，默认选择所有书签
      setSelectedBookmarks(bookmarks);
    } else {
      // 当对话框关闭时，清除选择和结果
      setSelectedBookmarks([]);
      clearResults();
    }
  }, [isOpen, bookmarks, clearResults]);

  // 准备显示的结果
  useEffect(() => {
    if (results.length === 0) {
      setDisplayedResults([]);
      return;
    }

    console.log('正在准备规范化结果显示', { resultsCount: results.length });
    
    // 创建结果查找映射
    const resultMap = new Map();
    results.forEach(result => {
      resultMap.set(result.originalName, result);
    });

    // 转换为显示格式
    const display = selectedBookmarks.map(bookmark => {
      const result = resultMap.get(bookmark.title);
      return {
        bookmark,
        oldTitle: bookmark.title,
        newTitle: result?.normalizedName || bookmark.title,
        confidence: result?.confidence || 0
      };
    }).filter(item => {
      // 如果勾选了"只显示变化的项目"，则过滤掉未变化的项目
      return !showOnlyChanges || item.oldTitle !== item.newTitle;
    });

    setDisplayedResults(display);
    
    console.log('规范化结果显示准备完成', { 
      displayCount: display.length, 
      changedCount: display.filter(d => d.oldTitle !== d.newTitle).length
    });
  }, [results, selectedBookmarks, showOnlyChanges]);

  // 开始规范化
  const startNormalization = async () => {
    if (selectedBookmarks.length === 0) {
      console.log('没有选择书签，无法开始规范化');
      return;
    }

    console.log('开始书签名称规范化处理', { 
      selectedCount: selectedBookmarks.length 
    });
    
    await normalizeBookmarkNames(selectedBookmarks);
  };

  // 应用规范化结果
  const applyNormalizationResults = () => {
    console.log('应用名称规范化结果', { 
      resultsCount: results.length, 
      confidenceThreshold 
    });
    
    const updatedBookmarks = applyNormalizations(
      bookmarks, 
      results, 
      confidenceThreshold
    );
    
    onNormalizeComplete(updatedBookmarks);
    onClose();
  };

  // 获取信心度标签的颜色
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI书签名称规范化</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!normalizing && results.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                AI将会帮助您规范化书签名称为"网站描述 | 网站名称"的格式，使书签更加易于识别和管理。
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>选中了 {selectedBookmarks.length} 个书签</AlertTitle>
                <AlertDescription>
                  点击"开始规范化"按钮开始处理。规范化过程可能需要一些时间，取决于书签数量。
                </AlertDescription>
              </Alert>
            </div>
          )}

          {normalizing && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">正在进行AI名称规范化处理，请稍候...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-gray-500">
                已处理: {Math.round(selectedBookmarks.length * progress / 100)} / {selectedBookmarks.length}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>处理出错</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!normalizing && results.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">规范化结果</h3>
                  <p className="text-xs text-gray-500">
                    共处理 {results.length} 个书签，其中 {
                      results.filter(r => !r.isAlreadyNormalized && r.confidence >= confidenceThreshold).length
                    } 个需要更新
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-changes"
                    checked={showOnlyChanges}
                    onCheckedChange={setShowOnlyChanges}
                  />
                  <Label htmlFor="show-changes">只显示变化项</Label>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm">信心度阈值:</p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={confidenceThreshold}
                    onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <Badge variant="outline">{confidenceThreshold.toFixed(1)}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  只有信心度高于此阈值的规范化结果才会被应用
                </p>
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>原书签名称</TableHead>
                      <TableHead>规范化后名称</TableHead>
                      <TableHead className="w-[100px]">信心度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedResults.map((item, index) => (
                      <TableRow key={index} className={
                        item.confidence < confidenceThreshold ? "opacity-50" : ""
                      }>
                        <TableCell className="font-medium">{item.oldTitle}</TableCell>
                        <TableCell>
                          {item.oldTitle === item.newTitle ? (
                            item.newTitle
                          ) : (
                            <span className="text-blue-600">{item.newTitle}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getConfidenceBadgeColor(item.confidence)}>
                            {item.confidence.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {displayedResults.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          没有符合条件的结果
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          {!normalizing && results.length === 0 && (
            <>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={startNormalization} disabled={selectedBookmarks.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                开始规范化
              </Button>
            </>
          )}

          {normalizing && (
            <Button disabled>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              处理中...
            </Button>
          )}

          {!normalizing && results.length > 0 && (
            <>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button variant="outline" onClick={startNormalization}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新规范化
                </Button>
              </div>
              <Button onClick={applyNormalizationResults}>
                <Check className="mr-2 h-4 w-4" />
                应用改变 ({results.filter(r => !r.isAlreadyNormalized && r.confidence >= confidenceThreshold).length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NormalizeNameModal; 