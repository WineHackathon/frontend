import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, Lock, ArrowRight } from 'lucide-react';
import { SommelierWebSocketClient } from '../services/sommelierWs';
import WineCard from './WineCard';
import { getAuthToken } from '../services/api';

export default function SommelierChat({ isOpen, onClose, onOpenAuth, onSelectWine, initialPrompt }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [onboardingAnswers, setOnboardingAnswers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isTyping, setIsTyping] = useState(false);
  const wsClientRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  const isAuth = !!getAuthToken();

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const client = new SommelierWebSocketClient({
      onMessage: (msg) => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      },
      onQuestion: (q) => {
        setCurrentQuestion(q);
        scrollToBottom();
      },
      onCompleted: (data) => {
        setIsTyping(false);
        setCurrentQuestion(null);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            candidates: data.candidates,
            registration_prompt: data.registration_prompt,
          }
        ]);
        scrollToBottom();
      },
      onRegistrationRequired: (data) => {
        setIsTyping(false);
        onOpenAuth({
          title: 'Авторизуйтесь для диалога с сомелье',
          subtitle: data.prompt || 'Свободный диалог с AI-сомелье доступен только зарегистрированным пользователям.'
        });
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      }
    });

    client.connect();
    wsClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentQuestion]);

  const handleAnswerSelect = (option) => {
    if (!currentQuestion || !wsClientRef.current) return;

    const { step, code } = currentQuestion;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: option }
    ]);

    setOnboardingAnswers((prev) => ({ ...prev, [code]: option }));
    setCurrentQuestion(null);
    setIsTyping(true);

    wsClientRef.current.sendAnswer(step, code, option);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !wsClientRef.current) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputText('');

    if (!isAuth) {
      setTimeout(() => {
        onOpenAuth({
          title: 'Регистрация для ответа сомелье',
          subtitle: 'Вы можете вводить любые запросы, но для генерации персонального ответа и подбора вин требуется быстрая авторизация.'
        });
      }, 400);
      return;
    }

    setIsTyping(true);
    wsClientRef.current.sendMessage(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a28]/60 backdrop-blur-sm p-2 sm:p-4">
      
      {/* Container matching Scheme 1 Right Screen with vino-svoe.ru styling */}
      <div className="w-full max-w-md h-[92vh] max-h-[780px] rounded-[32px] bg-[#fefdfa] border border-[#efdbc6] flex flex-col overflow-hidden shadow-svoe-elevated relative">
        
        {/* Top Header: "СВОЕ ВИНО" & Subheader: "X" + "Цифровой Сомелье" */}
        <div className="bg-[#fdf9ed] border-b border-[#efdbc6] px-4 py-3 flex-shrink-0">
          <div className="text-center font-serif font-semibold text-xs tracking-widest text-[#8f3d42] uppercase mb-0.5">
            СВОЕ ВИНО
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#f8ecc9] text-[#2c2a28] flex items-center justify-center transition border border-[#efdbc6] shadow-sm"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-serif font-semibold text-base text-[#2c2a28] flex items-center space-x-1.5">
                  <span>Цифровой Сомелье</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#dfa838]" />
                </h3>
              </div>
            </div>

            {/* Connection Status indicator */}
            <div className="flex items-center space-x-1.5 text-[10px] text-[#857e79] bg-white px-2 py-0.5 rounded-full border border-[#efdbc6]">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{connectionStatus === 'connected' ? 'Онлайн' : 'Подключение...'}</span>
            </div>
          </div>
        </div>

        {/* Chat Messages Stream Area */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#fefdfa]"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#8f3d42] text-white rounded-tr-none'
                    : 'bg-[#f9f1f1] text-[#2c2a28] border border-[#edd4d6] rounded-tl-none leading-relaxed'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center space-x-1.5 mb-1 text-[11px] font-semibold text-[#8f3d42]">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI-Сомелье</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Wine Cards (Candidates) returned by Sommelier */}
                {msg.candidates && msg.candidates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#edd4d6] space-y-2">
                    <p className="text-[11px] font-semibold text-[#8f3d42] mb-1">
                      Рекомендованные образцы:
                    </p>
                    {msg.candidates.map((c, cIdx) => (
                      <WineCard
                        key={cIdx}
                        wine={c}
                        onSelect={onSelectWine}
                      />
                    ))}
                  </div>
                )}

                {/* Registration prompt hint */}
                {msg.registration_prompt && !isAuth && (
                  <div
                    onClick={() => onOpenAuth({ title: 'Сохранить предпочтения', subtitle: msg.registration_prompt })}
                    className="mt-3 p-2.5 rounded-xl bg-white border border-[#efdbc6] text-[#8f3d42] text-xs flex items-center justify-between cursor-pointer hover:bg-[#fdf9ed] transition shadow-sm"
                  >
                    <span className="font-medium">{msg.registration_prompt}</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 ml-2 text-[#8f3d42]" />
                  </div>
                )}
              </div>

            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-1.5 text-[#857e79] bg-[#f9f1f1] px-3 py-2 rounded-2xl rounded-tl-none w-24 border border-[#edd4d6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8f3d42] animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8f3d42] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8f3d42] animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}

          {/* Active Onboarding Question with Clickable Choice Chips (Scheme 2) */}
          {currentQuestion && (
            <div className="bg-[#fdf9ed] border border-[#efdbc6] rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8f3d42] tracking-wider">
                  Вопрос {currentQuestion.step} из 5
                </span>
                {currentQuestion.adaptive && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white text-[#8f3d42] border border-[#efdbc6] font-medium">
                    Адаптивный
                  </span>
                )}
              </div>

              <p className="font-serif text-sm font-semibold text-[#2c2a28]">
                {currentQuestion.question}
              </p>

              {/* Option Buttons as pills (vino-svoe.ru style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    className="w-full text-left p-2.5 rounded-full bg-white hover:bg-[#f8ecc9] text-[#2c2a28] hover:text-[#8f3d42] border border-[#efdbc6] hover:border-[#8f3d42] transition duration-150 text-xs font-medium flex items-center justify-between group active:scale-98 shadow-sm"
                  >
                    <span>{option}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#857e79] group-hover:text-[#8f3d42] transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Area: "введите запрос" (Matching Scheme 1 Right Screen) */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-[#efdbc6] flex items-center space-x-2 flex-shrink-0"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="введите запрос..."
              className="w-full bg-[#fdfbf7] text-[#2c2a28] placeholder-[#857e79] text-xs rounded-full px-4 py-3 pr-8 border border-[#d7d4d2] focus:outline-none focus:border-[#8f3d42] transition"
            />
            {!isAuth && (
              <span
                title="Для гостей ответ сомелье потребует авторизации"
                className="absolute right-3 top-3 text-[#857e79]"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-[#8f3d42] hover:bg-[#ab494f] active:bg-[#723135] text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center flex-shrink-0 shadow-sm"
            title="Отправить запрос"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
