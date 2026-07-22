import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Search, RefreshCw, User } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function SystemMessagesPage() {
  const { userId } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [compose, setCompose] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadThreads = async () => {
    try { const r = await api.messages.getThreads(); setThreads(r.threads || []); } catch (_) {}
    setLoading(false);
  };

  const loadMessages = async (threadId) => {
    try { const r = await api.messages.getThread(threadId); setMessages(r.thread?.messages || []); } catch (_) {}
  };

  const loadRecipients = async () => {
    try { const r = await api.messages.getRecipients(); setRecipients(r.recipients || []); } catch (_) {}
  };

  useEffect(() => { loadThreads(); const i = setInterval(loadThreads, 15000); return () => clearInterval(i); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openThread = (thread) => { setActiveThread(thread); loadMessages(thread.id); };

  const handleNewChat = async () => {
    if (!selectedRecipient || !subject.trim()) return;
    try {
      const r = await api.messages.createThread({ participant_id: selectedRecipient, subject: subject.trim(), content: text });
      setCompose(false);
      setSelectedRecipient(''); setSubject(''); setText('');
      loadThreads();
      if (r.thread) openThread(r.thread);
      loadRecipients();
    } catch (err) { alert(err.message); }
  };

  const handleSend = async () => {
    if (!text.trim() || !activeThread) return;
    try {
      const r = await api.messages.reply(activeThread.id, text);
      setMessages(prev => [...prev, r.message]);
      setText('');
      loadThreads();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Communication</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Messages</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex" style={{ height: '65vh' }}>
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="relative flex-1 mr-2">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-full" />
            </div>
            <button onClick={() => { setCompose(true); loadRecipients(); }} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(t => (
              <button key={t.id} onClick={() => openThread(t)} className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${activeThread?.id === t.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                <div className="text-sm font-semibold text-slate-700 truncate">{t.subject || 'No subject'}</div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{t.last_message || 'No messages'}</div>
              </button>
            ))}
            {threads.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No conversations yet. Click + to start one.</div>}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeThread ? (
            <>
              <div className="p-3 border-b bg-slate-50 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">{activeThread.subject}</span>
                <span className="text-xs text-slate-400 ml-auto">{activeThread.participants?.length} participants</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((m, i) => {
                  const isMe = m.author_id === userId;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'}`}>
                        <p>{m.content}</p>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {m.author_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 p-2 text-sm border border-slate-200 rounded-xl" />
                <button onClick={handleSend} disabled={!text.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"><Send size={16} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>

      {compose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">New Message</h3>
            <select value={selectedRecipient} onChange={e => setSelectedRecipient(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="">Select recipient...</option>
              {recipients.map(r => <option key={r.id} value={r.id}>{r.full_name || r.username} ({r.role})</option>)}
            </select>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Message..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCompose(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleNewChat} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
