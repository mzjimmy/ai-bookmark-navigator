import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { parseHtmlBookmarks, MAX_HTML_BOOKMARKS } from "@/utils/bookmarkParser";
import { useDropzone } from 'react-dropzone';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bookmarks: any[]) => void;
}

const ImportModal = ({ isOpen, onClose, onImport }: ImportModalProps) => {
  const [htmlContent, setHtmlContent] = useState("");
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      setHtmlContent(content);
    };

    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');

    reader.readAsText(file);
  }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop, 
    accept: {
      'text/html': ['.html', '.htm'],
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHtmlContent(e.target.value);
  };

  const handleImport = () => {
    try {
      const bookmarks = parseHtmlBookmarks(htmlContent);
      if (bookmarks.length === 0) {
        toast({
          title: "未找到书签",
          description: "请检查HTML内容是否包含有效的书签数据。",
        });
        return;
      }
      onImport(bookmarks);
      onClose();
      toast({
        title: "导入成功",
        description: `成功导入 ${bookmarks.length} 个书签。`,
      });
    } catch (error) {
      console.error("导入错误:", error);
      toast({
        title: "导入错误",
        description: "解析HTML内容时出错，请检查文件格式。",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "错误",
        description: "未选择任何文件。",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const bookmarks = parseHtmlBookmarks(content);
         
        if (bookmarks.length > MAX_HTML_BOOKMARKS) {
          toast({
            title: "导入限制",
            description: `只导入前${MAX_HTML_BOOKMARKS}个书签以避免存储空间不足。`,
            variant: "destructive",
          });
        }
        
        onImport(bookmarks);
        onClose();
        toast({
          title: "导入成功",
          description: `成功导入 ${bookmarks.length} 个书签。`,
        });
      } catch (parseError) {
        console.error("解析错误:", parseError);
        toast({
          title: "解析错误",
          description: "解析HTML文件时出错，请检查文件格式。",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "文件读取错误",
        description: "无法读取文件，请检查文件是否损坏。",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="outline">导入书签</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入HTML书签</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="import-html">
              将您的书签从HTML文件导入
            </Label>
            <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 cursor-pointer">
              <input {...getInputProps()} id="import-html" />
              {
                isDragActive ?
                  <p className="text-center">将文件拖到此处 ...</p> :
                  <p className="text-center">拖放文件到此处，或点击选择文件</p>
              }
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="html-content">
              或者，粘贴HTML内容
            </Label>
            <Input
              id="html-content"
              className="col-span-3"
              value={htmlContent}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <Button onClick={handleImport}>导入</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
