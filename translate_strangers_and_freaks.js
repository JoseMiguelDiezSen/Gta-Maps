const fs = require('fs');
const path = require('path');

const sfDict = {
  series: {
    tonya: {
      es: "Tonya Wiggins", en: "Tonya Wiggins", pt: "Tonya Wiggins", zh: "托尼亚·威金斯", fr: "Tonya Wiggins",
      de: "Tonya Wiggins", it: "Tonya Wiggins", ru: "Тоня Уиггинс", ar: "تونيا ويغينز", ja: "トーニャ・ウィギンズ",
      hi: "तोन्या विगिन्स", tr: "Tonya Wiggins", ko: "토냐 위긴스"
    },
    beverly: {
      es: "Beverly Felton (Paparazzi)", en: "Beverly Felton (Paparazzo)", pt: "Beverly Felton (Paparazzi)", zh: "比佛利·费尔顿 (狗仔队)", fr: "Beverly Felton (Paparazzi)",
      de: "Beverly Felton (Paparazzo)", it: "Beverly Felton (Paparazzo)", ru: "Беверли Фелтон (Папарацци)", ar: "بيفرلي فيلتون (باباراتزي)", ja: "ビバリー・フェルトン (パパラッチ)",
      hi: "बेवर्ली फेल्टन (पापाराज़ी)", tr: "Beverly Felton (Paparazi)", ko: "베벌리 펠튼 (파파라치)"
    },
    hao: {
      es: "Hao (Carreras Callejeras)", en: "Hao (Street Races)", pt: "Hao (Corridas de Rua)", zh: "阿浩 (街头赛车)", fr: "Hao (Courses de rue)",
      de: "Hao (Straßenrennen)", it: "Hao (Corse clandestine)", ru: "Хао (Уличные гонки)", ar: "هاو (سباقات الشوارع)", ja: "ハオ (ストリートレース)",
      hi: "हाओ (स्ट्रीट रेस)", tr: "Hao (Sokak Yarışları)", ko: "하오 (스트리트 레이스)"
    },
    barry: {
      es: "Barry (Legalización)", en: "Barry (Grass Roots)", pt: "Barry (Legalização)", zh: "巴瑞 (基层行动)", fr: "Barry (Plaidoyer)",
      de: "Barry (Graswurzeln)", it: "Barry (Legalizzazione)", ru: "Барри (Легализация)", ar: "باري (التقنين)", ja: "バリー (大麻合法化)",
      hi: "बैरी (कानूनीकरण)", tr: "Barry (Yasallaştırma)", ko: "배리 (합법화 운동)"
    },
    mary_ann: {
      es: "Mary-Ann (Ejercicio Extremo)", en: "Mary-Ann (Exercising Demons)", pt: "Mary-Ann (Exercício Extremo)", zh: "玛丽-安 (恶魔健身)", fr: "Mary-Ann (Démons de l'exercice)",
      de: "Mary-Ann (Dämonen austreiben)", it: "Mary-Ann (Esercizio estremo)", ru: "Мэри-Энн (Экстремальный фитнес)", ar: "ماري-آن (رياضة متطرفة)", ja: "メアリー・アン (過酷なトレーニング)",
      hi: "मैरी-एन (चरम व्यायाम)", tr: "Mary-Ann (Ekstrem Egzersiz)", ko: "메리앤 (지옥 훈련)"
    },
    dom: {
      es: "Dom Beasley (Riesgo Extremo)", en: "Dom Beasley (Extreme Risk)", pt: "Dom Beasley (Risco Extremo)", zh: "多姆·比斯利 (极限运动)", fr: "Dom Beasley (Risque extrême)",
      de: "Dom Beasley (Extremes Risiko)", it: "Dom Beasley (Rischio estremo)", ru: "Дом Бизли (Экстрим)", ar: "دوم بيزلي (مخاطرة شديدة)", ja: "ドム・ビーズリー (エクストリームスポーツ)",
      hi: "डोम बीस्ली (चरम जोखिम)", tr: "Dom Beasley (Aşırı Risk)", ko: "돔 비즐리 (익스트림 스포츠)"
    },
    omega: {
      es: "Omega (Nave Espacial)", en: "Omega (Spaceship Parts)", pt: "Ômega (Nave Espacial)", zh: "欧米茄 (外星飞船)", fr: "Omega (Vaisseau spatial)",
      de: "Omega (Raumschiffteile)", it: "Omega (Astronave)", ru: "Омега (Космический корабль)", ar: "أوميغا (سفينة فضائية)", ja: "オメガ (宇宙船のパーツ)",
      hi: "ओमेगा (अंतरिक्ष यान)", tr: "Omega (Uzay Gemisi)", ko: "오메가 (우주선 부품)"
    },
    dreyfuss: {
      es: "Peter Dreyfuss (Leonora Johnson)", en: "Peter Dreyfuss (Letter Scraps)", pt: "Peter Dreyfuss (Leonora Johnson)", zh: "彼得·德雷福斯 (信件碎片)", fr: "Peter Dreyfuss (Lettres)",
      de: "Peter Dreyfuss (Briefschnipsel)", it: "Peter Dreyfuss (Ritagli di lettere)", ru: "Питер Дрейфус (Тайна Леоноры)", ar: "بيتر دريفوس (قصاصات الرسائل)", ja: "ピーター・ドレイファス (手紙の切れ端)",
      hi: "पीटर ड्रेफस (पत्र के टुकड़े)", tr: "Peter Dreyfuss (Mektup Parçaları)", ko: "피터 드레이퍼스 (편지 조각)"
    },
    abigail: {
      es: "Abigail Mathers (Submarino)", en: "Abigail Mathers (Submarine Pieces)", pt: "Abigail Mathers (Submarino)", zh: "阿比盖尔·马瑟斯 (潜艇碎片)", fr: "Abigail Mathers (Sous-marin)",
      de: "Abigail Mathers (U-Boot-Teile)", it: "Abigail Mathers (Pezzi di sottomarino)", ru: "Эбигейл Мэтерс (Части субмарины)", ar: "أبيجيل ماذرز (قطع الغواصة)", ja: "アビゲイル・メイザース (潜水艦パーツ)",
      hi: "अबिगैल मैथर्स (पनडुब्बी टुकड़े)", tr: "Abigail Mathers (Denizaltı Parçaları)", ko: "애비게일 매더스 (잠수함 조각)"
    },
    mrs_philips: {
      es: "Sra. Philips (Madre de Trevor)", en: "Mrs. Philips (Trevor's Mother)", pt: "Sra. Philips (Mãe de Trevor)", zh: "菲利普斯夫人 (崔佛母亲)", fr: "Mme Philips (Mère de Trevor)",
      de: "Mrs. Philips (Trevors Mutter)", it: "Sig.ra Philips (Madre di Trevor)", ru: "Миссис Филипс (Мать Тревора)", ar: "السيدة فيليبس (والدة تريفور)", ja: "フィリップス夫人 (トレバーの母親)",
      hi: "श्रीमती फिलिप्स (ट्रेवर की माँ)", tr: "Bayan Philips (Trevor'ün Annesi)", ko: "필립스 부인 (트레버의 어머니)"
    },
    nigel: {
      es: "Nigel y Sra. Thornhill (Souvenirs)", en: "Nigel and Mrs. Thornhill (Vinewood Souvenirs)", pt: "Nigel e Sra. Thornhill (Lembranças)", zh: "奈杰和索恩希尔夫人 (好麦坞纪念品)", fr: "Nigel et Mme Thornhill (Souvenirs de Vinewood)",
      de: "Nigel und Mrs. Thornhill (Vinewood-Souvenirs)", it: "Nigel e signora Thornhill (Souvenir)", ru: "Найджел и миссис Торнхилл (Сувениры)", ar: "نايجل والسيدة ثورنهيل (تذكارات فاينوود)", ja: "ナイジェルとソーンヒル夫人 (セレブの記念品)",
      hi: "नाइगेल और श्रीमती थॉर्नहिल (स्मृति चिन्ह)", tr: "Nigel ve Bayan Thornhill (Vinewood Hatıraları)", ko: "나이젤과 쏜힐 부인 (바인우드 기념품)"
    },
    cletus: {
      es: "Cletus (Práctica de Tiro)", en: "Cletus (Target & Hunting)", pt: "Cletus (Prática de Tiro)", zh: "克莱特斯 (打靶与狩猎)", fr: "Cletus (Tir à la cible et chasse)",
      de: "Cletus (Schieß- und Jagdtraining)", it: "Cletus (Tiro al bersaglio e caccia)", ru: "Клетус (Стрельба и охота)", ar: "كليتوس (رماية وصيد)", ja: "クレタス (射撃と狩猟)",
      hi: "क्लीटस (शूटिंग और शिकार)", tr: "Cletus (Hedef ve Avcılık)", ko: "클레터스 (사격 및 사냥)"
    },
    minute_men: {
      es: "Civil Border Patrol (Patrulla)", en: "Civil Border Patrol", pt: "Patrulha de Fronteira Civil", zh: "民兵边境巡逻队", fr: "Patrouille frontalière civile",
      de: "Bürgerwehr-Grenzpatrouille", it: "Pattuglia di confine civile", ru: "Гражданский пограничный патруль", ar: "دوريات الحدود المدنية", ja: "民間国境警備隊",
      hi: "नागरिक सीमा गश्ती दल", tr: "Sivil Sınır Devriyesi", ko: "민간 국경 순찰대"
    },
    josh: {
      es: "Josh Bernstein (Inmobiliaria)", en: "Josh Bernstein (Real Estate)", pt: "Josh Bernstein (Imobiliária)", zh: "乔希·伯恩斯坦 (房产骗局)", fr: "Josh Bernstein (Immobilier)",
      de: "Josh Bernstein (Immobilien)", it: "Josh Bernstein (Immobiliare)", ru: "Джош Бернштейн (Недвижимость)", ar: "جوش برنشتاين (عقارات)", ja: "ジョシュ・バーンスタイン (不動産詐欺)",
      hi: "जोश बर्नस्टीन (रियल एस्टेट)", tr: "Josh Bernstein (Emlak)", ko: "조쉬 번스타인 (부동산)"
    },
    maude: {
      es: "Maude Eccles (Fugitivos)", en: "Maude Eccles (Bail Bonds)", pt: "Maude Eccles (Fugitivos)", zh: "茉德·埃克尔斯 (通缉犯赏金)", fr: "Maude Eccles (Chasse aux fugitifs)",
      de: "Maude Eccles (Kautionsflüchtlinge)", it: "Maude Eccles (Cacciatore di taglie)", ru: "Мод Экклз (Беглецы)", ar: "مود إكليس (صيد الفارين)", ja: "モード・エクルズ (保釈逃亡者)",
      hi: "मॉड एक्लेस (जमानतदार अपराधी)", tr: "Maude Eccles (Kefalet Kaçakları)", ko: "모드 에클스 (보석금 도망자)"
    }
  }
};

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const baseClient = 'gtaapp.client/src/assets/data/gta5/historia';

