interface WafRule {
  id: string;
  pattern: string;
  targetField: string;
  severity: string;
  category: string;
  enabled: boolean;
}

interface RequestData {
  method: string;
  path: string;
  headers: Record<string, any>;
  body?: any;
  query?: any;
}

interface AnalysisResult {
  action: "allow" | "block" | "challenge";
  score: number;
  matches: Array<{
    ruleId: string;
    field: string;
    value: string;
    severity: string;
  }>;
  reason: string;
}

interface Thresholds {
  blockThreshold: number;
  challengeThreshold: number;
  monitorThreshold: number;
}

class WafEngine {
  private customRules: WafRule[] = [];
  
  setCustomRules(rules: WafRule[]) {
    this.customRules = rules.filter(r => r.enabled);
  }
  
  analyzeRequest(request: RequestData, thresholds: Thresholds): AnalysisResult {
    const matches: AnalysisResult['matches'] = [];
    let totalScore = 0;
    
    const defaultPatterns = [
      { id: 'sql-injection', pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i, field: 'query', severity: 'high', score: 80 },
      { id: 'xss-basic', pattern: /<script[^>]*>.*?<\/script>/i, field: 'body', severity: 'high', score: 70 },
      { id: 'path-traversal', pattern: /\.\.(\/|\\)/i, field: 'path', severity: 'medium', score: 50 },
      { id: 'cmd-injection', pattern: /;|\||&|`|\$\(/i, field: 'query', severity: 'high', score: 75 },
    ];
    
    const allRules = [...defaultPatterns.map(p => ({
      id: p.id,
      pattern: p.pattern.source,
      targetField: p.field,
      severity: p.severity,
      category: 'owasp',
      enabled: true
    })), ...this.customRules];
    
    const searchableContent = {
      path: request.path,
      query: JSON.stringify(request.query || {}),
      body: JSON.stringify(request.body || {}),
      headers: JSON.stringify(request.headers || {}),
      request: JSON.stringify(request)
    };
    
    for (const rule of allRules) {
      if (!rule.enabled) continue;
      
      const targetContent = searchableContent[rule.targetField as keyof typeof searchableContent] || '';
      const regex = new RegExp(rule.pattern, 'i');
      
      if (regex.test(targetContent)) {
        const severityScore = rule.severity === 'critical' ? 100 
          : rule.severity === 'high' ? 75 
          : rule.severity === 'medium' ? 50 
          : 25;
        
        matches.push({
          ruleId: rule.id,
          field: rule.targetField,
          value: targetContent.substring(0, 100),
          severity: rule.severity
        });
        
        totalScore += severityScore;
      }
    }
    
    totalScore = Math.min(100, totalScore);
    
    let action: AnalysisResult['action'] = 'allow';
    let reason = 'Request passed all checks';
    
    if (totalScore >= thresholds.blockThreshold) {
      action = 'block';
      reason = `Threat score ${totalScore} exceeded block threshold ${thresholds.blockThreshold}`;
    } else if (totalScore >= thresholds.challengeThreshold) {
      action = 'challenge';
      reason = `Threat score ${totalScore} exceeded challenge threshold ${thresholds.challengeThreshold}`;
    } else if (totalScore >= thresholds.monitorThreshold) {
      reason = `Threat score ${totalScore} requires monitoring`;
    }
    
    return {
      action,
      score: totalScore,
      matches,
      reason
    };
  }
}

export const wafEngine = new WafEngine();
