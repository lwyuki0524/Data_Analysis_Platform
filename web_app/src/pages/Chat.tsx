import React, { useState, useEffect, useRef } from 'react';
import { chatService, datasetService } from '../services/api';
import { Send, Bot, User, Loader2, BarChart2, Trash2, Plus, MessageSquare, ChevronRight, Edit2, Check, X } from 'lucide-react';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { motion, AnimatePresence } from 'motion/react';

const Chat = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const dsRes = await datasetService.getAll();
      setDatasets(dsRes.data.data);
      if (dsRes.data.data.length > 0) {
        setSelectedDataset(dsRes.data.data[0].id.toString());
      }

      const roomsRes = await chatService.getRooms();
      setRooms(roomsRes.data.data);
      if (roomsRes.data.data.length > 0) {
        setActiveRoomId(roomsRes.data.data[0].id);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeRoomId) {
        setMessages([]);
        return;
      }
      try {
        const res = await chatService.getHistory(activeRoomId);
        const history = res.data.data;
        const formattedMessages: any[] = [];
        history.forEach((record: any) => {
          formattedMessages.push({
            id: record.id,
            role: 'user',
            content: record.question
          });
          formattedMessages.push({
            id: record.id,
            role: 'bot',
            content: record.answer,
            chart: record.chart,
            table: record.table
          });
        });
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [activeRoomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateRoom = async () => {
    const now = new Date();
    const defaultName = `對話 ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const res = await chatService.createRoom(defaultName, selectedDataset || null);
      const newRoom = res.data.data;
      setRooms(prev => [newRoom, ...prev]);
      setActiveRoomId(newRoom.id);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleRenameRoom = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await chatService.updateRoom(id, editingName);
      setRooms(prev => prev.map(r => r.id === id ? { ...r, name: editingName } : r));
      setEditingRoomId(null);
    } catch (err) {
      console.error('Failed to rename room:', err);
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此聊天室及其所有對話嗎？')) return;

    try {
      await chatService.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      if (activeRoomId === id) {
        setActiveRoomId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activeRoomId) return;
    
    if (!selectedDataset) {
      alert('請先選擇一個資料集再進行對話。');
      return;
    }

    const isFirstMessage = messages.length === 0;
    const currentInput = input;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.ask(selectedDataset, activeRoomId, currentInput);
      const data = res.data.data;
      const aiMsg = { 
        id: data.id,
        role: 'bot', 
        content: data.answer,
        chart: data.chart,
        table: data.table
      };
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1].id = data.id;
        }
        return [...newMessages, aiMsg];
      });

      // If it's the first message, update the room name to the question
      if (isFirstMessage) {
        const truncatedName = currentInput.length > 30 ? currentInput.substring(0, 30) + '...' : currentInput;
        await chatService.updateRoom(activeRoomId, truncatedName);
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, name: truncatedName } : r));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', content: '抱歉，發生了一些錯誤。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm('確定要刪除這筆對話紀錄嗎？')) return;
    try {
      await chatService.deleteHistory(id);
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      console.error('Failed to delete history:', err);
      alert('刪除失敗');
    }
  };

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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">聊天室</label>
            <button 
              onClick={handleCreateRoom}
              className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
              title="新增聊天室"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {rooms.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-400">尚無聊天室</p>
              </div>
            ) : (
              rooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => {
                    if (editingRoomId !== room.id) {
                      setActiveRoomId(room.id);
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                    activeRoomId === room.id 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                      : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
                >
                  <MessageSquare size={18} className={activeRoomId === room.id ? 'text-blue-600' : 'text-slate-400'} />
                  
                  {editingRoomId === room.id ? (
                    <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameRoom(room.id);
                          if (e.key === 'Escape') setEditingRoomId(null);
                        }}
                        className="flex-1 bg-white border border-blue-200 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => handleRenameRoom(room.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingRoomId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium truncate">{room.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRoomId(room.id);
                            setEditingName(room.name);
                          }}
                          className="p-1 hover:text-blue-600 transition-all"
                          title="重新命名"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRoom(e, room.id)}
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

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {activeRoomId ? (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {rooms.find(r => r.id === activeRoomId)?.name}
                </h2>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.length === 0 && (
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
                    key={msg.id ? `${msg.id}-${msg.role}` : i}
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
                      
                      <div className="space-y-4 relative group">
                        <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>

                        {msg.role === 'bot' && msg.id && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -right-10 top-0 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="刪除紀錄"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

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
                disabled={!input.trim() || loading || !activeRoomId || !selectedDataset}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:shadow-none"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100">
              <MessageSquare size={40} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-xl font-bold text-slate-800 mb-2">選擇或建立聊天室</h3>
              <p className="text-slate-500 text-sm">
                請從左側選擇一個現有的聊天室，或點擊「+」建立一個新的對話。
              </p>
            </div>
            <button 
              onClick={handleCreateRoom}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <Plus size={20} />
              建立新對話
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
