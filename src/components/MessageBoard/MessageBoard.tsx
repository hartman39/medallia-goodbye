import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  name: string;
  message: string;
  timestamp: Date;
  emoji?: string;
}

const MessageBoard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💙');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojis = ['💙', '🚀', '🎉', '😊', '👏', '🙌', '✨', '💪', '🎯', '🔥', '🌟', '❤️'];

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('medalliaMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('medalliaMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userName.trim()) return;

    setIsSubmitting(true);

    const message: Message = {
      id: Date.now().toString(),
      name: userName.trim(),
      message: newMessage.trim(),
      timestamp: new Date(),
      emoji: selectedEmoji
    };

    // Add to messages with animation
    setMessages(prev => [message, ...prev]);

    // Reset form
    setNewMessage('');
    setUserName('');

    // Show success feedback
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mt-4 sm:mt-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          💬 Message Board
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Leave a farewell message, memory, or well wishes!
        </p>
      </div>

      {/* Message Form */}
      <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 bg-gray-50 rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Choose an Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-purple-100 border-2 border-purple-500 transform scale-110'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  disabled={isSubmitting}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share a memory, thank you note, or farewell message..."
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {newMessage.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={!newMessage.trim() || !userName.trim() || isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-medium transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Posting...
            </span>
          ) : (
            `Post Message ${selectedEmoji}`
          )}
        </button>
      </form>

      {/* Messages Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Messages ({messages.length})
          </h3>
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all messages?')) {
                  setMessages([]);
                  localStorage.removeItem('medalliaMessages');
                }
              }}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              Be the first to leave a farewell message!
            </p>
          </div>
        ) : (
          <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 sm:p-4 border border-purple-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{message.emoji}</span>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">
                      {message.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatTimeAgo(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MessageBoard;