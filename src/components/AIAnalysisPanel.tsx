
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookmarkType } from '@/types/bookmark';
import { Chart } from '@/components/ui/chart';
import { Brain } from 'lucide-react';

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
}

const AIAnalysisPanel = ({ bookmarks, aiSuggestions, onAnalyze, analyzing }: AIAnalysisPanelProps) => {
  const hasBookmarks = bookmarks.length > 0;
  const hasAnalysis = Object.keys(aiSuggestions).length > 0 && 
                      aiSuggestions.categories && 
                      aiSuggestions.categories.length > 0;

  // Chart data
  const categoryData = aiSuggestions.categories?.slice(0, 5).map(cat => ({
    name: cat.name,
    value: cat.count
  })) || [];

  const domainData = aiSuggestions.topDomains?.slice(0, 5).map(domain => ({
    name: domain.domain,
    value: domain.count
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">AI智能分析</h2>
          <p className="text-sm text-gray-500">基于您的书签进行智能分析和推荐</p>
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
              <p className="text-sm text-blue-600">这可能需要一点时间，请耐心等待</p>
            </div>
            <Progress value={45} className="h-2 mb-2" />
          </CardContent>
        </Card>
      )}

      {hasAnalysis && !analyzing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">书签分类分布</CardTitle>
              <CardDescription>书签按分类的分布情况</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <Chart
                type="pie"
                data={categoryData}
                index="name"
                categories={["value"]}
                valueFormatter={(value) => `${value}个`}
                className="h-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">热门网站域名</CardTitle>
              <CardDescription>最常访问的网站域名</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <Chart
                type="bar"
                data={domainData}
                index="name"
                categories={["value"]}
                valueFormatter={(value) => `${value}个`}
                className="h-full"
              />
            </CardContent>
          </Card>

          {aiSuggestions.insights && aiSuggestions.insights.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">AI洞察</CardTitle>
                <CardDescription>基于您的书签内容的智能分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSuggestions.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 rounded-full h-5 w-5 text-xs mr-2 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
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
                            <Badge variant="outline" className="bg-gray-100">当前: {bookmark.category}</Badge>
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
