import React, { useState, useEffect, useRef } from 'react';
import { chatService, datasetService } from '../services/api';
import { Send, Bot, User, Loader2, BarChart2 } from 'lucide-react';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { motion, AnimatePresence } from 'motion/react';

const Chat = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      const res = await datasetService.getAll();
      setDatasets(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedDataset(res.data.data[0].id.toString());
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!selectedDataset) {
      alert('請先選擇一個資料集再進行對話。');
      return;
    }

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.ask(selectedDataset, input);
      const aiMsg = { 
        role: 'bot', 
        content: res.data.data.answer,
        chart: res.data.data.chart,
        table: res.data.data.table
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', content: '抱歉，發生了一些錯誤。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI 數據對話</h1>
          <p className="text-slate-500 mt-1">選擇資料集並開始詢問問題，AI 將為您分析數據</p>
        </div>
        
        <select 
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">選擇資料集...</option>
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {!selectedDataset ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100">
                <BarChart2 size={48} className="text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">尚未選擇資料集</p>
                <p className="text-sm text-slate-500 max-w-xs">請從上方選單選擇一個資料集，AI 才能根據您的數據進行分析。</p>
              </div>
            </div>
          ) : messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <Bot size={48} className="text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">開始您的數據探索</p>
                <p className="text-sm text-slate-500">試試問：「哪個產品賣最好？」或「顯示最近六個月的趨勢」</p>
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-slate-200'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  
                  <div className="space-y-4">
                    <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>

                    {msg.chart && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Chart chartSpec={msg.chart} />
                      </motion.div>
                    )}

                    {msg.table && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <DataTable data={msg.table} />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shadow-sm">
                  <Bot size={20} />
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedDataset ? "輸入您的問題..." : "請先選擇資料集..."}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !selectedDataset}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !selectedDataset}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
