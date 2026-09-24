import { MOCK_WINES } from '../data/mockWines';

// Получение или создание постоянного фингерпринта устройства
export function getDeviceFingerprint() {
  let fp = localStorage.getItem('wine_device_fingerprint');
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('wine_device_fingerprint', fp);
  }
  return fp;
}

// Управление токенами
export function getAuthToken() {
  return localStorage.getItem('wine_auth_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('wine_auth_token', token);
  } else {
    localStorage.removeItem('wine_auth_token');
  }
}

export function getStoredUser() {
  const data = localStorage.getItem('wine_user_profile');
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('wine_user_profile', JSON.stringify(user));
  } else {
    localStorage.removeItem('wine_user_profile');
  }
}

// Лимит сканов для гостей
export function getGuestScansRemaining() {
  const val = localStorage.getItem('wine_guest_scans_remaining');
  return val !== null ? parseInt(val, 10) : 5;
}

export function decrementGuestScans() {
  const current = getGuestScansRemaining();
  const next = Math.max(0, current - 1);
  localStorage.setItem('wine_guest_scans_remaining', next.toString());
  return next;
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Вспомогательная функция запросов к бэкенду
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const fingerprint = getDeviceFingerprint();

  const headers = {
    'X-Device-Fingerprint': fingerprint,
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export const api = {
  // 1. Сканирование этикетки (поддержка /api/v1/ml/scan и /api/v1/scan)
  async scanLabel(file) {
    const isAuth = !!getAuthToken();
    let remaining = isAuth ? null : getGuestScansRemaining();

    // Быстрая локальная проверка квоты для неавторизованных
    if (!isAuth && remaining <= 0) {
      return {
        image_id: 'img_' + Date.now(),
        slug: null,
        wine: null,
        remaining_scans: 0,
        registration_required: true,
      };
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('device_fingerprint', getDeviceFingerprint());

    try {
      // Сначала пробуем стандартный /api/v1/ml/scan
      let resp = await apiRequest('/api/v1/ml/scan', {
        method: 'POST',
        body: formData,
      });

      // Если 404, пробуем алиас /api/v1/scan
      if (resp.status === 404) {
        resp = await apiRequest('/api/v1/scan', {
          method: 'POST',
          body: formData,
        });
      }

      if (resp.ok) {
        const data = await resp.json();

        // Синхронизация остатка бесплатных сканирований с Redis бэкенда
        if (!isAuth && data.remaining_scans !== undefined && data.remaining_scans !== null) {
          localStorage.setItem('wine_guest_scans_remaining', data.remaining_scans.toString());
        }

        // Если распознан слаг, но карточка вина еще не подтянута, запрашиваем детальную карточку
        if (data.slug && !data.wine) {
          try {
            const wineDetail = await this.getWineBySlug(data.slug);
            data.wine = wineDetail;
          } catch (e) {
            console.warn('Не удалось загрузить детальную карточку для распознанного слага:', data.slug);
          }
        }

        if (data.wine) {
          this.recordLocalScan(data.wine);
        }

        return data;
      }
    } catch (err) {
      console.warn('Backend scanner unreachable, using fallback simulation:', err);
    }

    // Демо-фолбэк (на случай выключенного бэкенда при локальной верстке)
    if (!isAuth) {
      remaining = decrementGuestScans();
    }

    const randomWine = MOCK_WINES[Math.floor(Math.random() * MOCK_WINES.length)];
    this.recordLocalScan(randomWine);

    return {
      image_id: 'demo_' + Date.now(),
      slug: randomWine.slug,
      confidence: 0.94,
      latency_ms: 120,
      wine: randomWine,
      remaining_scans: remaining,
      registration_required: !isAuth && remaining <= 0,
    };
  },

  // 2. Получение детальной информации о вине
  async getWineBySlug(slug) {
    try {
      const resp = await apiRequest(`/api/v1/catalog/wines/${slug}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Error fetching wine by slug from backend, using mock:', e);
    }
    const found = MOCK_WINES.find(w => w.slug === slug);
    return found || MOCK_WINES[0];
  },

  // 3. Каталог вин (список вин)
  async listWines(category = null) {
    try {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const resp = await apiRequest(`/api/v1/catalog/wines${query}`);
      if (resp.ok) {
        const data = await resp.json();
        return data.items || [];
      }
    } catch (e) {
      console.warn('Error fetching catalog, using mock:', e);
    }
    if (category) {
      return MOCK_WINES.filter(w => w.category.toLowerCase().includes(category.toLowerCase()));
    }
    return MOCK_WINES;
  },

  // 4. Поиск похожих вин (Similar Wines)
  async getSimilarWines(slug, limit = 4) {
    try {
      const resp = await apiRequest(`/api/v1/catalog/wines/${slug}/similar?limit=${limit}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Error fetching similar wines:', e);
    }
    return MOCK_WINES.filter(w => w.slug !== slug).slice(0, limit);
  },

  // 5. Авторизация (Email + Password)
  async login(email, password) {
    try {
      const resp = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          device_fingerprint: getDeviceFingerprint(),
          device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const token = data.tokens?.access_token || data.access_token;
        const user = data.user || data;
        setAuthToken(token);
        setStoredUser(user);
        return { success: true, user };
      }
      const err = await resp.json();
      return { success: false, error: err.detail || 'Неверный email или пароль' };
    } catch (e) {
      console.warn('Login backend unreachable, using mock user session:', e);
      const demoUser = {
        id: 'usr_demo_' + Date.now(),
        email: email,
        first_name: email.split('@')[0] || 'Пользователь',
        role: 'user',
        taste_profile: {
          sweetness_pref: 1.2,
          body_pref: 4.2,
          acidity_pref: 3.5,
          oak_pref: 3.8,
          preferred_categories: ['Красное', 'Белое'],
          favorite_aromas: ['вишня', 'дуб', 'черная смородина'],
        }
      };
      setAuthToken('demo_token_' + Date.now());
      setStoredUser(demoUser);
      return { success: true, user: demoUser };
    }
  },

  // 6. Регистрация нового пользователя с передачей device_fingerprint
  async register(email, password, firstName, lastName = '') {
    try {
      const resp = await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName || null,
          device_fingerprint: getDeviceFingerprint(),
          device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const token = data.tokens?.access_token || data.access_token;
        const user = data.user || data;
        setAuthToken(token);
        setStoredUser(user);
        return { success: true, user };
      }
      const err = await resp.json();
      return { success: false, error: err.detail || 'Ошибка регистрации' };
    } catch (e) {
      console.warn('Register backend unreachable, using mock user session:', e);
      const demoUser = {
        id: 'usr_demo_' + Date.now(),
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        taste_profile: {
          sweetness_pref: 1.5,
          body_pref: 3.8,
          acidity_pref: 3.2,
          oak_pref: 2.5,
          preferred_categories: ['Красное', 'Игристое'],
          favorite_aromas: ['ягоды', 'вишня'],
        }
      };
      setAuthToken('demo_token_' + Date.now());
      setStoredUser(demoUser);
      return { success: true, user: demoUser };
    }
  },

  // 7. Авторизация через Яндекс ID OAuth
  async authYandex(code) {
    try {
      const resp = await apiRequest('/api/v1/auth/yandex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          device_fingerprint: getDeviceFingerprint(),
          device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const token = data.tokens?.access_token || data.access_token;
        const user = data.user || data;
        setAuthToken(token);
        setStoredUser(user);
        return { success: true, user };
      }
    } catch (e) {
      console.warn('Yandex OAuth failed:', e);
    }
    return { success: false };
  },

  async getYandexAuthUrl() {
    try {
      const resp = await apiRequest('/api/v1/auth/yandex/url');
      if (resp.ok) {
        const data = await resp.json();
        return data.url;
      }
    } catch (e) {
      console.warn('Failed to get Yandex URL:', e);
    }
    return 'https://oauth.yandex.ru';
  },

  logout() {
    setAuthToken(null);
    setStoredUser(null);
  },

  // 8. Личный винный погреб / вишлист
  async getCellar(status = null) {
    try {
      const query = status ? `?status=${status}` : '';
      let resp = await apiRequest(`/api/v1/users/cellar${query}`);
      if (resp.status === 404) {
        resp = await apiRequest(`/api/v1/cellar${query}`);
      }
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Cellar fetch failed:', e);
    }
    const localCellar = localStorage.getItem('wine_local_cellar');
    return localCellar ? JSON.parse(localCellar) : [];
  },

  async addToCellar(wine, status = 'in_cellar', tastingNotes = '') {
    try {
      let resp = await apiRequest('/api/v1/users/cellar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wine_slug: wine.slug,
          wine_id: wine.id && wine.id.length > 20 ? wine.id : undefined,
          status,
          bottles_count: 1,
          tasting_notes: tastingNotes || '',
        }),
      });

      if (resp.status === 404) {
        resp = await apiRequest('/api/v1/cellar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wine_slug: wine.slug,
            status,
            bottles_count: 1,
            tasting_notes: tastingNotes || '',
          }),
        });
      }

      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('Cellar add failed:', e);
    }

    // Сохранение в локальный список при недоступности бэкенда
    const local = localStorage.getItem('wine_local_cellar');
    const cellar = local ? JSON.parse(local) : [];
    const newItem = {
      id: 'cellar_' + Date.now(),
      wine_id: wine.id,
      wine,
      status,
      created_at: new Date().toISOString()
    };
    cellar.unshift(newItem);
    localStorage.setItem('wine_local_cellar', JSON.stringify(cellar));
    return newItem;
  },

  async removeFromCellar(itemId) {
    try {
      let resp = await apiRequest(`/api/v1/users/cellar/${itemId}`, { method: 'DELETE' });
      if (resp.status === 404) {
        resp = await apiRequest(`/api/v1/cellar/${itemId}`, { method: 'DELETE' });
      }
      if (resp.ok) return true;
    } catch (e) {
      console.warn('Cellar remove failed:', e);
    }
    const local = localStorage.getItem('wine_local_cellar');
    if (local) {
      const cellar = JSON.parse(local).filter(item => item.id !== itemId);
      localStorage.setItem('wine_local_cellar', JSON.stringify(cellar));
    }
    return true;
  },

  // 9. История сканирований пользователя
  async getScanHistory() {
    try {
      const resp = await apiRequest('/api/v1/users/scans?limit=20');
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Scan history fetch failed:', e);
    }
    const localScans = localStorage.getItem('wine_local_scans');
    return localScans ? JSON.parse(localScans) : [];
  },

  recordLocalScan(wine) {
    if (!wine) return;
    const local = localStorage.getItem('wine_local_scans');
    const scans = local ? JSON.parse(local) : [];
    scans.unshift({
      id: 'scan_' + Date.now(),
      predicted_slug: wine.slug,
      wine_name: wine.name,
      wine_category: wine.category,
      wine,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('wine_local_scans', JSON.stringify(scans.slice(0, 30)));
  },

  // 10. Активные сессии пользователя
  async getSessions() {
    try {
      let resp = await apiRequest('/api/v1/users/sessions');
      if (resp.status === 404) {
        resp = await apiRequest('/api/v1/sessions');
      }
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Sessions fetch failed:', e);
    }
    return [];
  }
};
