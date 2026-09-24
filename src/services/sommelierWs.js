import { MOCK_WINES } from '../data/mockWines';
import { getAuthToken } from './api';

/**
 * Сервис управления WebSocket-сессией AI-Сомелье (/ws/sommelier).
 * Поддерживает:
 * - Реальное WebSocket соединение с автопереподключением и фоллбэками на порты;
 * - Интерактивный 5-вопросный адаптивный онбординг (Схема 1 и 2);
 * - Двухфазный стриминг (Фаза 1: candidates_ready, Фаза 2: stream_chunk);
 * - Защиту и пейволл неавторизованных пользователей;
 * - Автономный эмулятор для стабильной разработки при выключенном бэкенде.
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
    question: 'Какие ароматы нравятся?',
    options: [
      'Спелые ягоды и вишня',
      'Цитрусы и зеленое яблоко',
      'Ваниль, дуб и пряности',
      'Полевые цветы и минералы',
      'Редкие и необычные вкусы (автохтоны, петнаты)'
    ],
    adaptive: false
  }
];

export class SommelierWebSocketClient {
  constructor({
    onMessage,
    onQuestion,
    onCompleted,
    onCandidatesReady,
    onRegistrationRequired,
    onStatusChange,
    onAuthSuccess,
  }) {
    this.ws = null;
    this.onMessage = onMessage || (() => {});
    this.onQuestion = onQuestion || (() => {});
    this.onCompleted = onCompleted || (() => {});
    this.onCandidatesReady = onCandidatesReady || (() => {});
    this.onRegistrationRequired = onRegistrationRequired || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.onAuthSuccess = onAuthSuccess || (() => {});

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
    
    // Проксируется через Vite или Nginx на порт 8050 / 8080
    const wsUrl = `${protocol}//${window.location.host}/ws/sommelier${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.ws = new WebSocket(wsUrl);

      // Таймаут на попытку подключения к сокету бэкенда (2.8 сек)
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.info('[Sommelier WS] Backend WebSocket недоступен, включен интеллектуальный эмулятор');
          this.initMockMode();
        }
      }, 2800);

      this.ws.onopen = () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.useMock = false;
        this.onStatusChange('connected');
        console.log('[Sommelier WS] Успешно подключено к /ws/sommelier бэкенда');

        // Отправка auth токена в сокет
        if (token) {
          this.authenticate(token);
        }

        // Heartbeat каждые 20 сек
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

  authenticate(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && token) {
      this.ws.send(JSON.stringify({ type: 'auth', token }));
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
    } else if (type === 'candidates_ready') {
      // Бэкенд Фаза 1: мгновенные карточки (15-20 мс) до начала стриминга текста
      this.onCandidatesReady(data.candidates || []);
    } else if (type === 'completed' || type === 'onboarding_complete') {
      this.onCompleted({
        message: data.message,
        candidates: data.candidates || [],
        registration_required: data.registration_required,
        registration_prompt: data.registration_required
          ? 'Зарегистрируйтесь или войдите, чтобы увидеть персональные рекомендации и сохранить вкусовой радар!'
          : null,
      });
      if (data.registration_required) {
        this.onRegistrationRequired({
          title: 'Сохранить винные рекомендации',
          subtitle: data.message || 'Превосходно! Ваш вкусовой профиль сформирован. Зарегистрируйтесь, чтобы получить персональные винные рекомендации.',
        });
      }
    } else if (type === 'message' || type === 'chat') {
      if (data.registration_required) {
        this.onRegistrationRequired({
          title: 'Авторизуйтесь для общения с сомелье',
          subtitle: data.content || data.reply || 'Чтобы получить персональную рекомендацию от AI-сомелье, пожалуйста, войдите или зарегистрируйтесь.',
        });
      } else {
        this.onMessage({
          role: 'assistant',
          content: data.content || data.reply,
          candidates: data.candidates || [],
        });
      }
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
    } else if (type === 'auth_success') {
      console.log('[Sommelier WS] Успешно авторизован:', data.user_id);
      this.onAuthSuccess(data);
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

    // Эмуляция адаптивного сценария при выключенном бэкенде (Схема 1 и 2)
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
        const isAuth = !!getAuthToken();
        const cat = this.answers['category'] || 'Красное';
        let filtered = MOCK_WINES.filter(w => w.category.toLowerCase().includes(cat.toLowerCase()));
        if (filtered.length === 0) filtered = MOCK_WINES;

        if (!isAuth) {
          this.onCompleted({
            message: `Превосходно! Ваш вкусовой профиль сформирован (${cat}, ${this.answers['sweetness'] || 'Сухое'}). Зарегистрируйтесь, чтобы получить персональные винные рекомендации.`,
            candidates: [],
            registration_required: true,
            registration_prompt: 'Зарегистрируйтесь, чтобы сохранить эти вина в личный погреб и отслеживать персональный вкусовой радар!'
          });
          this.onRegistrationRequired({
            title: 'Сохранить винный профиль',
            subtitle: 'Ваш вкусовой радар готов! Зарегистрируйтесь, чтобы открыть подборку вин и сохранить её в личный погреб.'
          });
        } else {
          this.onCompleted({
            message: `Великолепно! Ваш вкусовой профиль сформирован. На основе ваших предпочтений (${cat}, ${this.answers['sweetness'] || 'Сухое'}) я подобрал лучшие российские образцы:`,
            candidates: filtered.slice(0, 3),
            registration_required: false,
          });
        }
      }
    }, 400);
  }

  // Отправка свободного текстового запроса пользователем
  sendMessage(text, contextWineSlug = null) {
    const isAuth = !!getAuthToken();

    // Схема 3: Для неавторизованных просим пройти регистрацию
    if (!isAuth) {
      this.onRegistrationRequired({
        prompt: 'Свободный диалог с AI-сомелье доступен только зарегистрированным пользователям. Пожалуйста, авторизуйтесь или войдите в аккаунт!',
        query: text,
      });
      return;
    }

    if (!this.useMock && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content: text,
        context_wine_slug: contextWineSlug,
        stream: true,
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
        reply = 'Отличный вопрос! Российское виноделие сейчас на пике развития. Вот интересные рекомендации из нашего проверенного каталога Роскачества:';
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
