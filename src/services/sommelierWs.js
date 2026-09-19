import { MOCK_WINES } from '../data/mockWines';
import { getAuthToken } from './api';

/**
 * Сервис управления WebSocket-сессией AI-Сомелье (/ws/sommelier).
 * Поддерживает:
 * - Реальное WebSocket соединение с автопереподключением;
 * - Интерактивный 5-вопросный онбординг + адаптивные вопросы (Схема 2);
 * - Свободный чат с сомелье и RAG;
 * - Автономный/демо эмулятор на случай, если бэкенд выключен или недоступен.
 */

// Базовые 5 вопросов «Оптимального первого диалога» сомелье
export const BASELINE_QUESTIONS = [
  {
    step: 1,
    code: 'category',
    question: 'Белое, красное, розовое или игристое?',
    options: ['Белое', 'Красное', 'Розовое', 'Игристое'],
    adaptive: false
  },
  {
    step: 2,
    code: 'sweetness',
    question: 'Сухое или с остаточной сладостью?',
    options: ['Сухое', 'С остаточной сладостью'],
    adaptive: false
  },
  {
    step: 3,
    code: 'body',
    question: 'Лёгкое, среднее или плотное?',
    options: ['Лёгкое', 'Среднее', 'Плотное'],
    adaptive: false
  },
  {
    step: 4,
    code: 'acidity',
    question: 'Больше свежести или мягкости?',
    options: ['Больше свежести', 'Больше мягкости'],
    adaptive: false
  },
  {
    step: 5,
    code: 'aromas',
    question: 'Какие ароматы вам нравятся больше всего?',
    options: [
      'Спелые ягоды и вишня',
      'Цитрусы и зеленое яблоко',
      'Ваниль, дуб и шоколад',
      'Полевые цветы и минералы'
    ],
    adaptive: false
  }
];

