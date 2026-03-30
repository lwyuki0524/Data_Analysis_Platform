export interface MockAiResponse {
  answer: string;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    x: string[];
    y: number[];
  };
  table?: any[];
}

export const generateMockChatResponse = (message: string): MockAiResponse => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('最多') || lowerMsg.includes('最好') || lowerMsg.includes('最高')) {
    return {
      answer: "根據分析，產品 A 的銷量最高，達到了 120 單位。",
      chart: {
        type: 'bar',
        x: ["產品 A", "產品 B", "產品 C", "產品 D"],
        y: [120, 90, 60, 45]
      },
      table: [
        { product: "產品 A", sales: 120, growth: "+15%" },
        { product: "產品 B", sales: 90, growth: "+5%" },
        { product: "產品 C", sales: 60, growth: "-2%" },
        { product: "產品 D", sales: 45, growth: "+10%" }
      ]
    };
  }

  if (lowerMsg.includes('趨勢') || lowerMsg.includes('變化') || lowerMsg.includes('時間')) {
    return {
      answer: "過去六個月的銷售趨勢顯示穩定成長，但在三月有小幅回落。",
      chart: {
        type: 'line',
        x: ["一月", "二月", "三月", "四月", "五月", "六月"],
        y: [100, 150, 130, 180, 210, 250]
      },
      table: [
        { month: "一月", revenue: 10000 },
        { month: "二月", revenue: 15000 },
        { month: "三月", revenue: 13000 },
        { month: "四月", revenue: 18000 },
        { month: "五月", revenue: 21000 },
        { month: "六月", revenue: 25000 }
      ]
    };
  }

  if (lowerMsg.includes('比例') || lowerMsg.includes('佔比')) {
    return {
      answer: "市場佔有率分佈如下，主要由前三大品牌佔據 80% 的市場。",
      chart: {
        type: 'pie',
        x: ["品牌 A", "品牌 B", "品牌 C", "其他"],
        y: [40, 25, 15, 20]
      },
      table: [
        { brand: "品牌 A", marketShare: "40%" },
        { brand: "品牌 B", marketShare: "25%" },
        { brand: "品牌 C", marketShare: "15%" },
        { brand: "其他", marketShare: "20%" }
      ]
    };
  }

  // Default response
  return {
    answer: "這是一個通用的資料分析結果。您可以詢問有關『趨勢』、『比例』或『最高銷量』的問題來獲得更具體的圖表。",
    table: [
      { id: 1, category: "電子產品", value: 500 },
      { id: 2, category: "服裝", value: 300 },
      { id: 3, category: "食品", value: 450 }
    ]
  };
};

export const generateMockDashboard = () => {
  return {
    widgets: [
      { type: "kpi", title: "總銷售額", value: "$1,234,567", trend: "+12.5%" },
      { type: "kpi", title: "活躍用戶", value: "8,432", trend: "+5.2%" },
      { 
        type: "line", 
        title: "月度營收趨勢",
        data: [
          { name: "Jan", value: 400 },
          { name: "Feb", value: 300 },
          { name: "Mar", value: 600 },
          { name: "Apr", value: 800 },
          { name: "May", value: 500 }
        ]
      },
      { 
        type: "bar", 
        title: "產品類別分佈",
        data: [
          { name: "手機", value: 120 },
          { name: "電腦", value: 90 },
          { name: "配件", value: 60 },
          { name: "軟體", value: 45 }
        ]
      }
    ]
  };
};
