import { OpenRouterClient, createOpenRouterClient } from '@/services/openRouter';

// 命名规范化接口
export interface NameNormalizationResult {
  originalName: string;
  normalizedName: string;
  description: string;
  websiteName: string;
  confidence: number;
  isAlreadyNormalized: boolean;
}

/**
 * 名称规范化服务
 * 负责将书签名称规范化为"网站描述 | 网站名称"格式
 */
export class NameNormalizer {
  private openRouter: OpenRouterClient;
  private normalizationCache: Map<string, NameNormalizationResult>;

  constructor(openRouter?: OpenRouterClient) {
    this.openRouter = openRouter || createOpenRouterClient();
    this.normalizationCache = new Map();
    
    console.log('NameNormalizer初始化完成', { cacheSize: this.normalizationCache.size });
  }

  /**
   * 规范化网站名称
   * @param originalName 原始名称
   * @param url 网站URL（可选，提供更准确的结果）
   * @returns 规范化后的结果
   */
  async normalizeBookmarkName(
    originalName: string, 
    url?: string
  ): Promise<NameNormalizationResult> {
    console.log('开始规范化书签名称:', { originalName, url });
    
    // 检查缓存
    const cacheKey = `${originalName}:${url || ''}`;
    if (this.normalizationCache.has(cacheKey)) {
      const cachedResult = this.normalizationCache.get(cacheKey)!;
      console.log('命名规范化缓存命中:', { 
        cacheKey, 
        originalName: cachedResult.originalName,
        normalizedName: cachedResult.normalizedName
      });
      return cachedResult;
    }
    
    // 检查是否已经符合规范格式 "描述 | 网站名称"
    const pipeRegex = /(.+)\s*\|\s*(.+)/;
    const pipeMatch = originalName.match(pipeRegex);
    
    if (pipeMatch) {
      const [_, description, websiteName] = pipeMatch;
      console.log('书签名称已符合规范格式:', { 
        originalName, 
        description: description.trim(), 
        websiteName: websiteName.trim() 
      });
      
      const result: NameNormalizationResult = {
        originalName,
        normalizedName: originalName, // 保持原样
        description: description.trim(),
        websiteName: websiteName.trim(),
        confidence: 1.0,
        isAlreadyNormalized: true
      };
      
      // 缓存结果
      this.normalizationCache.set(cacheKey, result);
      return result;
    }
    
    try {
      // 构建AI提示
      const prompt = this.buildNormalizationPrompt(originalName, url);
      
      console.log('命名规范化提示:', { promptTemplate: '规范化网站名称', params: { originalName, url } });
      
      // 调用AI进行名称规范化
      const completion = await this.openRouter.sendChatCompletion([
        { 
          role: 'system', 
          content: '你是一个专业的网站命名规范化助手，擅长将网站名称规范化为"网站描述 | 网站名称"的格式。' 
        },
        { role: 'user', content: prompt }
      ], {
        max_tokens: 300,
        temperature: 0.3
      });
      
      // 解析AI响应
      const response = completion.choices[0].message.content;
      const result = this.parseNormalizationResponse(originalName, response);
      
      console.log('命名处理结果:', { 
        originalName, 
        normalizedName: result.normalizedName,
        description: result.description,
        websiteName: result.websiteName,
        confidence: result.confidence
      });
      
      // 缓存结果
      this.normalizationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('名称规范化失败:', error);
      
      // 发生错误时返回原始名称
      const fallbackResult: NameNormalizationResult = {
        originalName,
        normalizedName: originalName,
        description: originalName,
        websiteName: '',
        confidence: 0,
        isAlreadyNormalized: false
      };
      
      return fallbackResult;
    }
  }
  
