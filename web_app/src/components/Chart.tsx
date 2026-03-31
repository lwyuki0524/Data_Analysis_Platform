import React from 'react';
import { VegaEmbed } from 'react-vega';

interface ChartProps {
  chartSpec: string | object | null; // This will receive the Altair JSON spec
  title?: string;
}

const Chart = ({ chartSpec, title }: ChartProps) => {
  if (!chartSpec) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center text-slate-500">
        無圖表數據
      </div>
    );
  }
  
  let processedSpec: any;
  try {
    const parsed = typeof chartSpec === 'string' ? JSON.parse(chartSpec) : chartSpec;
    processedSpec = {
      ...parsed,
      width: "container", 
      height: "container",
      autosize: { type: 'fit', contains: 'padding' }
    };
  } catch (e) {
    console.error('Failed to parse chart spec:', e);
    return <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center text-red-500">圖表解析錯誤</div>;
  }
  
  return (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
    {title && ( <h3 className="text-sm font-bold text-slate-700 mb-4 truncate flex-none"> {title} </h3> )}
    {/* 限制 Vega 計算的容器 : w-full min-w-0 確保它不會被內部撐開。 flex-1 min-h-0 確保它會填滿剩下的高度。 */}
      <div className="flex-1 w-full min-w-0 min-h-0 relative"> 
        {/*使用絕對定位，強制切斷畫布對父容器的寬度影響 */}
        <div className="absolute inset-0"> 
          <VegaEmbed 
            spec={processedSpec} width="container" height="container" options={{ actions: false, renderer: 'svg' }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
  </div>
);
};

export default Chart;