export class SommelierWebSocketClient {
  constructor({ onMessage, onQuestion, onCompleted, onRegistrationRequired, onStatusChange }) {
    this.ws = null;
    this.onMessage = onMessage || (() => {});
    this.onQuestion = onQuestion || (() => {});
    this.onCompleted = onCompleted || (() => {});
    this.onRegistrationRequired = onRegistrationRequired || (() => {});
    this.onStatusChange = onStatusChange || (() => {});

    this.isConnecting = false;
    this.isConnected = false;
    this.useMock = false;

    // Состояние локального онбординга
    this.answers = {};
    this.currentStep = 1;
    this.pingInterval = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.onStatusChange('connecting');

    const token = getAuthToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Проксируется через Nginx порт 8050 или Vite дев-сервер
    const wsUrl = `${protocol}//${window.location.host}/ws/sommelier${token ? `?token=${token}` : ''}`;

    try {
      this.ws = new WebSocket(wsUrl);

      // Таймаут на попытку подключения: если за 2.5 сек не открылся — переходим в интеллектуальный эмулятор
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.info('[Sommelier WS] Backend WebSocket недоступен, включен интерактивный эмулятор');
          this.initMockMode();
        }
      }, 2500);

      this.ws.onopen = () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.useMock = false;
        this.onStatusChange('connected');
        console.log('[Sommelier WS] Успешно подключено к /ws/sommelier');

        // Отправка auth токена в сокет (для бэкенда)
        if (token) {
          this.ws.send(JSON.stringify({ type: 'auth', token }));
        }

        // Запуск heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[Sommelier WS] Parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Sommelier WS] Ошибка сокета:', err);
        if (!this.isConnected) {
          this.initMockMode();
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        if (!this.useMock) {
          this.onStatusChange('disconnected');
        }
      };
    } catch (err) {
      console.warn('[Sommelier WS] Connection failure:', err);
      this.initMockMode();
    }
  }

  initMockMode() {
    this.useMock = true;
    this.isConnected = true;
    this.isConnecting = false;
    this.onStatusChange('connected');

    // Эмуляция приветственного сообщения и вопроса №1
    setTimeout(() => {
      this.onMessage({
        role: 'assistant',
        content: 'Здравствуйте! Я ваш цифровой AI-сомелье. Вы можете задать мне любой вопрос о винах, гастропарах и регионах, либо пройти быстрый опрос из 5 вопросов для точного персонального подбора!',
      });
      this.onQuestion(BASELINE_QUESTIONS[0]);
    }, 300);
  }

  handleServerMessage(data) {
    const type = data.type;

    if (type === 'welcome') {
      this.onMessage({
        role: 'assistant',
        content: data.message,
      });
      if (data.question) {
        this.onQuestion(data.question);
      }
    } else if (type === 'next_question') {
      this.onQuestion(data.question);
    } else if (type === 'completed') {
      this.onCompleted({
        message: data.message,
        candidates: data.candidates || [],
        registration_prompt: data.registration_prompt,
      });
    } else if (type === 'message') {
      this.onMessage({
        role: 'assistant',
        content: data.content,
        candidates: data.candidates || [],
      });
    } else if (type === 'stream_chunk') {
      this.onMessage({
        role: 'assistant',
        chunk: data.content,
      });
    } else if (type === 'stream_end') {
      this.onMessage({
        role: 'assistant',
        streamEnd: true,
        candidates: data.candidates || [],
      });
    }
  }

  // Отправка ответа на шаг онбординга
  sendAnswer(step, code, answerText) {
    this.answers[code] = answerText;

    if (!this.useMock && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'answer',
        step,
        code,
        answer: answerText,
      }));
      return;
    }

    // Эмуляция адаптивного сценария (Схема 2)
    setTimeout(() => {
      if (step < 5) {
        const nextStep = step + 1;
        let nextQuestion = BASELINE_QUESTIONS[nextStep - 1];

        const cat = (this.answers['category'] || '').toLowerCase();

        // Адаптация для красного (уточнить oak и плотность)
        if (nextStep === 3 && cat.includes('красн')) {
          nextQuestion = {
            step: 3,
            code: 'body_oak',
            question: 'Для красного вина: вам ближе бархатистое вино с выдержкой в дубе или более ягодное и легкое?',
            options: ['Мощное с благородным дубом', 'Легкое, ягодное и питкое'],
            adaptive: true
          };
        }
        // Адаптация для белого (уточнить кислотность и минеральность)
        else if (nextStep === 4 && cat.includes('бел')) {
          nextQuestion = {
            step: 4,
            code: 'acidity_minerals',
            question: 'Для белого вина: важна ли хрустящая кислотность и минеральность (морской бриз, кремень)?',
            options: ['Яркая кислотность и минеральность', 'Фруктовая мягкость и округлость'],
            adaptive: true
          };
        }

        this.onQuestion(nextQuestion);
      } else {
        // Подбор вин по результатам
        const cat = this.answers['category'] || 'Красное';
        let filtered = MOCK_WINES.filter(w => w.category.toLowerCase().includes(cat.toLowerCase()));
        if (filtered.length === 0) filtered = MOCK_WINES;

        this.onCompleted({
          message: `Великолепно! Ваш вкусовой профиль сформирован. На основе ваших предпочтений (${cat}, ${this.answers['sweetness'] || ''}) я подобрал лучшие российские образцы:`,
          candidates: filtered.slice(0, 3),
          registration_prompt: 'Зарегистрируйтесь, чтобы сохранить эти вина в личный погреб и отслеживать персональный вкусовой радар!'
        });
      }
    }, 400);
  }

  // Отправка свободного текстового запроса пользователем
  sendMessage(text, contextWineSlug = null) {
    const isAuth = !!getAuthToken();

    // Схема 3: Для неавторизованных просим пройти регистрацию
    if (!isAuth) {
      this.onRegistrationRequired({
        prompt: 'Цифровой сомелье доступен для общения в свободном диалоге только зарегистрированным пользователям. Пожалуйста, авторизуйтесь или войдите в аккаунт!',
        query: text,
      });
      return;
    }

    if (!this.useMock && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        message: text,
        context_wine_slug: contextWineSlug,
        stream: false,
      }));
      return;
    }

    // Эмуляция ответа сомелье
    setTimeout(() => {
      const q = text.toLowerCase();
      let matchedWines = [];
      let reply = '';

      if (q.includes('мяс') || q.includes('стейк') || q.includes('красн')) {
        matchedWines = [MOCK_WINES[0], MOCK_WINES[2]];
        reply = 'К мясу и сытным блюдам рекомендую плотные российские красные вина с выразительными танинами и выдержкой в дубе, например Фанагорию Крю Лермонт или Ведерниковъ Красностоп.';
      } else if (q.includes('рыб') || q.includes('устриц') || q.includes('бел')) {
        matchedWines = [MOCK_WINES[1], MOCK_WINES[4]];
        reply = 'К морепродуктам и белой рыбе идеально подойдет терруарное белое вино с яркой кислотностью и морской минеральностью — Усадьба Дивноморское Восточный Склон.';
      } else {
        matchedWines = [MOCK_WINES[0], MOCK_WINES[1], MOCK_WINES[3]];
        reply = `Отличный вопрос! Российское виноделие сейчас на пике развития. Вот интересные рекомендации из нашего проверенного каталога Роскачества:`;
      }

      this.onMessage({
        role: 'assistant',
        content: reply,
        candidates: matchedWines,
      });
    }, 700);
  }

  disconnect() {
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