  /**
   * 批量规范化书签名称
   * @param namesWithUrls 名称和URL数组
   * @returns 规范化结果数组
   */
  async normalizeBookmarkNames(
    namesWithUrls: Array<{name: string, url?: string}>
  ): Promise<NameNormalizationResult[]> {
    console.log('开始批量规范化书签名称:', { count: namesWithUrls.length });
    
    const results: NameNormalizationResult[] = [];
    const batch = 5; // 每批处理的数量
    
    for (let i = 0; i < namesWithUrls.length; i += batch) {
      console.log(`处理批次 ${Math.floor(i/batch) + 1}/${Math.ceil(namesWithUrls.length/batch)}`);
      const batchItems = namesWithUrls.slice(i, i + batch);
      
      // 并行处理每一批
      const batchResults = await Promise.all(
        batchItems.map(item => this.normalizeBookmarkName(item.name, item.url))
      );
      
      results.push(...batchResults);
    }
    
    console.log('批量规范化完成:', { 
      totalProcessed: results.length,
      alreadyNormalized: results.filter(r => r.isAlreadyNormalized).length,
      highConfidence: results.filter(r => r.confidence > 0.8).length
    });
    
    return results;
  }

  /**
   * 验证规范化的名称
   * 确保结果符合"网站描述 | 网站名称"格式
   */
  validateNormalizedName(name: string): boolean {
    const regex = /(.+)\s*\|\s*(.+)/;
    return regex.test(name) && name.trim().length > 0;
  }
  
  /**
   * 构建用于名称规范化的AI提示
   */
  private buildNormalizationPrompt(originalName: string, url?: string): string {
    let prompt = `请将以下网站名称规范化为"网站描述 | 网站名称"的格式。

网站名称: "${originalName}"`;
    
    if (url) {
      prompt += `\n网站URL: ${url}`;
    }
    
    prompt += `\n\n你的任务是:
1. 分析网站名称，提取出网站的核心描述和实际网站名称
2. 将它们组合为"网站描述 | 网站名称"的格式
3. 网站描述应简明扼要地说明网站的主要功能或内容
4. 网站名称应是网站的官方名称或品牌名称
5. 如果原始名称已经很清晰，可以保留大部分内容

请按以下JSON格式返回结果:
{
  "normalizedName": "网站描述 | 网站名称",
  "description": "网站描述部分",
  "websiteName": "网站名称部分",
  "confidence": 信心值(0.0到1.0之间的数字)
}`;

    return prompt;
  }
  
  /**
   * 解析AI响应为规范化结果
   */
  private parseNormalizationResponse(
    originalName: string, 
    response: string
  ): NameNormalizationResult {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // 验证结果格式
        if (
          parsed.normalizedName && 
          typeof parsed.normalizedName === 'string' &&
          parsed.description &&
          parsed.websiteName &&
          typeof parsed.confidence === 'number'
        ) {
          return {
            originalName,
            normalizedName: parsed.normalizedName,
            description: parsed.description,
            websiteName: parsed.websiteName,
            confidence: parsed.confidence,
            isAlreadyNormalized: false
          };
        }
      }
      
      // 如果无法解析JSON或格式不正确，尝试简单解析
      const pipeMatch = response.match(/(.+)\s*\|\s*(.+)/);
      if (pipeMatch) {
        const [_, description, websiteName] = pipeMatch;
        return {
          originalName,
          normalizedName: `${description.trim()} | ${websiteName.trim()}`,
          description: description.trim(),
          websiteName: websiteName.trim(),
          confidence: 0.7,
          isAlreadyNormalized: false
        };
      }
      
      // 无法解析，返回原始名称
      console.warn('无法解析AI规范化响应:', { response });
      return {
        originalName,
        normalizedName: originalName,
        description: originalName,
        websiteName: '',
        confidence: 0.1,
        isAlreadyNormalized: false
      };
    } catch (error) {
      console.error('解析规范化响应错误:', error);
      return {
        originalName,
        normalizedName: originalName,
        description: originalName,
        websiteName: '',
        confidence: 0,
        isAlreadyNormalized: false
      };
    }
  }
  
  /**
   * 清除规范化缓存
   */
  clearCache(): void {
    console.log('清除名称规范化缓存', { previousSize: this.normalizationCache.size });
    this.normalizationCache.clear();
  }
}

// 创建并导出名称规范化实例
export const createNameNormalizer = (openRouter?: OpenRouterClient) => {
  return new NameNormalizer(openRouter);
}; 