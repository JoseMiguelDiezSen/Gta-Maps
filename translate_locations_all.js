const fs = require('fs');
const path = require('path');

const categoryTranslations = {
  // Properties
  "Búnkeres": { es: "Búnkeres", en: "Bunkers", pt: "Bunkers", zh: "地堡", fr: "Bunkers", de: "Bunker", it: "Bunker", ru: "Бункеры", ar: "مخابئ", ja: "地下基地", hi: "बंकर", tr: "Sığınaklar", ko: "벙커" },
  "Instalaciones": { es: "Instalaciones", en: "Facilities", pt: "Complexos", zh: "设施", fr: "Complexes", de: "Basen", it: "Basi operative", ru: "Комплексы", ar: "المرافق", ja: "施設", hi: "सुविधाएं", tr: "Tesisler", ko: "시설" },
  "Talleres Mecánicos": { es: "Talleres Mecánicos", en: "Auto Shops", pt: "Oficinas Mecânicas", zh: "改装铺", fr: "Ateliers auto", de: "Autowerkstätten", it: "Autofficine", ru: "Автомастерские", ar: "ورش السيارات", ja: "オートショップ", hi: "ऑटो शॉप", tr: "Oto Tamirhaneleri", ko: "튜닝 샵" },
  "Oficinas de Ejecutivo": { es: "Oficinas de Ejecutivo", en: "Executive Offices", pt: "Escritórios de Executivo", zh: "主管办公室", fr: "Bureaux de PDG", de: "Executive-Büros", it: "Uffici dirigenziali", ru: "Офисы", ar: "المكاتب التنفيذية", ja: "オフィス", hi: "कार्यकारी कार्यालय", tr: "Yönetici Ofisleri", ko: "CEO 오피스" },
  "Salones Recreativos": { es: "Salones Recreativos", en: "Arcades", pt: "Fliperamas", zh: "游戏厅", fr: "Salles d'arcade", de: "Spielhallen", it: "Sale giochi", ru: "Игровые залы", ar: "صالات الألعاب", ja: "アーケード", hi: "आर्केड", tr: "Atari Salonları", ko: "아케이드" },
  "Hangares": { es: "Hangares", en: "Hangars", pt: "Hangares", zh: "机库", fr: "Hangars", de: "Hangars", it: "Hangar", ru: "Ангары", ar: "حظائر الطائرات", ja: "格納庫", hi: "विमान हैंगर", tr: "Hangarlar", ko: "격납고" },
  "Agencias (The Contract)": { es: "Agencias (The Contract)", en: "Agencies (The Contract)", pt: "Agências (The Contract)", zh: "事务所 (合约)", fr: "Agences (Le Contrat)", de: "Agenturen (The Contract)", it: "Agenzie (The Contract)", ru: "Агентства (Контракт)", ar: "الوكالات (العقد)", ja: "エージェンシー (契約)", hi: "एजेंसियां (द कॉन्ट्रैक्ट)", tr: "Ajanslar (The Contract)", ko: "사무소 (계약)" },
  "Desguaces (Salvage Yards)": { es: "Desguaces (Salvage Yards)", en: "Salvage Yards", pt: "Desmanches (Salvage Yards)", zh: "回收站", fr: "Casses auto", de: "Schrottplätze", it: "Sfasciacarrozze", ru: "Утилизационные цеха", ar: "ساحات الخردة", ja: "サルベージヤード", hi: "कबाड़खाना", tr: "Hurdalıklar", ko: "폐차장" },
  "Almacenes de Vehículos": { es: "Almacenes de Vehículos", en: "Vehicle Warehouses", pt: "Depósitos de Veículos", zh: "载具仓库", fr: "Entrepôts de véhicules", de: "Fahrzeug-Lagerhäuser", it: "Magazzini veicoli", ru: "Транспортные склады", ar: "مستودعات المركبات", ja: "車両取引倉庫", hi: "वाहन गोदाम", tr: "Araç Depoları", ko: "이동수단 창고" },
  "Arena War (Taller)": { es: "Arena War (Taller)", en: "Arena War Workshop", pt: "Oficina de Arena War", zh: "竞技场之战工坊", fr: "Atelier d'arène", de: "Arena War Werkstatt", it: "Officina Arena War", ru: "Мастерская арены", ar: "ورشة أرينا وور", ja: "アリーナワークショップ", hi: "एरिना वॉर वर्कशॉप", tr: "Arena War Atölyesi", ko: "아레나 워크숍" },
  "Apartamento de Lujo": { es: "Apartamento de Lujo", en: "High-End Apartment", pt: "Apartamento de Luxo", zh: "高端公寓", fr: "Appartement de luxe", de: "Luxusapartment", it: "Appartamento di lusso", ru: "Элитная квартира", ar: "شقة فاخرة", ja: "高級アパート", hi: "आलीशान अपार्टमेंट", tr: "Lüks Daire", ko: "고급 아파트" },
  "Apartamento de Gama Media": { es: "Apartamento de Gama Media", en: "Medium-End Apartment", pt: "Apartamento de Médio Porte", zh: "中端公寓", fr: "Appartement de moyen standing", de: "Mittelklasse-Apartment", it: "Appartamento di media fascia", ru: "Квартира среднего класса", ar: "شقة متوسطة", ja: "中級アパート", hi: "मध्यम श्रेणी का अपार्टमेंट", tr: "Orta Sınıf Daire", ko: "중급 아파트" },
  "Apartamento Básico": { es: "Apartamento Básico", en: "Low-End Apartment", pt: "Apartamento Simples", zh: "低端公寓", fr: "Appartement modeste", de: "Standard-Apartment", it: "Appartamento economico", ru: "Бюджетная квартира", ar: "شقة اقتصادية", ja: "低級アパート", hi: "किफायती अपार्टमेंट", tr: "Ekonomik Daire", ko: "저급 아파트" },
  "Garaje Independiente": { es: "Garaje Independiente", en: "Standalone Garage", pt: "Garagem Independente", zh: "独立车库", fr: "Garage indépendant", de: "Freistehende Garage", it: "Garage indipendente", ru: "Отдельный гараж", ar: "مرآب مستقل", ja: "独立ガレージ", hi: "अलग गैरेज", tr: "Müstakil Garaj", ko: "단독 차고" },
  "Mansión de Lujo": { es: "Mansión de Lujo", en: "Stilt House / Mansion", pt: "Mansão de Luxo", zh: "豪宅", fr: "Maison sur pilotis / Manoir", de: "Stelzenhaus / Villa", it: "Villa di lusso", ru: "Элитный особняк", ar: "قصر فاخر", ja: "豪華な邸宅", hi: "आलीशान हवेली", tr: "Lüks Malikane", ko: "고급 저택" },

  // Businesses
  "Almacenes de Mercancía Especial": { es: "Almacenes de Mercancía Especial", en: "Special Cargo Warehouses", pt: "Depósitos de Muamba", zh: "特种货物仓库", fr: "Entrepôts de marchandises", de: "Spezialfracht-Lagerhäuser", it: "Magazzini merci speciali", ru: "Склады спецгруза", ar: "مستودعات البضائع الخاصة", ja: "極秘貨物倉庫", hi: "विशेष कार्गो गोदाम", tr: "Özel Kargo Depoları", ko: "스페셜 패키지 창고" },
  "Clubes Nocturnos": { es: "Clubes Nocturnos", en: "Nightclubs", pt: "Boates", zh: "夜总会", fr: "Boîtes de nuit", de: "Nachtclubs", it: "Night club", ru: "Ночные клубы", ar: "النوادي الليلية", ja: "ナイトクラブ", hi: "नाइट क्लब", tr: "Gece Kulüpleri", ko: "나이트클럽" },
  "Laboratorio de Cocaína": { es: "Laboratorio de Cocaína", en: "Cocaine Lockup", pt: "Laboratório de Cocaína", zh: "可卡因工场", fr: "Laboratoire de cocaïne", de: "Kokain-Labor", it: "Laboratorio di cocaina", ru: "Кокаиновый склад", ar: "مختبر الكوكايين", ja: "コカイン精製所", hi: "कोकीन लैब", tr: "Kokain Deposu", ko: "코카인 작업실" },
  "Cultivo de Marihuana": { es: "Cultivo de Marihuana", en: "Weed Farm", pt: "Plantação de Maconha", zh: "大麻种植园", fr: "Ferme de cannabis", de: "Hanffarm", it: "Piantagione di erba", ru: "Ферма марихуаны", ar: "مزرعة الحشيش", ja: "大麻農園", hi: "गांजा फार्म", tr: "Kenevir Çiftliği", ko: "마리화나 농장" },
  "Laboratorio de Metanfetamina": { es: "Laboratorio de Metanfetamina", en: "Meth Lab", pt: "Laboratório de Metanfetamina", zh: "冰毒实验室", fr: "Laboratoire de méthamphétamine", de: "Meth-Labor", it: "Laboratorio di metanfetamina", ru: "Лаборатория метамфетамина", ar: "مختبر الميث", ja: "白粉精製所", hi: "मेथ लैब", tr: "Metamfetamin Laboratuvarı", ko: "필로폰 제조실" },
  "Fábrica de Dinero Falso": { es: "Fábrica de Dinero Falso", en: "Counterfeit Cash Factory", pt: "Fábrica de Falsificação", zh: "假钞印刷厂", fr: "Usine de fausse monnaie", de: "Falschgeld-Druckerei", it: "Stamperia banconote false", ru: "Печатная фабрика фальшивок", ar: "مصنع تزييف النقود", ja: "偽造紙幣印刷所", hi: "नकली नोट फैक्ट्री", tr: "Sahte Para Fabrikası", ko: "위조지폐 공장" },
  "Oficina de Falsificación de Documentos": { es: "Oficina de Falsificación de Documentos", en: "Document Forgery Office", pt: "Falsificação de Documentos", zh: "假证办公室", fr: "Atelier de fausse monnaie et papiers", de: "Dokumentenfälscherei", it: "Falsificazione documenti", ru: "Подделка документов", ar: "مكتب تزوير الوثائق", ja: "偽造文書オフィス", hi: "दस्तावेज़ जालसाजी कार्यालय", tr: "Sahte Belge Ofisi", ko: "위조 서류 오피스" },

  // Services
  "Tiendas y Servicios": { es: "Tiendas y Servicios", en: "Stores & Services", pt: "Lojas e Serviços", zh: "商店与服务", fr: "Magasins et services", de: "Geschäfte & Dienstleistungen", it: "Negozi e servizi", ru: "Магазины и услуги", ar: "المتاجر والخدمات", ja: "店舗＆サービス", hi: "दुकानें और सेवाएं", tr: "Mağazalar ve Hizmetler", ko: "상점 및 서비스" },
  "Supermercado 24/7": { es: "Supermercado 24/7", en: "24/7 Supermarket", pt: "Supermercado 24/7", zh: "24/7 便利店", fr: "Supermarché 24/7", de: "24/7 Supermarkt", it: "Supermercato 24/7", ru: "Супермаркет 24/7", ar: "سوبرماركت 24/7", ja: "24/7 スーパーマーケット", hi: "24/7 सुपरमार्केट", tr: "24/7 Süpermarket", ko: "24/7 편의점" },
  "Túnel de Lavado": { es: "Túnel de Lavado", en: "Car Wash", pt: "Lava-Rápido", zh: "洗车房", fr: "Lavage auto", de: "Autowaschanlage", it: "Autolavaggio", ru: "Автомойка", ar: "مغسلة سيارات", ja: "洗車場", hi: "कार वॉश", tr: "Oto Yıkama", ko: "세차장" },
  "Club de Striptease": { es: "Club de Striptease", en: "Strip Club (Vanilla Unicorn)", pt: "Clube de Striptease", zh: "脱衣舞俱乐部", fr: "Club de strip-tease", de: "Stripclub", it: "Strip club", ru: "Стрип-клуб", ar: "نادي التعري", ja: "ストリップクラブ", hi: "स्ट्रिप क्लब", tr: "Striptiz Kulübü", ko: "스트립 클럽" },
  "Comisarías de Policía": { es: "Comisarías de Policía", en: "Police Stations", pt: "Delegacias de Polícia", zh: "警察局", fr: "Commissariats de police", de: "Polizeistationen", it: "Stazioni di polizia", ru: "Полицейские участки", ar: "مراكز الشرطة", ja: "警察署", hi: "पुलिस स्टेशन", tr: "Polis Karakolları", ko: "경찰서" },
  "Hospitales y Centros Médicos": { es: "Hospitales y Centros Médicos", en: "Hospitals & Medical Centers", pt: "Hospitais e Centros Médicos", zh: "医院与医疗中心", fr: "Hôpitaux et centres médicaux", de: "Krankenhäuser & Kliniken", it: "Ospedali e centri medici", ru: "Больницы и медцентры", ar: "المستشفيات والمراكز الطبية", ja: "病院＆医療センター", hi: "अस्पताल और चिकित्सा केंद्र", tr: "Hastaneler ve Tıp Merkezleri", ko: "병원 및 의료 센터" },
  "Estaciones de Bomberos (LSFD)": { es: "Estaciones de Bomberos (LSFD)", en: "Fire Stations (LSFD)", pt: "Corpo de Bombeiros (LSFD)", zh: "消防局 (LSFD)", fr: "Casernes de pompiers (LSFD)", de: "Feuerwachen (LSFD)", it: "Stazioni dei pompieri (LSFD)", ru: "Пожарные станции (LSFD)", ar: "محطات الإطفاء (LSFD)", ja: "消防署 (LSFD)", hi: "दमकल केंद्र (LSFD)", tr: "İtfaiye İstasyonları (LSFD)", ko: "소방서 (LSFD)" },
  "Tienda de Máscaras de Película": { es: "Tienda de Máscaras de Película", en: "Movie Masks Shop", pt: "Loja de Máscaras de Cinema", zh: "电影面具店", fr: "Magasin de masques", de: "Filmmasken-Laden", it: "Negozio di maschere cinematografiche", ru: "Магазин масок", ar: "متجر أقنعة السينما", ja: "ムービーマスクショップ", hi: "फिल्म मास्क की दुकान", tr: "Film Maskeleri Mağazası", ko: "영화 가면 상점" },

  // Vehicle shops
  "Taller Los Santos Customs": { es: "Taller Los Santos Customs", en: "Los Santos Customs", pt: "Los Santos Customs", zh: "洛圣都改车王", fr: "Los Santos Customs", de: "Los Santos Customs", it: "Los Santos Customs", ru: "Los Santos Customs", ar: "لوس سانتوس كاستمز", ja: "ロスサントス・カスタム", hi: "लॉस सैंटोस कस्टम्स", tr: "Los Santos Customs", ko: "로스 산토스 커스텀" },
  "Taller de Benny": { es: "Taller de Benny", en: "Benny's Original Motor Works", pt: "Benny's Original Motor Works", zh: "本尼原创汽车工坊", fr: "Benny's Original Motor Works", de: "Benny's Original Motor Works", it: "Benny's Original Motor Works", ru: "Benny's Original Motor Works", ar: "بينيز أوريجينال موتور ووركس", ja: "ベニーズ・オリジナル・モーターワークス", hi: "बेनीज ओरिजिनल मोटर वर्क्स", tr: "Benny's Original Motor Works", ko: "베니즈 오리지널 모터 웍스" },
  "Garaje de Hao (HSW)": { es: "Garaje de Hao (HSW)", en: "Hao's Special Works (HSW)", pt: "Hao's Special Works (HSW)", zh: "阿浩特别工坊 (HSW)", fr: "Hao's Special Works (HSW)", de: "Hao's Special Works (HSW)", it: "Hao's Special Works (HSW)", ru: "Hao's Special Works (HSW)", ar: "هاوز سبيشال ووركس (HSW)", ja: "ハオ・スペシャルワークス (HSW)", hi: "हाओज़ स्पेशल वर्क्स (HSW)", tr: "Hao's Special Works (HSW)", ko: "하오의 스페셜 웍스 (HSW)" },
  "LS Car Meet (Cypress Flats)": { es: "LS Car Meet (Cypress Flats)", en: "LS Car Meet (Cypress Flats)", pt: "LS Car Meet (Cypress Flats)", zh: "洛圣都车友会 (塞普里斯平原)", fr: "Salon auto de LS (Cypress Flats)", de: "LS Car Meet (Cypress Flats)", it: "Autoraduno di LS (Cypress Flats)", ru: "Автоклуб ЛС (Сайпресс-Флэтс)", ar: "ملتقى سيارات لوس سانتوس", ja: "LSカーミーティング (サイプレスフラット)", hi: "एलएस कार मीट (साइप्रस फ्लैट्स)", tr: "LS Araba Buluşması (Cypress Flats)", ko: "LS 자동차 모임 (사이프러스 플랫)" },

  // Characters & Strange Places & Roleplay
  "Contacto y Personaje": { es: "Contacto y Personaje", en: "Contact & Key Character", pt: "Contato e Personagem", zh: "联系人与关键人物", fr: "Contact et personnage clé", de: "Kontakt & Schlüsselperson", it: "Contatto e personaggio chiave", ru: "Контакт и ключевой персонаж", ar: "شخصية اتصال رئيسية", ja: "連絡先＆キーキャラクター", hi: "संपर्क और प्रमुख पात्र", tr: "İletişim ve Kilit Karakter", ko: "연락처 및 주요 인물" },
  "Naufragios y Restos": { es: "Naufragios y Restos", en: "Shipwrecks & Sunken Remains", pt: "Naufrágios e Destroços", zh: "沉船与遗迹", fr: "Épaves et vestiges", de: "Schiffswracks & Überreste", it: "Relitti e resti sommersi", ru: "Кораблекрушения и останки", ar: "حطام السفن والبقايا", ja: "難破船＆沈没遺物", hi: "जहाज के मलबे और अवशेष", tr: "Gemi Enkazları ve Kalıntılar", ko: "난파선 및 침몰 유적" },
  "OVNI": { es: "OVNI", en: "UFO Sightings", pt: "OVNI", zh: "不明飞行物 (UFO)", fr: "OVNI", de: "UFO", it: "UFO", ru: "НЛО", ar: "أطباق طائرة (UFO)", ja: "未確認飛行物体 (UFO)", hi: "यूएफओ (UFO)", tr: "UFO Gözlemleri", ko: "미확인 비행물체 (UFO)" },
  "Trabajos y Empleos de Rol": { es: "Trabajos y Empleos de Rol", en: "Roleplay Jobs & Careers", pt: "Trabalhos e Empregos de Roleplay", zh: "角色扮演职业与工作", fr: "Emplois et métiers Roleplay", de: "Roleplay-Jobs & Berufe", it: "Lavori e carriere Roleplay", ru: "Ролевые работы и профессии", ar: "وظائف الرول بلاي", ja: "ロールプレイ職業＆ジョブ", hi: "रोलप्ले नौकरियां और करियर", tr: "Roleplay İşleri ve Meslekler", ko: "롤플레이 직업 및 일자리" }
};

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const modes = ['online', 'historia'];
const baseClient = 'gtaapp.client/src/assets/data/gta5';

