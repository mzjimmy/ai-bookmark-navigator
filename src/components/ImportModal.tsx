
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bookmarks: any[]) => void;
}

const ImportModal = ({ isOpen, onClose, onImport }: ImportModalProps) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!fileContent) {
      toast({
        title: "错误",
        description: "请先选择文件",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const parsed = JSON.parse(fileContent);
      onImport(parsed);
      
      toast({
        title: "导入成功",
        description: `已成功导入${parsed.length}个书签`,
      });
      
      setFileContent(null);
      setFileName(null);
      onClose();
    } catch (error) {
      toast({
        title: "导入失败",
        description: "文件格式不正确",
        variant: "destructive",
      });
      console.error("Import error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入书签</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">从文件导入</TabsTrigger>
            <TabsTrigger value="browser">从浏览器导入</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                上传JSON格式的书签文件
              </p>
              <label className="cursor-pointer">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center">
                  <FileUp className="h-4 w-4 mr-2" />
                  选择文件
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {fileName && (
                <p className="text-sm text-gray-600 mt-2">已选择: {fileName}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="browser" className="py-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                从浏览器导入书签需要以下步骤：
              </p>
              <ol className="text-left text-sm text-gray-600 space-y-2 pl-5 list-decimal mb-6">
                <li>在浏览器中导出书签为HTML文件</li>
                <li>使用转换工具将HTML转为JSON格式</li>
                <li>在此处上传转换后的JSON文件</li>
              </ol>
              <p className="text-xs text-gray-500 mb-4">
                由于浏览器安全限制，我们无法直接访问您的浏览器书签
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={!fileContent || loading}
          >
            {loading ? "导入中..." : "导入"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
