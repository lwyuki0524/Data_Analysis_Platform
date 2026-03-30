import React from 'react';
import { VegaEmbed } from 'react-vega';

interface ChartProps {
  chartSpec: string | object | null; // This will receive the Altair JSON spec
  title?: string;
}

function normalizeVegaLite(spec: any) {
  if (!spec.datasets) return spec;

  const datasetKey = spec.data?.name;
  if (!datasetKey) return spec;

  const values = spec.datasets[datasetKey];

  return {
    ...spec,
    data: {
      values
    },
    datasets: undefined,
  };
}

const Chart = ({ chartSpec, title }: ChartProps) => {
  if (!chartSpec) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center text-slate-500">
        無圖表數據
      </div>
    );
  }
  
  let parsedSpec: any;
  try {
    parsedSpec = typeof chartSpec === 'string' ? JSON.parse(chartSpec) : chartSpec;
  } catch (e) {
    console.error('Failed to parse chart spec:', e);
    return <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center text-red-500">圖表解析錯誤</div>;
  }
  
  const processedSpec = {
    ...normalizeVegaLite(parsedSpec),
    autosize: { type: 'fit' }
  };
  
  return (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
    {title && <h3 className="text-lg font-semibold text-slate-800 mb-4 flex-none">{title}</h3>}
    
    <div className="flex-1 w-full min-h-0"> 
      <VegaEmbed 
        spec={processedSpec} width="container" height="container" options={{ actions: false }} // 建議關閉選單，省下更多空間
      />
    </div>
  </div>
);
};

export default Chart;