const filesToLocalize = [
  'properties.json',
  'businesses.json',
  'services.json',
  'vehicle_shops.json',
  'characters.json',
  'strange_places.json',
  'roleplay_jobs.json'
];

modes.forEach(mode => {
  filesToLocalize.forEach(fileName => {
    const esPath = path.join(baseClient, mode, 'es', fileName);
    if (!fs.existsSync(esPath)) return;
    const esList = JSON.parse(fs.readFileSync(esPath, 'utf8'));

    langs.forEach(lang => {
      const targetPath = path.join(baseClient, mode, lang, fileName);
      let targetList = fs.existsSync(targetPath) ? JSON.parse(fs.readFileSync(targetPath, 'utf8')) : [];

      const result = esList.map((item, idx) => {
        const targetItem = targetList[idx] || {};
        const catMap = categoryTranslations[item.categoryLabel];
        const localizedCatLabel = (catMap && catMap[lang]) ? catMap[lang] : (targetItem.categoryLabel || item.categoryLabel);

        return {
          ...item,
          ...targetItem,
          categoryLabel: localizedCatLabel
        };
      });

      fs.writeFileSync(targetPath, JSON.stringify(result, null, 2), 'utf8');
    });
    console.log(`Updated categories for ${mode}/${fileName}`);
  });
});
