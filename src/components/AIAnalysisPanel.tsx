import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookmarkType } from '@/types/bookmark';
import { Chart } from '@/components/ui/chart';
import { Brain, AlertTriangle } from 'lucide-react';

interface AIAnalysisPanelProps {
  bookmarks: BookmarkType[];
  aiSuggestions: {
    categories?: { name: string; count: number }[];
    topDomains?: { domain: string; count: number }[];
    insights?: string[];
    categoryRecommendations?: { bookmarkId: string; categories: string[] }[];
  };
  onAnalyze: () => void;
  analyzing: boolean;
  error?: string | null;
}

const AIAnalysisPanel = ({ bookmarks, aiSuggestions, onAnalyze, analyzing, error }: AIAnalysisPanelProps) => {
  const hasBookmarks = bookmarks.length > 0;
  const hasAnalysis = Object.keys(aiSuggestions).length > 0 && 
                      ((aiSuggestions.categories && aiSuggestions.categories.length > 0) || 
                       (aiSuggestions.insights && aiSuggestions.insights.length > 0));

  // Chart data
  const categoryData = aiSuggestions.categories?.slice(0, 5).map(cat => ({
    name: cat.name,
    dataKey: cat.count
  })) || [];

  const domainData = aiSuggestions.topDomains?.slice(0, 5).map(domain => ({
    name: domain.domain,
    dataKey: domain.count
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">AI智能分析</h2>
          <p className="text-sm text-gray-500">基于OpenRouter DeepSeek模型进行智能分析</p>
        </div>
        <Button 
          onClick={onAnalyze} 
          disabled={analyzing || !hasBookmarks}
          className="gap-2"
        >
          <Brain size={16} />
          {analyzing ? "分析中..." : "开始分析"}
        </Button>
      </div>

      {!hasBookmarks && (
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">请先添加或导入书签以进行分析</p>
          </CardContent>
        </Card>
      )}

      {analyzing && (
        <Card className="border border-blue-100 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <Brain className="h-10 w-10 text-blue-500 mx-auto mb-2 animate-pulse" />
              <h3 className="font-medium text-blue-800">正在分析您的书签</h3>
              <p className="text-sm text-blue-600">正在调用DeepSeek V3 0324模型，请耐心等待</p>
            </div>
            <Progress value={45} className="h-2 mb-2" />
            <p className="text-xs text-center text-blue-500 mt-2">由OpenRouter提供AI服务支持</p>
          </CardContent>
        </Card>
      )}

      {error && !analyzing && (
        <Card className="border border-red-100 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800">分析过程中出现错误</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>您可以尝试重新分析或稍后再试</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasAnalysis && !analyzing && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiSuggestions.categories && aiSuggestions.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">书签分类分布</CardTitle>
                <CardDescription>书签按分类的分布情况</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <Chart
                  type="pie"
                  data={categoryData}
                  dataKey="dataKey"
                  nameKey="name"
                  height="100%"
                  width="100%"
                />
              </CardContent>
            </Card>
          )}

          {aiSuggestions.topDomains && aiSuggestions.topDomains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">热门网站域名</CardTitle>
                <CardDescription>最常访问的网站域名</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <Chart
                  type="bar"
                  data={domainData}
                  dataKey="dataKey"
                  nameKey="name"
                  height="100%"
                  width="100%"
                />
              </CardContent>
            </Card>
          )}

          {aiSuggestions.insights && aiSuggestions.insights.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">AI洞察</CardTitle>
                <CardDescription>基于DeepSeek V3 0324大语言模型的分析结果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {aiSuggestions.insights.map((insight, index) => (
                    <div key={index} className="mb-4 whitespace-pre-line">
                      {insight}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-right text-gray-400 mt-4">
                  由OpenRouter提供的DeepSeek V3 0324模型生成
                </div>
              </CardContent>
            </Card>
          )}

          {aiSuggestions.categoryRecommendations && aiSuggestions.categoryRecommendations.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">分类推荐</CardTitle>
                <CardDescription>AI推荐的书签分类调整</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiSuggestions.categoryRecommendations.map((rec, index) => {
                    const bookmark = bookmarks.find(b => b.id === rec.bookmarkId);
                    if (!bookmark) return null;
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{bookmark.title}</p>
                          <p className="text-sm text-gray-500">{bookmark.url}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="bg-gray-100">当前: {bookmark.category || '未分类'}</Badge>
                            <Badge variant="outline" className="bg-green-100">推荐: {rec.categories[0]}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">应用</Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
