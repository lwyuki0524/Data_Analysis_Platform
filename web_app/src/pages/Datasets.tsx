import React, { useState, useEffect } from 'react';
import { datasetService } from '../services/api';
import { Upload, Trash2, FileText, Plus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const Datasets = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDatasets = async () => {
    try {
      const res = await datasetService.getAll();
      setDatasets(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await datasetService.upload(file);
      fetchDatasets();
    } catch (err) {
      console.error(err);
      alert('上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此資料集嗎？')) return;
    try {
      await datasetService.delete(id);
      fetchDatasets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">資料集管理</h1>
          <p className="text-slate-500 mt-1">上傳並管理您的 CSV、Excel 或 JSON 資料檔案</p>
        </div>
        
        <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all shadow-lg shadow-blue-200 active:scale-95">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
          <span>{uploading ? '上傳中...' : '新增資料集'}</span>
          <input type="file" className="hidden" onChange={handleUpload} accept=".csv,.xlsx,.json" disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">尚未有任何資料集</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">點擊右上角的按鈕來上傳您的第一個資料集進行分析</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((ds) => (
            <motion.div
              key={ds.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <FileText size={24} />
                </div>
                <button
                  onClick={() => handleDelete(ds.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 truncate" title={ds.name}>{ds.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                  {ds.source_type}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(ds.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Datasets;
