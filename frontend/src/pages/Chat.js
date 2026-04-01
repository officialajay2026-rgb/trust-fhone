import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(activeConversation._id, true), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/api/chat/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId, silent = false) => {
    try {
      const { data } = await api.get(`/api/chat/messages/${convId}`);
      setMessages(data.messages || []);
    } catch (error) {
      if (!silent) console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const { data } = await api.post('/api/chat/send', {
        conversationId: activeConversation._id,
        text: newMessage.trim()
      });
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p._id !== user?.id && p._id !== user?._id) || conv.participants?.[0];
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen py-4 sm:py-8" data-testid="chat-page">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-6">
          <MessageCircle className="inline w-7 h-7 mr-2 text-purple-400" />
          Messages
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Conversations List */}
          <Card className={`glass-card overflow-hidden flex flex-col ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto" data-testid="conversations-list">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting from a product page</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const unread = conv.unreadCount?.[user?.id] || conv.unreadCount?.[user?._id] || 0;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                        activeConversation?._id === conv._id ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''
                      }`}
                      data-testid={`conversation-${conv._id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-purple-400">
                            {other?.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium truncate">{other?.name || 'User'}</p>
                            {unread > 0 && (
                              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {conv.listing?.brand} {conv.listing?.model} - ₹{conv.listing?.price?.toLocaleString()}
                          </p>
                          {conv.lastMessage?.text && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage.text}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Messages Panel */}
          <Card className={`glass-card overflow-hidden flex flex-col lg:col-span-2 ${!activeConversation ? 'hidden lg:flex' : 'flex'}`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <button onClick={() => setActiveConversation(null)} className="lg:hidden text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-400">
                      {getOtherParticipant(activeConversation)?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{getOtherParticipant(activeConversation)?.name}</p>
                    <p className="text-xs text-slate-400">
                      {activeConversation.listing?.brand} {activeConversation.listing?.model}
                    </p>
                  </div>
                  {activeConversation.listing?.images?.[0]?.url && (
                    <img src={activeConversation.listing.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-container">
                  {messages.map((msg) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender?._id === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                          }`}
                          data-testid={`message-${msg._id}`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-purple-200' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border-white/10 text-white"
                    data-testid="message-input"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} className="gradient-primary" data-testid="send-message-button">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
