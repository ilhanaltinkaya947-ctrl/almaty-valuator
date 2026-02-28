// src/data/zones.ts
// Static fallback data for price zones.
// Used client-side when API is unavailable.

export interface PriceZone {
  id: string;
  name: string;
  slug: string;
  district: string;
  description: string;
  avgPriceSqm: number;
  coefficient: number;
  sortOrder: number;
}

export const PRICE_ZONES: PriceZone[] = [
  // Медеуский
  { id: "z-medeu-verhniy",       name: "Медеу верхний",         slug: "medeu-verhniy",        district: "Медеуский",     description: "Горная часть Медеу, элитные коттеджи и резиденции",                avgPriceSqm: 1350000, coefficient: 1.68, sortOrder: 1 },
  { id: "z-dostyk-koridor",      name: "Достык коридор",        slug: "dostyk-koridor",       district: "Медеуский",     description: "Проспект Достык от Аль-Фараби до Курмангазы",                     avgPriceSqm: 1200000, coefficient: 1.49, sortOrder: 2 },
  { id: "z-samal-zholdasbekova", name: "Самал — Жолдасбекова",  slug: "samal-zholdasbekova",  district: "Медеуский",     description: "Микрорайоны Самал, улица Жолдасбекова",                           avgPriceSqm: 1050000, coefficient: 1.30, sortOrder: 3 },
  { id: "z-koktobe-remizovka",   name: "Коктобе — Ремизовка",   slug: "koktobe-remizovka",    district: "Медеуский",     description: "Предгорья Коктобе, район Ремизовка",                              avgPriceSqm:  950000, coefficient: 1.18, sortOrder: 4 },

  // Бостандыкский
  { id: "z-bostandyk-verhniy",   name: "Бостандык верхний",      slug: "bostandyk-verhniy",    district: "Бостандыкский", description: "Верхняя часть Бостандыка, район Аль-Фараби",                      avgPriceSqm: 1100000, coefficient: 1.37, sortOrder: 5 },
  { id: "z-almagul-kazakhfilm",  name: "Алмагуль — Казахфильм", slug: "almagul-kazakhfilm",   district: "Бостандыкский", description: "Микрорайон Алмагуль, район Казахфильм",                           avgPriceSqm:  920000, coefficient: 1.14, sortOrder: 6 },
  { id: "z-orbita-sayran",       name: "Орбита — Сайран",        slug: "orbita-sayran",        district: "Бостандыкский", description: "Микрорайоны Орбита, озеро Сайран",                                avgPriceSqm:  850000, coefficient: 1.06, sortOrder: 7 },
  { id: "z-tastak",              name: "Тастак",                 slug: "tastak",               district: "Бостандыкский", description: "Микрорайоны Тастак 1-4",                                          avgPriceSqm:  750000, coefficient: 0.93, sortOrder: 8 },

  // Алмалинский
  { id: "z-zolotoy-kvadrat",     name: "Золотой квадрат",        slug: "zolotoy-kvadrat",      district: "Алмалинский",   description: "Премиальный квадрат центра: Абая — Толе Би — Сейфуллина — Байтурсынова", avgPriceSqm: 960000, coefficient: 1.30, sortOrder: 9 },
  { id: "z-centr-arbat",         name: "Центр — Арбат",          slug: "centr-arbat",          district: "Алмалинский",   description: "Исторический центр, пешеходная улица Панфилова",                  avgPriceSqm:  950000, coefficient: 1.18, sortOrder: 10 },
  { id: "z-ploshchad",           name: "Площадь Республики",     slug: "ploshchad-respubliki", district: "Алмалинский",   description: "Район Площади Республики, центральный парк",                      avgPriceSqm:  900000, coefficient: 1.12, sortOrder: 11 },
  { id: "z-almaly-zhibek",       name: "Алмалы — Жибек Жолы",   slug: "almaly-zhibek-zholy",  district: "Алмалинский",   description: "Район метро Жибек Жолы, нижняя часть центра",                     avgPriceSqm:  870000, coefficient: 1.08, sortOrder: 12 },

  // Ауэзовский
  { id: "z-mamyr-saina",         name: "Мамыр — Саина",          slug: "mamyr-saina",          district: "Ауэзовский",   description: "Микрорайоны Мамыр, район проспекта Саина",                        avgPriceSqm:  650000, coefficient: 0.81, sortOrder: 13 },
  { id: "z-orbita-auezov",       name: "Орбита (Ауэзов)",        slug: "orbita-auezov",        district: "Ауэзовский",   description: "Район Орбита в составе Ауэзовского района",                      avgPriceSqm:  680000, coefficient: 0.84, sortOrder: 14 },
  { id: "z-aksay",               name: "Аксай",                  slug: "aksay",                district: "Ауэзовский",   description: "Микрорайоны Аксай 1-5",                                           avgPriceSqm:  630000, coefficient: 0.78, sortOrder: 15 },
  { id: "z-zhetysu",             name: "Жетысу",                 slug: "zhetysu",              district: "Ауэзовский",   description: "Микрорайоны Жетысу 1-4",                                          avgPriceSqm:  620000, coefficient: 0.77, sortOrder: 16 },
  { id: "z-mikrorayony",         name: "Микрорайоны",            slug: "mikrorayony",          district: "Ауэзовский",   description: "Спальные микрорайоны Ауэзовского района",                         avgPriceSqm:  600000, coefficient: 0.75, sortOrder: 17 },

  // Жетысуский
  { id: "z-taugul",              name: "Таугуль — Жандосова",    slug: "taugul-zhandosova",    district: "Жетысуский",    description: "Район Таугуль, улица Жандосова",                                  avgPriceSqm:  620000, coefficient: 0.77, sortOrder: 18 },
  { id: "z-ainabulak",           name: "Айнабулак",              slug: "ainabulak",            district: "Жетысуский",    description: "Микрорайоны Айнабулак",                                           avgPriceSqm:  550000, coefficient: 0.68, sortOrder: 19 },

  // Турксибский
  { id: "z-turksib",             name: "Турксиб",                slug: "turksib",              district: "Турксибский",   description: "Центральная часть Турксибского района",                           avgPriceSqm:  520000, coefficient: 0.65, sortOrder: 20 },
  { id: "z-altyn-orda",          name: "Алтын Орда",             slug: "altyn-orda",           district: "Турксибский",   description: "Район Алтын Орда, окраина Турксибского",                          avgPriceSqm:  500000, coefficient: 0.62, sortOrder: 21 },

  // Наурызбайский
  { id: "z-nurlytau",            name: "Нурлытау — Ремизовка",  slug: "nurlytau-remizovka",   district: "Наурызбайский", description: "Район Нурлытау, предгорья",                                       avgPriceSqm:  780000, coefficient: 0.97, sortOrder: 22 },
  { id: "z-nauryzbay",           name: "Наурызбай",              slug: "nauryzbay",            district: "Наурызбайский", description: "Центральная часть Наурызбайского района",                         avgPriceSqm:  600000, coefficient: 0.75, sortOrder: 23 },
  { id: "z-kalkaman-duman",      name: "Калкаман — Думан",       slug: "kalkaman-duman",       district: "Наурызбайский", description: "Районы Калкаман и Думан",                                         avgPriceSqm:  550000, coefficient: 0.68, sortOrder: 24 },

  // Алатауский
  { id: "z-alatau-verhniy",      name: "Алатау верхний",         slug: "alatau-verhniy",       district: "Алатауский",    description: "Верхняя часть Алатауского района",                                avgPriceSqm:  580000, coefficient: 0.72, sortOrder: 25 },
  { id: "z-alatau-nizhniy",      name: "Алатау нижний",          slug: "alatau-nizhniy",       district: "Алатауский",    description: "Нижняя часть Алатауского района",                                 avgPriceSqm:  500000, coefficient: 0.62, sortOrder: 26 },
  { id: "z-shanyrak",            name: "Шанырак",                slug: "shanyrak",             district: "Алатауский",    description: "Микрорайон Шанырак, частный сектор",                               avgPriceSqm:  450000, coefficient: 0.56, sortOrder: 27 },

  // Дополнительные микрорайоны Ауэзовского
  { id: "z-koshkarbayeva",       name: "Кошкарбаева",            slug: "koshkarbayeva",        district: "Ауэзовский",   description: "Район улицы Кошкарбаева",                                         avgPriceSqm:  650000, coefficient: 0.81, sortOrder: 28 },

  // Дополнительные Жетысуский
  { id: "z-kulgyny",             name: "Кулгыны — Шамгон",       slug: "kulgyny-shamgon",      district: "Жетысуский",    description: "Район Кулгыны, Шамгон",                                           avgPriceSqm:  500000, coefficient: 0.62, sortOrder: 29 },

  // Дополнительные Медеуский
  { id: "z-gornyy-gigant",       name: "Горный Гигант",          slug: "gornyy-gigant",        district: "Медеуский",     description: "Элитный район Горный Гигант",                                     avgPriceSqm: 1400000, coefficient: 1.74, sortOrder: 30 },

  // Дополнительные Бостандыкский
  { id: "z-baganashyl",          name: "Баганашыл",              slug: "baganashyl",           district: "Бостандыкский", description: "Предгорный район Баганашыл",                                      avgPriceSqm: 1000000, coefficient: 1.24, sortOrder: 31 },
  { id: "z-koktem",              name: "Коктем",                 slug: "koktem",               district: "Бостандыкский", description: "Микрорайоны Коктем 1-3",                                           avgPriceSqm:  900000, coefficient: 1.12, sortOrder: 32 },

  // Дополнительные Алмалинский
  { id: "z-tole-bi",             name: "Толе Би — Сейфуллина",   slug: "tole-bi-seyfullina",   district: "Алмалинский",   description: "Район пересечения Толе Би и Сейфуллина",                          avgPriceSqm:  850000, coefficient: 1.06, sortOrder: 33 },

  // Дополнительные Турксибский
  { id: "z-tastak-turksib",      name: "Тастак (Турксиб)",       slug: "tastak-turksib",       district: "Турксибский",   description: "Район Тастак в составе Турксибского",                             avgPriceSqm:  550000, coefficient: 0.68, sortOrder: 34 },

  // ── Алматинская область ──
  { id: "z-talgar",              name: "Талгар",                 slug: "talgar",               district: "Алматинская обл.", description: "Город Талгар, 25 км от Алматы",                                  avgPriceSqm:  350000, coefficient: 0.43, sortOrder: 35 },
  { id: "z-talgarskiy-trakt",    name: "Талгарский тракт",       slug: "talgarskiy-trakt",     district: "Алматинская обл.", description: "Трасса Алматы — Талгар, придорожные посёлки",                     avgPriceSqm:  380000, coefficient: 0.47, sortOrder: 36 },
  { id: "z-kaskelen",            name: "Каскелен",               slug: "kaskelen",             district: "Алматинская обл.", description: "Город Каскелен, западное направление",                           avgPriceSqm:  370000, coefficient: 0.46, sortOrder: 37 },
  { id: "z-issyk",               name: "Иссык (Есик)",           slug: "issyk",                district: "Алматинская обл.", description: "Город Иссык, 60 км от Алматы",                                   avgPriceSqm:  300000, coefficient: 0.37, sortOrder: 38 },
  { id: "z-kapshagay",           name: "Капшагай (Конаев)",      slug: "kapshagay",            district: "Алматинская обл.", description: "Город Конаев (Капшагай), 80 км от Алматы",                       avgPriceSqm:  280000, coefficient: 0.35, sortOrder: 39 },
  { id: "z-kuldzhinskiy-trakt",  name: "Кульджинский тракт",     slug: "kuldzhinskiy-trakt",   district: "Алматинская обл.", description: "Трасса в восточном направлении, посёлки",                        avgPriceSqm:  350000, coefficient: 0.43, sortOrder: 40 },
  { id: "z-otegen-batyr",        name: "Отеген батыр",           slug: "otegen-batyr",         district: "Алматинская обл.", description: "Посёлок Отеген батыр, юг Алматы",                                avgPriceSqm:  320000, coefficient: 0.40, sortOrder: 41 },
  { id: "z-burundai",            name: "Бурундай",               slug: "burundai",             district: "Алматинская обл.", description: "Посёлок Бурундай, западное направление",                         avgPriceSqm:  300000, coefficient: 0.37, sortOrder: 42 },
  { id: "z-tuzdybastau",         name: "Туздыбастау",            slug: "tuzdybastau",          district: "Алматинская обл.", description: "Посёлок Туздыбастау, Талгарский район",                          avgPriceSqm:  280000, coefficient: 0.35, sortOrder: 43 },
  { id: "z-uzynagash",           name: "Узынагаш",               slug: "uzynagash",            district: "Алматинская обл.", description: "Посёлок Узынагаш, Жамбылский район",                             avgPriceSqm:  250000, coefficient: 0.31, sortOrder: 44 },
  { id: "z-besagash",            name: "Бесагаш",               slug: "besagash",             district: "Алматинская обл.", description: "Посёлок Бесагаш, Талгарский район",                              avgPriceSqm:  320000, coefficient: 0.40, sortOrder: 45 },
  { id: "z-raiymbek",            name: "Райымбек",               slug: "raiymbek",             district: "Алматинская обл.", description: "Посёлок Райымбек, восточное направление",                        avgPriceSqm:  300000, coefficient: 0.37, sortOrder: 46 },
];

/** Group zones by district for dropdown rendering */
export function getZonesByDistrict(zones: PriceZone[]): Record<string, PriceZone[]> {
  const grouped: Record<string, PriceZone[]> = {};
  for (const zone of zones) {
    if (!grouped[zone.district]) grouped[zone.district] = [];
    grouped[zone.district].push(zone);
  }
  return grouped;
}
