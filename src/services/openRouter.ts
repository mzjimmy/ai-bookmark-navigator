import { useState } from 'react';

// OpenRouter API接口定义
export interface OpenRouterCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface OpenRouterCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    index: number;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 自定义错误类
export class OpenRouterError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number, code: string = 'unknown_error') {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
    this.code = code;
  }
}

// 从环境变量获取配置
const getEnvConfig = () => {
  return {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    baseUrl: import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: import.meta.env.VITE_OPENROUTER_MODEL || 'deepseek/deepseek-v3-0324',
  };
};

// OpenRouter客户端类
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxRetries: number;

  constructor(
    apiKey?: string, 
    baseUrl?: string, 
    model?: string,
    maxRetries: number = 3
  ) {
    const config = getEnvConfig();
    this.apiKey = apiKey || config.apiKey;
    this.baseUrl = baseUrl || config.baseUrl;
    this.model = model || config.model;
    this.maxRetries = maxRetries;
    
    if (!this.apiKey) {
      console.warn('OpenRouter API密钥未设置，请检查环境变量配置');
    }
    
    console.log('OpenRouterClient初始化:', { 
      baseUrl: this.baseUrl, 
      model: this.model, 
      maxRetries,
      hasApiKey: !!this.apiKey 
    });
  }

  // 发送聊天补全请求
  async sendChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterCompletionResponse> {
    if (!this.apiKey) {
      throw new OpenRouterError('API密钥未设置，无法发送请求', 401, 'missing_api_key');
    }
    
    const startTime = Date.now();
    let retryCount = 0;
    
    const requestBody: OpenRouterCompletionRequest = {
      model: this.model,
      messages,
      ...options
    };

    console.log('OpenRouter API请求:', { 
      endpoint: 'chat/completions', 
      model: this.model,
      messagesCount: messages.length
    });

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('OpenRouter API错误:', { 
            status: response.status, 
            statusText: response.statusText, 
            errorData 
          });
          
          throw new OpenRouterError(
            errorData.error?.message || response.statusText,
            response.status,
            errorData.error?.code
          );
        }

        const data = await response.json();
        const endTime = Date.now();
        
        console.log('OpenRouter API响应:', { 
          responseTime: endTime - startTime,
          tokenUsage: data.usage,
          choicesCount: data.choices?.length
        });
        
        return data;
      } catch (error) {
        retryCount++;
        if (retryCount > this.maxRetries) {
          console.error('OpenRouter API重试失败:', { 
            error, 
            retryCount, 
            maxRetries: this.maxRetries 
          });
          throw error;
        }
        
        console.log('OpenRouter API重试:', { 
          error, 
          retryCount, 
          maxRetries: this.maxRetries 
        });
        
        // 指数退避重试策略
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }

    // 这行代码不应该被执行到，但TypeScript需要返回值
    throw new Error('无法完成API请求');
  }

  // 分析书签数据
  async analyzeBookmarks(bookmarkData: any): Promise<string> {
    const prompt = `分析以下书签数据，并提供以下信息：
1. 主要分类及各自数量
2. 最常访问的网站域名
3. 基于书签内容的洞察
4. 为未分类书签推荐分类

书签数据：${JSON.stringify(bookmarkData)}`;

    try {
      const completion = await this.sendChatCompletion([
        { role: 'system', content: '你是一个专业的书签分析助手，擅长分析用户的书签数据并提供有用的洞察。' },
        { role: 'user', content: prompt }
      ], {
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('书签分析失败:', error);
      throw error;
    }
  }
}

// 创建和导出OpenRouter实例
export const createOpenRouterClient = (
  apiKey?: string,
  baseUrl?: string,
  model?: string
) => {
  return new OpenRouterClient(apiKey, baseUrl, model);
}; 