const esData = JSON.parse(fs.readFileSync(path.join(baseClient, 'es', 'strangers_and_freaks.json'), 'utf8'));
const enData = JSON.parse(fs.readFileSync(path.join(baseClient, 'en', 'strangers_and_freaks.json'), 'utf8'));

langs.forEach(lang => {
  const currentPath = path.join(baseClient, lang, 'strangers_and_freaks.json');
  let currentData = fs.existsSync(currentPath) ? JSON.parse(fs.readFileSync(currentPath, 'utf8')) : [];

  const localizedList = esData.map((item, index) => {
    const enItem = enData[index] || item;
    const curItem = currentData[index] || {};

    const seriesLocalized = (sfDict.series[item.series] && sfDict.series[item.series][lang]) || item.seriesName;

    // Localize title, description, objectives, goldRequirements
    let title = curItem.title || item.title;
    if (lang === 'en') title = enItem.title || item.titleEn || item.title;
    if (lang === 'es') title = item.title;

    let desc = curItem.description || item.description;
    if (lang === 'en') desc = enItem.description;
    if (lang === 'es') desc = item.description;

    // For languages where description was English/Spanish, format neatly
    let goldReqs = curItem.goldRequirements || enItem.goldRequirements || item.goldRequirements;
    let objs = curItem.objectives || enItem.objectives || item.objectives;

    return {
      ...item,
      title: title,
      titleEn: item.titleEn || enItem.title || item.title,
      seriesName: seriesLocalized,
      description: desc,
      goldRequirements: goldReqs,
      objectives: objs
    };
  });

  fs.writeFileSync(currentPath, JSON.stringify(localizedList, null, 2), 'utf8');
  console.log(`Updated strangers_and_freaks for ${lang} (${localizedList.length} items)`);
});
