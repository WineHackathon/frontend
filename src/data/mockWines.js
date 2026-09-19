/**
 * База образцов российских вин для демонстрации и оффлайн/демо режима UI.
 * Соответствует каталогу вин реестра Роскачества и 4D вкусовой матрице.
 */
export const MOCK_WINES = [
  {
    id: "w1-fanagoria-cru",
    slug: "fanagoria-cru-lermont-cabernet",
    name: "Фанагория Крю Лермонт Каберне Совиньон",
    category: "Красное",
    sugar_type: "Сухое",
    winery: "Фанагория",
    region: "Кубань. Таманский полуостров",
    vintage_year: 2020,
    roskachestvo_score: 86.2,
    price_rub: 1150,
    sweetness: 1.2,
    body: 4.4,
    acidity: 3.1,
    oak: 4.2,
    grape_varieties: ["Каберне Совиньон 100%"],
    aroma_tags: ["черная смородина", "спелая вишня", "дуб", "сафьян", "черный перец"],
    flavor_tags: ["бархатистые танины", "темный шоколад", "длительное пряное послевкусие"],
    description: "Полнотелое выдержанное красное вино с глубоким рубиновым цветом. Выдержка в бочках из кавказского и французского дуба не менее 12 месяцев придает вину структуру и благородную сложность.",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
    pairings: [
      { id: "p1", food_category: "Мясо", dish_name: "Стейк рибай с розмарином", recommendation_reason: "Плотные танины идеально расщепляют волокна мраморного мяса" },
      { id: "p2", food_category: "Сыры", dish_name: "Выдержанный пармезан и гауда", recommendation_reason: "Солоноватость сыра подчеркивает ягодную сладость вина" }
    ]
  },
  {
    id: "w2-divnomorskoe-east",
    slug: "usadba-divnomorskoe-vostochny-sklon",
    name: "Усадьба Дивноморское Восточный Склон",
    category: "Белое",
    sugar_type: "Сухое",
    winery: "Усадьба Дивноморское",
    region: "Кубань. Геленджик",
    vintage_year: 2021,
    roskachestvo_score: 88.5,
    price_rub: 3400,
    sweetness: 1.1,
    body: 2.8,
    acidity: 4.4,
    oak: 1.5,
    grape_varieties: ["Шардоне", "Совиньон Блан"],
    aroma_tags: ["цитрусовые", "белые цветы", "морской бриз", "зеленое яблоко", "кремень"],
    flavor_tags: ["хрустящая кислотность", "минеральное послевкусие", "лаймовая цедра"],
    description: "Терруарное белое вино с каменистых приморских склонов мыса Джанхот. Отличается выразительной свежестью, солоноватой минеральностью и тонким цветочным шлейфом.",
    image_url: "https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=600&q=80",
    pairings: [
      { id: "p3", food_category: "Морепродукты", dish_name: "Черноморские устрицы и гребешки", recommendation_reason: "Морская кислотность вина раскрывает натуральный йодистый вкус моллюсков" },
      { id: "p4", food_category: "Рыба", dish_name: "Сибас на гриле с травами", recommendation_reason: "Легкость блюда гармонирует со свежим телом вина" }
    ]
  },
  {
    id: "w3-vedernikov-krasnostop",
    slug: "vedernikov-krasnostop-zolotovsky",
    name: "Винодельня Ведерниковъ Красностоп Золотовский",
    category: "Красное",
    sugar_type: "Сухое",
    winery: "Ведерниковъ",
    region: "Долина Дона",
    vintage_year: 2019,
    roskachestvo_score: 89.0,
    price_rub: 4200,
    sweetness: 1.3,
    body: 4.9,
    acidity: 3.4,
    oak: 4.6,
    grape_varieties: ["Красностоп Золотовский 100% (Автохтон)"],
    aroma_tags: ["терн", "чернослив", "черника", "кожа", "эвкалипт", "смола"],
    flavor_tags: ["мощные танины", "густое бархатное тело", "копченые ягоды"],
    description: "Флагманский автохтон Дона. Редчайший автохтонный сорт России, выдержанный в дубовых бочках 18 месяцев. Экстремально насыщенный, шелковистый и долгоживущий образец мирового класса.",
    image_url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80",
    pairings: [
      { id: "p5", food_category: "Дичь", dish_name: "Каре ягненка или оленина с брусничным соусом", recommendation_reason: "Богатый танинный каркас обуздывает насыщенность дичи" }
    ]
  },
  {
    id: "w4-abrau-victor-dravigny",
    slug: "abrau-durso-victor-dravigny-rose",
    name: "Абрау-Дюрсо Victor Dravigny Розовое Брют",
    category: "Игристое",
    sugar_type: "Брют",
    winery: "Абрау-Дюрсо",
    region: "Кубань. Абрау-Дюрсо",
    vintage_year: 2021,
    roskachestvo_score: 85.8,
    price_rub: 1290,
    sweetness: 1.4,
    body: 2.2,
    acidity: 4.2,
    oak: 1.0,
    grape_varieties: ["Пино Нуар", "Шардоне", "Каберне Совиньон"],
    aroma_tags: ["земляника", "красная смородина", "бриошь", "малина"],
    flavor_tags: ["тонкий перляж", "ягодная свежесть", "сливочный финиш"],
    description: "Классическое игристое вино, созданное традиционным шампанским методом со вторичным брожением в бутылке и выдержкой в горных тоннелях Абрау не менее 9 месяцев.",
    image_url: "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80",
    pairings: [
      { id: "p6", food_category: "Закуски", dish_name: "Тартар из лосося с авокадо", recommendation_reason: "Игристая текстура и легкая кислотность очищают рецепторы" }
    ]
  },
  {
    id: "w5-galitsky-sauvignon",
    slug: "galitskiy-sauvignon-blanc-krasnaya-gorka",
    name: "Галицкий и Галицкий Совиньон Блан Красная Горка",
    category: "Белое",
    sugar_type: "Сухое",
    winery: "Галицкий и Галицкий",
    region: "Кубань. Анапа",
    vintage_year: 2022,
    roskachestvo_score: 87.4,
    price_rub: 2600,
    sweetness: 1.0,
    body: 3.0,
    acidity: 4.6,
    oak: 1.8,
    grape_varieties: ["Совиньон Блан 100%"],
    aroma_tags: ["листья черной смородины", "крыжовник", "маракуйя", "скошенная трава"],
    flavor_tags: ["сочный грейпфрут", "кремневая минеральность", "длинный сухой финиш"],
    description: "Яркий анапский терруар заповедной зоны Красная Горка. Взрыв ароматики совиньона нового света в сочетании с европейской строгостью и элегантностью.",
    image_url: "https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=600&q=80",
    pairings: [
      { id: "p7", food_category: "Сыры", dish_name: "Молодой козий сыр Шевр", recommendation_reason: "Классический пейринг высокой кислотности совиньона и кремового козьего сыра" }
    ]
  }
];
