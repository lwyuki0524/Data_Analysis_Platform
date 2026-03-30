import React, { useState, useEffect } from 'react';
import { dashboardService, datasetService } from '../services/api';
import { Sparkles, TrendingUp, TrendingDown, Loader2, Plus, Layout, Trash2, Edit2, Check, X, MessageSquare, ChevronRight } from 'lucide-react';
import Chart from '../components/Chart';
import { motion, AnimatePresence } from 'motion/react';

const Dashboard = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isAutoSelect, setIsAutoSelect] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      const [dsRes, dbRes] = await Promise.all([
        datasetService.getAll(),
        dashboardService.getAll()
      ]);
      setDatasets(dsRes.data.data);
      setDashboards(dbRes.data.data);
      
      if (dbRes.data.data.length > 0) {
        handleSelectDashboard(dbRes.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      datasetService.getColumns(selectedDataset).then(res => {
        setAvailableColumns(res.data.data);
        setSelectedColumns([]);
      }).catch(err => console.error(err));
    } else {
      setAvailableColumns([]);
    }
  }, [selectedDataset]);

  const handleSelectDashboard = async (id: string) => {
    setActiveDashboardId(id);
    try {
      const res = await dashboardService.getById(id);
      setCurrentDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDashboard = async () => {
    if (!selectedDataset) {
      alert('請先選擇一個資料集。');
      return;
    }
    
    const now = new Date();
    const defaultName = `儀表板 ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    setGenerating(true);
    try {
      const res = await dashboardService.create(
        defaultName, 
        selectedDataset, 
        isAutoSelect ? undefined : selectedColumns
      );
      const newDashboard = res.data.data;
      setDashboards(prev => [newDashboard, ...prev]);
      setActiveDashboardId(newDashboard.id);
      setCurrentDashboard(newDashboard);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await dashboardService.update(id, editingName);
      setDashboards(prev => prev.map(d => d.id === id ? { ...d, name: editingName } : d));
      if (activeDashboardId === id) {
        setCurrentDashboard((prev: any) => ({ ...prev, name: editingName }));
      }
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此儀表板嗎？')) return;
    
    try {
      await dashboardService.delete(id);
      setDashboards(prev => prev.filter(d => d.id !== id));
      if (activeDashboardId === id) {
        setActiveDashboardId(null);
        setCurrentDashboard(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to convert simple chart data to Vega-Lite spec
  const getVegaSpec = (chart: any) => {
    const spec: any = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: chart.title,
      data: {
        values: chart.data
      },
      mark: chart.type === 'line' ? 'line' : 'bar',
      encoding: {
        x: { field: 'name', type: 'nominal', title: '類別' },
        y: { field: 'value', type: 'quantitative', title: '數值' }
      },
      width: 'container',
      height: 'container'
    };
    return JSON.stringify(spec);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-72 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">資料集</label>
          <select 
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          >
            <option value="">選擇資料集...</option>
            {datasets.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-center px-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">我的儀表板</label>
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={generating}
              className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors disabled:opacity-50"
              title="新增儀表板"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {dashboards.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-400">尚無儀表板</p>
              </div>
            ) : (
              dashboards.map(db => (
                <div
                  key={db.id}
                  onClick={() => {
                    if (editingId !== db.id) {
                      handleSelectDashboard(db.id);
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                    activeDashboardId === db.id 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                      : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
                >
                  <Layout size={18} className={activeDashboardId === db.id ? 'text-blue-600' : 'text-slate-400'} />
                  
                  {editingId === db.id ? (
                    <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(db.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-white border border-blue-200 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => handleRename(db.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium truncate">{db.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(db.id);
                            setEditingName(db.name);
                          }}
                          className="p-1 hover:text-blue-600 transition-all"
                          title="重新命名"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, db.id)}
                          className="p-1 hover:text-red-500 transition-all"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-2">
        {!currentDashboard ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100">
              <Layout size={40} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-xl font-bold text-slate-800 mb-2">管理您的儀表板</h3>
              <p className="text-slate-500 text-sm">
                請先選擇資料集，然後點擊「+」讓 AI 為您生成專屬的數據儀表板。
              </p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              {generating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              建立新儀表板
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{currentDashboard.name}</h1>
                <p className="text-slate-500 mt-1">由 AI 自動生成的關鍵指標與趨勢分析</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* KPI Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentDashboard.widgets.filter((w: any) => w.type === 'kpi').map((kpi: any, i: number) => (
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                {currentDashboard.widgets.filter((w: any) => w.type !== 'kpi').map((chart: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <Chart 
                      chartSpec={getVegaSpec(chart)}
                      title={chart.title}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Dashboard Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">建立新儀表板</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">選擇資料集</label>
                  <select 
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">選擇資料集...</option>
                    {datasets.map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">分析模式</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setIsAutoSelect(true)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isAutoSelect ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        AI 自動判斷
                      </button>
                      <button 
                        onClick={() => setIsAutoSelect(false)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isAutoSelect ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        手動選擇欄位
                      </button>
                    </div>
                  </div>

                  {!isAutoSelect && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">選擇重點分析欄位</label>
                      {availableColumns.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                          {availableColumns.map(col => (
                            <button
                              key={col}
                              onClick={() => toggleColumn(col)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                selectedColumns.includes(col)
                                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">請先選擇資料集以載入欄位</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateDashboard}
                  disabled={generating || !selectedDataset || (!isAutoSelect && selectedColumns.length === 0)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  生成儀表板
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
