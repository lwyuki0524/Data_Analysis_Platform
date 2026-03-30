import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { Sparkles, TrendingUp, TrendingDown, Loader2, Plus } from 'lucide-react';
import Chart from '../components/Chart';
import { motion } from 'motion/react';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getLatest();
      setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await dashboardService.generate();
      setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">數據儀表板</h1>
          <p className="text-slate-500 mt-1">由 AI 自動生成的關鍵指標與趨勢分析</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={20} />}
          <span>{generating ? '生成中...' : '重新生成儀表板'}</span>
        </button>
      </div>

      {!dashboard ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-blue-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">尚未生成儀表板</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">點擊右上角的按鈕，讓 AI 為您分析現有數據並生成視覺化儀表板</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboard.widgets.filter((w: any) => w.type === 'kpi').map((kpi: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h2 className="text-2xl font-bold text-slate-900">{kpi.value}</h2>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${
                    kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {kpi.trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.trend}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.widgets.filter((w: any) => w.type !== 'kpi').map((chart: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Chart 
                  title={chart.title}
                  chartSpec={chart.chart} // Pass the Altair JSON spec directly
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
