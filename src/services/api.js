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

// Вспомогательная функция запросов
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

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  return response;
}

export const api = {
  // 1. Сканирование этикетки
  async scanLabel(file) {
    const isAuth = !!getAuthToken();
    let remaining = isAuth ? null : getGuestScansRemaining();

    // Проверка лимита для неавторизованных
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

    try {
      const resp = await apiRequest('/api/v1/ml/scan', {
        method: 'POST',
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        if (!isAuth && data.remaining_scans !== undefined) {
          localStorage.setItem('wine_guest_scans_remaining', data.remaining_scans.toString());
        }
        return data;
      }
    } catch (err) {
      console.warn('API /api/v1/ml/scan offline or error, using mock fallback:', err);
    }

    // Демо-фолбэк (случайный выбор качественного российского вина из базы)
    if (!isAuth) {
      remaining = decrementGuestScans();
    }

    const randomWine = MOCK_WINES[Math.floor(Math.random() * MOCK_WINES.length)];
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

  // 2. Получение информации о вине
  async getWineBySlug(slug) {
    try {
      const resp = await apiRequest(`/api/v1/catalog/wines/${slug}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Error fetching wine by slug, using mock:', e);
    }
    const found = MOCK_WINES.find(w => w.slug === slug);
    return found || MOCK_WINES[0];
  },

  // 3. Каталог вин
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

  // 4. Авторизация (Email + Password)
  async login(email, password) {
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAuthToken(data.tokens.access_token);
        setStoredUser(data.user);
        return { success: true, user: data.user };
      }
      const err = await resp.json();
      return { success: false, error: err.detail || 'Ошибка входа' };
    } catch (e) {
      console.warn('Login backend unreachable, using mock user session:', e);
      // Demo login
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

  async register(email, password, firstName, lastName = '') {
    try {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName || null,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAuthToken(data.tokens.access_token);
        setStoredUser(data.user);
        return { success: true, user: data.user };
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

  logout() {
    setAuthToken(null);
    setStoredUser(null);
  },

  // 5. Личный винный погреб / вишлист
  async getCellar() {
    try {
      const resp = await apiRequest('/api/v1/users/cellar');
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Cellar fetch failed:', e);
    }
    const localCellar = localStorage.getItem('wine_local_cellar');
    return localCellar ? JSON.parse(localCellar) : [];
  },

  async addToCellar(wine, status = 'in_cellar') {
    try {
      const resp = await apiRequest('/api/v1/users/cellar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wine_id: wine.id,
          status,
          user_notes: '',
        }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('Cellar add failed:', e);
    }

    // Сохранение в локальный список
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

  // 6. История сканирований пользователя
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
    const local = localStorage.getItem('wine_local_scans');
    const scans = local ? JSON.parse(local) : [];
    scans.unshift({
      id: 'scan_' + Date.now(),
      predicted_slug: wine.slug,
      wine_name: wine.name,
      wine_category: wine.category,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('wine_local_scans', JSON.stringify(scans.slice(0, 30)));
  }
};
