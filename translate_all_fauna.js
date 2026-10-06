const fs = require('fs');
const path = require('path');

const faunaDict = {
  "Fauna Salvaje": {
    es: "Fauna Salvaje", en: "Wildlife", pt: "Vida Selvagem", zh: "野生动物", fr: "Faune sauvage",
    de: "Wildtiere", it: "Fauna selvatica", ru: "Дикая природа", ar: "الحياة البرية", ja: "野生動物",
    hi: "वन्यजीव", tr: "Vahşi Yaşam", ko: "야생 동물"
  },
  "Wildlife Specimen": {
    es: "Espécimen de Fauna", en: "Wildlife Specimen", pt: "Espécime Selvagem", zh: "野生动物样本", fr: "Spécimen de faune",
    de: "Wildtierexemplar", it: "Esemplare di fauna", ru: "Образец фауны", ar: "عينة من الحياة البرية", ja: "野生生物標本",
    hi: "वन्यजीव नमूना", tr: "Vahşi Yaşam Örneği", ko: "야생 동물 표본"
  },
  "Domestic Livestock": {
    es: "Ganado Doméstico", en: "Domestic Livestock", pt: "Gado Doméstico", zh: "家畜", fr: "Bétail domestique",
    de: "Nutztier", it: "Bestiame domestico", ru: "Домашний скот", ar: "الماشية الداجنة", ja: "家畜",
    hi: "घरेलू पशु", tr: "Evcil Hayvancılık", ko: "가축"
  }
};

const animalTranslations = {
  "animal-rabbit-hills": {
    name: {
      es: "Conejo Salvaje", en: "Wild Rabbit", pt: "Coelho Selvagem", zh: "野兔", fr: "Lapin sauvage",
      de: "Wildkaninchen", it: "Coniglio selvatico", ru: "Дикий кролик", ar: "أرنب بري", ja: "野ウサギ",
      hi: "जंगली खरगोश", tr: "Yabani Tavşan", ko: "산토끼"
    },
    zone: {
      es: "Colinas de Vinewood y Campo", en: "Vinewood Hills & Countryside", pt: "Colinas de Vinewood e Campo", zh: "好麦坞山与乡村", fr: "Vinewood Hills et campagne",
      de: "Vinewood Hills & Umland", it: "Vinewood Hills e campagna", ru: "Вайнвуд-Хиллз и сельская местность", ar: "تلال فاينوود والريف", ja: "バインウッドヒルズ＆田園地帯",
      hi: "वाइनवुड हिल्स और ग्रामीण क्षेत्र", tr: "Vinewood Tepeleri ve Kırsal Alan", ko: "바인우드 힐스 및 시골"
    },
    description: {
      es: "El conejo salvaje es el mamífero autóctono más común en San Andreas. Aparece de forma natural en Vinewood Hills, el Monte Chiliad, el bosque de Paleto y el valle de Tongva.",
      en: "The wild rabbit is the most common native mammal across San Andreas. Spawns naturally in Vinewood Hills, Mount Chiliad, Paleto Forest, and Tongva Valley.",
      pt: "O coelho selvagem é o mamífero nativo mais comum em San Andreas. Aparece naturalmente em Vinewood Hills, Monte Chiliad, Floresta Paleto e Vale de Tongva.",
      zh: "野兔是圣安地列斯最常见的本土哺乳动物。自然出没于好麦坞山、奇力耶德山、佩立托森林和通法谷。",
      fr: "Le lapin sauvage est le mammifère indigène le plus commun de San Andreas. Apparaît naturellement à Vinewood Hills, au Mont Chiliad, dans la forêt de Paleto et la vallée de Tongva.",
      de: "Das Wildkaninchen ist das häufigste einheimische Säugetier in San Andreas. Kommt natürlich in den Vinewood Hills, am Mount Chiliad, im Paleto Forest und im Tongva Valley vor.",
      it: "Il coniglio selvatico è il mammifero autoctono più comune a San Andreas. Compare naturalmente a Vinewood Hills, sul Monte Chiliad, nella foresta di Paleto e nella valle di Tongva.",
      ru: "Дикий кролик — самое распространенное местное млекопитающее в Сан-Андреасе. Естественно обитает в Вайнвуд-Хиллз, на горе Чилиад, в лесу Палето и долине Тонгва.",
      ar: "الأرنب البري هو أكثر الثدييات الأصلية شيوعاً في سان أندرياس. يظهر بشكل طبيعي في تلال فاينوود وجبل تشيلياد وغابة باليتو ووادي تونغفا.",
      ja: "野ウサギはサンアンドレアス全域で最も一般的な在来哺乳類です。バインウッドヒルズ、チリアド山、パレトフォレスト、トングババレーに自然発生します。",
      hi: "जंगली खरगोश सैन एंड्रियास में सबसे आम मूल स्तनपायी है। वाइनवुड हिल्स, माउंट चिलियाड, पलेटो फॉरेस्ट और टोंगवा वैली में स्वाभाविक रूप से पाया जाता है।",
      tr: "Yabani tavşan, San Andreas genelinde en yaygın yerli memelidir. Vinewood Tepeleri, Chiliad Dağı, Paleto Ormanı ve Tongva Vadisi'nde doğal olarak bulunur.",
      ko: "산토끼는 산 안드레아스 전역에서 가장 흔한 토착 포유류입니다. 바인우드 힐스, 칠리아드 산, 팔레토 숲, 통바 밸리에서 자연 발생합니다."
    },
    features: {
      es: ["Objetivo del Desafío de Fotografía de Fauna", "Común en colinas y vegetación arbustiva", "Rápido y se asusta fácilmente con pasos o vehículos"],
      en: ["Target animal for Wildlife Photography Challenge", "Common throughout hilly and brush vegetation", "Fast-moving and easily scared by footsteps or vehicles"],
      pt: ["Animal alvo do Desafio de Fotografia da Vida Selvagem", "Comum em colinas e vegetação arbustiva", "Rápido e facilmente assustado por passos ou veículos"],
      zh: ["野生动物摄影挑战目标", "常见于丘陵和灌木丛中", "动作迅速，极易受脚步声或车辆惊吓"],
      fr: ["Cible pour le défi de photographie animalière", "Commun dans les collines et les broussailles", "Rapide et facilement effrayé par les bruits"],
      de: ["Ziel für die Wildtier-Fotografie-Herausforderung", "Häufig in Hügel- und Buschlandschaften", "Schnell und leicht durch Geräusche aufgeschreckt"],
      it: ["Bersaglio per la Sfida di fotografia naturalistica", "Comune nelle zone collinari e cespugliose", "Veloce e facilmente spaventato da rumori o veicoli"],
      ru: ["Цель для фотоохоты на диких животных", "Обычен на холмах и в кустарниковой растительности", "Быстро передвигается и легко пугается звуков"],
      ar: ["هدف لتحدي تصوير الحياة البرية", "شائع في المناطق التلية والشجيرات", "سريع الحركة ويخاف بسهولة من الأصوات والسيارات"],
      ja: ["野生動物写真チャレンジのターゲット", "丘陵地や茂みによく生息", "素早く動き、足音や車に驚いて逃げやすい"],
      hi: ["वन्यजीव फोटोग्राफी चुनौती के लिए लक्ष्य", "पहाड़ी और झाड़ीदार वनस्पतियों में आम", "तेज गति से चलने वाला और आसानी से डरने वाला"],
      tr: ["Vahşi Yaşam Fotoğrafçılığı Mücadelesi hedefi", "Tepelik ve çalılık alanlarda yaygın", "Hızlı hareket eder ve gürültüden kolayca ürker"],
      ko: ["야생 동물 사진 촬영 챌린지 대상", "언덕과 수풀 지대에서 흔히 발견됨", "빠르게 움직이며 발소리나 차량에 쉽게 놀람"]
    },
    income: {
      es: "Recompensa del sumergible Kraken por fotos",
      en: "Photograph target for Kraken Submersible reward",
      pt: "Alvo fotográfico para a recompensa do submersível Kraken",
      zh: "海妖潜艇摄影收集目标",
      fr: "Cible photo pour le submersible Kraken",
      de: "Fotoziel für Kraken-Tauchboot-Belohnung",
      it: "Bersaglio fotografico per sottomarino Kraken",
      ru: "Цель для получения батискафа Kraken",
      ar: "هدف تصوير للحصول على غواصة كراكن",
      ja: "クラーケン潜水艇アンロックの写真ターゲット",
      hi: "क्रेकेन सबमर्सिबल इनाम के लिए फोटो लक्ष्य",
      tr: "Kraken Denizaltısı ödülü için fotoğraf hedefi",
      ko: "크라켄 잠수정 보상을 위한 사진 촬영 목표"
    }
  },
  "animal-deer-chiliad": {
    name: {
      es: "Ciervo de Cola Blanca / Cierva", en: "White-Tailed Deer / Doe", pt: "Veado de Cauda Branca / Corça", zh: "白尾鹿 / 雌鹿", fr: "Cerf de Virginie / Biche",
      de: "Weißwedelhirsch / Ricke", it: "Cervo dalla coda bianca / Cerva", ru: "Белохвостый олень / Самка", ar: "أيل أبيض الذيل / ظبية", ja: "オジロジカ / 牝鹿",
      hi: "सफेद पूंछ वाला हिरण / हिरणी", tr: "Beyaz Kuyruklu Geyik / Dişi Geyik", ko: "흰꼬리사슴 / 암사슴"
    },
    zone: {
      es: "Reserva Natural del Monte Chiliad", en: "Mount Chiliad State Wilderness", pt: "Reserva Natural do Monte Chiliad", zh: "奇力耶德山州立荒野", fr: "Réserve naturelle du Mont Chiliad",
      de: "Mount Chiliad Wildnisgebiet", it: "Riserva naturale del Monte Chiliad", ru: "Заповедник горы Чилиад", ar: "محمية جبل تشيلياد الطبيعية", ja: "チリアド山州立自然保護区",
      hi: "माउंट चिलियाड स्टेट वाइल्डरनेस", tr: "Mount Chiliad Doğal Koruma Alanı", ko: "칠리아드 산 주립 야생보호구역"
    },
    description: {
      es: "Manadas de ciervos que pastan en las laderas boscosas del Monte Chiliad y el bosque de Paleto. La clásica presa de caza de Trevor.",
      en: "Herds of deer grazing along the wooded slopes of Mount Chiliad and Paleto Forest. Trevor's classic hunting prey.",
      pt: "Manadas de veados pastando nas encostas arborizadas do Monte Chiliad e da Floresta Paleto. Presa de caça clássica de Trevor.",
      zh: "在奇力耶德山和佩立托森林的林木斜坡上吃草的鹿群。崔佛经典的狩猎猎物。",
      fr: "Des troupeaux de cerfs paissant le long des pentes boisées du Mont Chiliad et de la forêt de Paleto. La proie de chasse classique de Trevor.",
      de: "Hirschrudel grasen an den bewaldeten Hängen des Mount Chiliad und des Paleto Forest. Trevors klassische Jagdbeute.",
      it: "Mandre di cervi al pascolo lungo i pendii boscosi del Monte Chiliad e della foresta di Paleto. La classica preda di caccia di Trevor.",
      ru: "Стада оленей, пасущиеся на лесистых склонах горы Чилиад и леса Палето. Классическая охотничья добыча Тревора.",
      ar: "قطعان من الأيائل ترعى على طول المنحدرات المشجرة لجبل تشيلياد وغابة باليتو. فريسة تريفور الكلاسيكية للصيد.",
      ja: "チリアド山とパレトフォレストの森林斜面に草を食むシカの群れ。トレバーの定番の狩猟獲物。",
      hi: "माउंट चिलियाड और पलेटो फॉरेस्ट के जंगली ढलानों पर चरते हिरणों के झुंड। ट्रेवर का क्लासिक शिकार।",
      tr: "Mount Chiliad ve Paleto Ormanı'nın ağaçlık yamaçlarında otlayan geyik sürüleri. Trevor'ın klasik avı.",
      ko: "칠리아드 산과 팔레토 숲의 울창한 비탈에서 풀을 뜯는 사슴 떼. 트레버의 대표적인 사냥감입니다."
    },
    features: {
      es: ["Misiones de caza de Trevor y desafío de fotografía", "Población densa en los bosques boreales del norte", "Huye inmediatamente ante disparos o ruido"],
      en: ["Trevor hunting missions and photography challenge", "Dense population in the northern boreal forests", "Flees immediately at any gunshot or noise"],
      pt: ["Missões de caça de Trevor e desafio de fotografia", "População densa nas florestas boreais do norte", "Foge imediatamente com tiros ou barulho"],
      zh: ["崔佛狩猎任务与摄影挑战目标", "北部森林中种群密集", "听到枪声或噪音会立即逃跑"],
      fr: ["Missions de chasse de Trevor et défi photo", "Forte population dans les forêts du nord", "Fuit immédiatement aux coups de feu"],
      de: ["Trevors Jagdmissionen und Foto-Herausforderung", "Dichte Population in den nördlichen Wäldern", "Flieht sofort bei Schüssen oder Lärm"],
      it: ["Missioni di caccia di Trevor e sfida fotografica", "Popolazione densa nelle foreste settentrionali", "Fugge immediatamente agli spari o ai rumori"],
      ru: ["Охотничьи миссии Тревора и фотоохота", "Большая популяция в северных лесах", "Мгновенно убегает при звуке выстрела"],
      ar: ["مهام صيد تريفور وتحدي التصوير", "كثافة سكانية في الغابات الشمالية", "يهرب فور سماع أي إطلاق نار أو ضوضاء"],
      ja: ["トレバーの狩猟ミッションおよび写真チャレンジ", "北部の森林地帯に密集して生息", "銃声や物音を聞くと即座に逃走"],
      hi: ["ट्रेवर शिकार मिशन और फोटोग्राफी चुनौती", "उत्तरी जंगलों में घनी आबादी", "बंदूक की आवाज या शोर पर तुरंत भागता है"],
      tr: ["Trevor av görevleri ve fotoğraf mücadelesi", "Kuzey ormanlarında yoğun nüfus", "Silah sesi veya gürültüde anında kaçar"],
      ko: ["트레버 사냥 미션 및 사진 촬영 챌린지", "북부 삼림 지대에 밀집 서식", "총소리나 소음에 즉시 도망침"]
    },
    income: {
      es: "Caza deportiva y objetivo fotográfico",
      en: "Sport hunting & photography target",
      pt: "Caça esportiva e alvo fotográfico",
      zh: "运动狩猎与摄影目标",
      fr: "Chasse sportive et cible photo",
      de: "Sportjagd & Fotografie-Ziel",
      it: "Caccia sportiva e bersaglio fotografico",
      ru: "Спортивная охота и фотодобыча",
      ar: "صيد رياضي وهدف تصوير",
      ja: "スポーツハンティング＆写真ターゲット",
      hi: "शिकार और फोटोग्राफी लक्ष्य",
      tr: "Spor avcılığı ve fotoğraf hedefi",
      ko: "스포츠 사냥 및 사진 촬영 목표"
    }
  },
  "animal-cougar-tongva": {
    name: {
      es: "Puma / León de Montaña", en: "Mountain Lion / Cougar", pt: "Puma / Suçuarana", zh: "美洲狮", fr: "Puma / Lion des montagnes",
      de: "Puma / Berglöwe", it: "Puma / Leone di montagna", ru: "Пума / Горный лев", ar: "أسد الجبل / بوما", ja: "マウンテンライオン / ピューマ",
      hi: "पहाड़ी शेर / कौगर", tr: "Dağ Aslanı / Puma", ko: "퓨마 / 산사자"
    },
    zone: {
      es: "Colinas de Tongva / Cañón Banham", en: "Tongva Hills / Banham Canyon", pt: "Colinas de Tongva / Cânion Banham", zh: "通法山 / 班汉姆峡谷", fr: "Tongva Hills / Banham Canyon",
      de: "Tongva Hills / Banham Canyon", it: "Tongva Hills / Banham Canyon", ru: "Тонгва-Хиллз / Каньон Банхэм", ar: "تلال تونغفا / كانيون بانهام", ja: "トングバヒルズ / バナムキャニオン",
      hi: "टोंगवा हिल्स / बैनहैम कैन्यन", tr: "Tongva Tepeleri / Banham Kanyonu", ko: "통바 힐스 / 밴햄 캐니언"
    },
    description: {
      es: "El depredador terrestre más letal de San Andreas. Acecha en los barrancos rocosos y ataca por sorpresa con velocidad letal.",
      en: "The deadliest land apex predator in San Andreas. Stalks the rocky ravines and attacks by surprise with lethal speed.",
      pt: "O predador terrestre mais letal de San Andreas. Espreita nas ravinas rochosas e ataca de surpresa com velocidade fatal.",
      zh: "圣安地列斯最致命的陆地顶级捕食者。潜伏在多石的沟壑中，以致命速度发动突袭。",
      fr: "Le prédateur terrestre le plus meurtrier de San Andreas. Rôde dans les ravins rocheux et attaque par surprise à une vitesse mortelle.",
      de: "Das tödlichste Land-Raubtier in San Andreas. Pirscht in felsigen Schluchten und greift überraschend mit tödlicher Geschwindigkeit an.",
      it: "Il predatore terrestre più letale di San Andreas. Si aggira per i burroni rocciosi e attacca a sorpresa con velocità micidiale.",
      ru: "Самый смертоносный наземный хищник в Сан-Андреасе. Выслеживает добычу в скалистых ущельях и нападает из засады.",
      ar: "أخطر مفترس بري في سان أندرياس. يتربص في الوديان الصخرية ويهاجم على حين غرة بسرعة قاتلة.",
      ja: "サンアンドレアスで最も危険な陸上頂点捕食者。岩場の渓谷に潜み、圧倒的なスピードで奇襲を仕掛けてきます。",
      hi: "सैन एंड्रियास में सबसे घातक शिकारी। चट्टानी खड्डों में घात लगाकर जानलेवा गति से हमला करता है।",
      tr: "San Andreas'ın en ölümcül kara avcısı. Kayalık vadilerde pusuya yatar ve ölümcül hızla aniden saldırır.",
      ko: "산 안드레아스에서 가장 치명적인 육상 최상위 포식자. 바위 계곡에 숨어 있다가 엄청난 속도로 기습 공격합니다."
    },
    features: {
      es: ["Depredador agresivo con mordisco letal instantáneo", "Gruñidos graves característicos antes de abalanzarse", "Fotografiable desde una distancia segura"],
      en: ["Aggressive apex predator with a one-hit kill bite", "Distinctive low growls before pouncing", "Photographable from a safe distance"],
      pt: ["Predador agressivo com mordida fatal de um golpe", "Rosnados graves antes de saltar", "Fotografável de uma distância segura"],
      zh: ["极具攻击性的顶级掠食者，具有一击毙命的撕咬能力", "扑击前会发出独特的低沉咆哮", "建议在安全距离外拍照"],
      fr: ["Prédateur agressif avec morsure mortelle", "Grognements caractéristiques avant de bondir", "Photographiable à distance de sécurité"],
      de: ["Aggressives Raubtier mit tödlichem Biss", "Typisches Knurren vor dem Angriff", "Aus sicherer Entfernung fotografierbar"],
      it: ["Predatore aggressivo con morso letale istantaneo", "Ringhi caratteristici prima di balzare", "Fotografabile a distanza di sicurezza"],
      ru: ["Агрессивный хищник, убивающий с одного укуса", "Характерно рычит перед прыжком", "Фотографировать рекомендуется с безопасного расстояния"],
      ar: ["مفترس شرس مع عضة قاتلة بضربة واحدة", "زمجرة منخفضة مميزة قبل الانقضاض", "يمكن تصويره من مسافة آمنة"],
      ja: ["一撃でプレイヤーを倒す獰猛な捕食者", "飛びかかる前に独特の唸り声をあげる", "安全な距離から撮影可能"],
      hi: ["एक ही वार में मारने वाला आक्रामक शिकारी", "झपटने से पहले विशिष्ट गुर्राहट", "सुरक्षित दूरी से फोटो खींचने योग्य"],
      tr: ["Tek vuruşta öldüren yırtıcı hayvan", "Saldırmadan önce belirgin hırıltı çıkarır", "Güvenli mesafeden fotoğraflanabilir"],
      ko: ["한 번의 공격으로 치명타를 입히는 맹수", "덮치기 전 특유의 낮은 으르렁거림", "안전한 거리에서 촬영 권장"]
    },
    income: {
      es: "Objetivo fotográfico de alto riesgo",
      en: "High-risk wildlife photography target",
      pt: "Alvo de fotografia de alto risco",
      zh: "高风险野生动物摄影目标",
      fr: "Cible photo à haut risque",
      de: "Hochriskantes Fotografie-Ziel",
      it: "Bersaglio fotografico ad alto rischio",
      ru: "Высокорисковая цель для фотоохоты",
      ar: "هدف تصوير عالي الخطورة",
      ja: "ハイリスクな野生動物撮影ターゲット",
      hi: "उच्च जोखिम वाला फोटोग्राफी लक्ष्य",
      tr: "Yüksek riskli vahşi yaşam fotoğraf hedefi",
      ko: "고위험 야생 동물 사진 촬영 목표"
    }
  },
  "animal-coyote-senora": {
    name: {
      es: "Coyote del Desierto", en: "Desert Coyote", pt: "Coiote do Deserto", zh: "沙漠郊狼", fr: "Coyote du désert",
      de: "Wüstenkoyote", it: "Coyote del deserto", ru: "Пустынный койот", ar: "ذئب البراري الصحراوي", ja: "コヨーテ",
      hi: "रेगिस्तानी कोयोट", tr: "Çöl Çakalı", ko: "사막 코요테"
    },
    zone: {
      es: "Desierto de Grand Senora", en: "Grand Senora Desert", pt: "Deserto de Grand Senora", zh: "塞诺拉大沙漠", fr: "Désert de Grand Senora",
      de: "Grand-Senora-Wüste", it: "Deserto di Grand Senora", ru: "Пустыня Гранд-Сенора", ar: "صحراء غراند سينورا", ja: "グランド・セノーラ砂漠",
      hi: "ग्रैंड सेनोरा रेगिस्तान", tr: "Grand Senora Çölü", ko: "그랜드 세노라 사막"
    },
    description: {
      es: "Cánido salvaje carroñero del desierto, típico de Grand Senora y las inmediaciones del aeródromo de Sandy Shores.",
      en: "Wild desert canine scavenger typical of the Grand Senora Desert and Sandy Shores Airfield surroundings.",
      pt: "Canídeo selvagem carniceiro do deserto, típico do Deserto de Grand Senora e dos arredores do aeródromo de Sandy Shores.",
      zh: "沙漠食腐犬科野生动物，常见于塞诺拉大沙漠和沙滩海岸机场周围。",
      fr: "Canidé charognard typique du désert de Grand Senora et des environs de l'aérodrome de Sandy Shores.",
      de: "Wilder Aasfresser-Hund, typisch für die Grand-Senora-Wüste und die Umgebung des Flugplatzes Sandy Shores.",
      it: "Canide selvatico tipico del deserto di Grand Senora e dei dintorni dell'aeroporto di Sandy Shores.",
      ru: "Дикий пустынный падальщик, характерный для пустыни Гранд-Сенора и окрестностей аэродрома Сэнди-Шорс.",
      ar: "حيوان كانيد بري قمام نموذجي لصحراء غراند سينورا ومحيط مطار ساندي شورز.",
      ja: "グランド・セノーラ砂漠やサンディ海岸飛行場周辺に生息する野生のイヌ科生物。",
      hi: "ग्रैंड सेनोरा रेगिस्तान और सैंडी शोर्स एयरफील्ड के आसपास का जंगली शिकारी।",
      tr: "Grand Senora Çölü ve Sandy Shores Havaalanı çevresine özgü yabani çakal.",
      ko: "그랜드 세노라 사막과 샌디 해안 비행장 주변에 서식하는 야생 갯과 동물입니다."
    },
    features: {
      es: ["Aúlla por las llanuras desérticas por la noche", "Merodea en solitario o en parejas cerca de caminos rurales", "Menos agresivo que los pumas, huye de los vehículos"],
      en: ["Howls across the desert plains at night", "Roams solo or in pairs near rural roads", "Less aggressive than cougars, runs from vehicles"],
      pt: ["Uiva pelas planícies do deserto à noite", "Ronda sozinho ou em pares perto de estradas rurais", "Menos agressivo que pumas, foge de veículos"],
      zh: ["夜间在沙漠平原上嚎叫", "独自或成对出没于乡村公路旁", "比美洲狮温和，看到车辆会逃跑"],
      fr: ["Hurle dans le désert la nuit", "Rôde seul ou en couple près des routes", "Moins agressif que les pumas, fuit les véhicules"],
      de: ["Heult nachts über die Wüstenebenen", "Streift einzeln oder paarweise an Straßen umher", "Weniger aggressiv als Pumas, flieht vor Fahrzeugen"],
      it: ["Ulula attraverso le pianure desertiche di notte", "Gira da solo o in coppia vicino alle strade", "Meno aggressivo dei puma, fugge dai veicoli"],
      ru: ["Воет в пустыне по ночам", "Бродит в одиночку или парами возле дорог", "Менее агрессивен, чем пума, убегает от машин"],
      ar: ["يعوي في سهول الصحراء ليلاً", "يتجول بمفرده أو في أزواج قرب الطرق الريفية", "أقل شراسة من أسود الجبال، يهرب من السيارات"],
      ja: ["夜間に砂漠の平原で遠吠えをあげる", "田舎道沿いを単独またはペアで徘徊", "ピューマより攻撃性が低く、車から逃げる"],
      hi: ["रात में रेगिस्तान के मैदानों में रोता है", "सड़क किनारे अकेले या जोड़े में घूमता है", "प्यूमा से कम आक्रामक, वाहनों से भागता है"],
      tr: ["Geceleri çöl düzlüklerinde ulur", "Kırsal yolların yakınında tek veya çift olarak gezer", "Pumalara göre daha az saldırgandır, araçlardan kaçar"],
      ko: ["밤에 사막 평원에서 하울링을 함", "시골 도로 근처를 혼자 또는 짝을 지어 배회", "퓨마보다 온순하며 차량을 보면 도망침"]
    },
    income: {
      es: "Objetivo de fotografía de fauna",
      en: "Wildlife photography target",
      pt: "Alvo de fotografia de vida selvagem",
      zh: "野生动物摄影目标",
      fr: "Cible de photographie animalière",
      de: "Ziel für Wildtierfotografie",
      it: "Bersaglio fotografico di fauna",
      ru: "Цель для фотоохоты",
      ar: "هدف تصوير الحياة البرية",
      ja: "野生動物写真ターゲット",
      hi: "वन्यजीव फोटोग्राफी लक्ष्य",
      tr: "Vahşi yaşam fotoğraf hedefi",
      ko: "야생 동물 사진 촬영 목표"
    }
  },
  "animal-boar-bolingbroke": {
    name: {
      es: "Jabalí Salvaje", en: "Wild Boar", pt: "Javali Selvagem", zh: "野猪", fr: "Sanglier sauvage",
      de: "Wildschwein", it: "Cinghiale selvatico", ru: "Дикий кабан", ar: "خنزير بري", ja: "イノシシ",
      hi: "जंगली सूअर", tr: "Yaban Domuzu", ko: "야생 멧돼지"
    },
    zone: {
      es: "Colinas de Bolingbroke / Senora", en: "Bolingbroke Hills / Senora", pt: "Colinas de Bolingbroke / Senora", zh: "博林布鲁克山 / 塞诺拉", fr: "Collines de Bolingbroke / Senora",
      de: "Bolingbroke Hills / Senora", it: "Bolingbroke Hills / Senora", ru: "Холмы Болингброк / Сенора", ar: "تلال بولينغبروك / سينورا", ja: "ボリングブロークヒルズ / セノーラ",
      hi: "बोलिंगब्रोक हिल्स / सेनोरा", tr: "Bolingbroke Tepeleri / Senora", ko: "볼링브로크 힐스 / 세노라"
    },
    description: {
      es: "Robusto jabalí que busca comida en las colinas de matorrales que rodean la prisión de Bolingbroke y el parque nacional de Senora.",
      en: "Stout wild boar foraging in the scrub hills surrounding Bolingbroke Penitentiary and Senora National Park.",
      pt: "Javali robusto forrageando nas colinas ao redor da Penitenciária de Bolingbroke e do Parque Nacional de Senora.",
      zh: "在博林布鲁克监狱和塞诺拉国家公园周围灌木丘陵觅食的强壮野猪。",
      fr: "Sanglier robuste cherchant de la nourriture dans les collines autour du pénitencier de Bolingbroke.",
      de: "Kräftiges Wildschwein auf Nahrungssuche in den Hügeln um die Bolingbroke-Strafanstalt.",
      it: "Robusto cinghiale in cerca di cibo sulle colline intorno al penitenziario di Bolingbroke.",
      ru: "Крупный кабан, ищущий пищу на холмах вокруг тюрьмы Болингброк и национального парка Сенора.",
      ar: "خنزير بري قوي يبحث عن الطعام في التلال المحيطة بسجن بولينغبروك.",
      ja: "ボリングブローク刑務所やセノーラ国立公園周辺の低木丘陵地でエサを探す頑丈なイノシシ。",
      hi: "बोलिंगब्रोक जेल और सेनोरा पार्क के आसपास झाड़ियों में भोजन तलाशता सूअर।",
      tr: "Bolingbroke Cezaevi ve Senora Parkı çevresindeki çalılık tepelerde yiyecek arayan yaban domuzu.",
      ko: "볼링브로크 교도소와 세노라 국립공원 주변 수풀 언덕에서 먹이를 찾는 멧돼지입니다."
    },
    features: {
      es: ["Carga con fuerza si se asusta o se siente acorralado", "Común en matorrales secos y grupos de cactus", "Objetivo de fotografía de fauna"],
      en: ["Powerful charge if startled or cornered", "Common in dry brush and cactus clusters", "Wildlife photography target"],
      pt: ["Investida poderosa se assustado ou encurralado", "Comum em arbustos secos e cactos", "Alvo de fotografia da vida selvagem"],
      zh: ["受到惊吓或被逼入绝境时会强力冲撞", "常见于干燥灌木丛和仙人掌群中", "野生动物摄影目标"],
      fr: ["Charge puissante s'il est acculé", "Commun dans les broussailles et cactus", "Cible de photo animalière"],
      de: ["Kraftvoller Angriff bei Bedrängnis", "Häufig im trockenen Buschland", "Ziel für Wildtierfotografie"],
      it: ["Carica potente se spaventato o messo alle strette", "Comune tra cespugli e cactus", "Bersaglio per fotografia naturalistica"],
      ru: ["Мощный таран при испуге или опасности", "Обычен в сухих кустарниках и кактусах", "Цель для фотоохоты"],
      ar: ["هجوم قوي عند محاصرته أو إخافته", "شائع بين الشجيرات الجافة ونباتات الصبار", "هدف تصوير الحياة البرية"],
      ja: ["驚いたり追い詰められると強烈な突進を行う", "乾燥した茂みやサボテン地帯に生息", "野生動物写真ターゲット"],
      hi: ["घिर जाने पर जोरदार हमला करता है", "सूखी झाड़ियों और कैक्टस में आम", "वन्यजीव फोटोग्राफी लक्ष्य"],
      tr: ["Korktuğunda güçlü şekilde saldırır", "Kuru çalılıklar ve kaktüsler arasında yaygındır", "Vahşi yaşam fotoğraf hedefi"],
      ko: ["궁지에 몰리면 강력한 돌진 공격을 함", "건조한 수풀과 선인장 군락에 흔함", "야생 동물 사진 촬영 대상"]
    },
    income: {
      es: "Objetivo de fotografía de fauna",
      en: "Wildlife photography target",
      pt: "Alvo de fotografia de vida selvagem",
      zh: "野生动物摄影目标",
      fr: "Cible de photographie animalière",
      de: "Ziel für Wildtierfotografie",
      it: "Bersaglio fotografico di fauna",
      ru: "Цель для фотоохоты",
      ar: "هدف تصوير الحياة البرية",
      ja: "野生動物写真ターゲット",
      hi: "वन्यजीव फोटोग्राफी लक्ष्य",
      tr: "Vahşi yaşam fotoğraf hedefi",
      ko: "야생 동물 사진 촬영 목표"
    }
  },
  "animal-hawk-vinewood": {
    name: {
      es: "Halcón de Cola Roja", en: "Red-Tailed Hawk", pt: "Gavião de Cauda Vermelha", zh: "红尾鵟 / 鹰", fr: "Buse à queue rousse",
      de: "Rotschwanzbussard", it: "Poiana codarossa", ru: "Краснохвостый сарыч / Ястреб", ar: "صقر أحمر الذيل", ja: "アカオノスリ / タカ",
      hi: "लाल पूंछ वाला बाज़", tr: "Kızıl Kuyruklu Şahin", ko: "붉은꼬리말똥가리 / 매"
    },
    zone: {
      es: "Cresta de Vinewood Hills", en: "Vinewood Hills Crest", pt: "Crista de Vinewood Hills", zh: "好麦坞山山脊", fr: "Crête de Vinewood Hills",
      de: "Kamm der Vinewood Hills", it: "Cresta di Vinewood Hills", ru: "Гребень Вайнвуд-Хиллз", ar: "قمة تلال فاينوود", ja: "バインウッドヒルズ頂上",
      hi: "वाइनवुड हिल्स क्रेस्ट", tr: "Vinewood Tepeleri Sırtı", ko: "바인우드 힐스 산등성이"
    },
    description: {
      es: "Ave rapaz planeando en corrientes térmicas sobre el icónico cartel de Vinewood y el Observatorio Galileo.",
      en: "Raptor gliding on thermal currents high above the iconic Vinewood Sign and the Galileo Observatory.",
      pt: "Ave de rapina planando em correntes térmicas acima do famoso letreiro de Vinewood e do Observatório Galileo.",
      zh: "在标志性的好麦坞标志和伽利略天文台上空乘热气流滑翔的猛禽。",
      fr: "Rapace planant sur les courants thermiques au-dessus du panneau Vinewood et de l'observatoire Galileo.",
      de: "Greifvogel, der in thermischen Strömungen hoch über dem Vinewood-Schriftzug und dem Observatorium gleitet.",
      it: "Rapace che plana sulle correnti termiche sopra l'iconica scritta di Vinewood e l'Osservatorio Galileo.",
      ru: "Хищная птица, парящая в восходящих потоках над знаком Вайнвуда и обсерваторией Галилео.",
      ar: "طائر جارح يحلق على التيارات الحرارية فوق لافتة فاينوود الشهيرة ومرصد غاليليو.",
      ja: "象徴的なバインウッドサインとガリレオ天文台の上空を上昇気流に乗って滑空する猛禽類。",
      hi: "प्रसिद्ध वाइनवुड साइन और गैलीलियो वेधशाला के ऊपर उड़ने वाला शिकारी पक्षी।",
      tr: "İkonik Vinewood Tabelası ve Galileo Gözlemevi üzerinde süzülen yırtıcı kuş.",
      ko: "유명한 바인우드 사인과 갈릴레오 천문대 상공에서 상승 기류를 타고 활공하는 맹금류입니다."
    },
    features: {
      es: ["Vuelo circular majestuoso en lo alto", "Chillido agudo característico audible desde abajo", "Se posa en rocas, vallas y postes eléctricos"],
      en: ["Majestic circular soaring flight pattern", "Sharp high-pitched screech audible from below", "Perches on boulders, fences, and power poles"],
      pt: ["Voo circular majestoso no alto", "Grito agudo característico audível de baixo", "Pousa em rochas, cercas e postes de energia"],
      zh: ["雄伟的环形盘旋飞行姿态", "下方清晰可辨的尖锐高音啼鸣", "栖息在巨石、栅栏和电线杆上"],
      fr: ["Vol circulaire majestueux", "Cri perçant audible depuis le sol", "Se perche sur les poteaux et rochers"],
      de: ["Majestätischer Kreisflug", "Scharfer Schrei von unten hörbar", "Sitzt auf Felsen, Zäunen und Masten"],
      it: ["Volo circolare maestoso in quota", "Stridio acuto udibile dal basso", "Si posa su massi, recinzioni e pali"],
      ru: ["Величественный круговой полет на высоте", "Резкий пронзительный крик, слышимый снизу", "Садится на камни, заборы и столбы"],
      ar: ["نمط طيران دائري مهيب", "صرخة حادة مسموعة من الأسفل", "يجثم على الصخور والأعمدة"],
      ja: ["雄大な旋回飛行パターン", "下からもはっきりと聞こえる鋭い鳴き声", "岩やフェンス、電柱にとまる"],
      hi: ["भव्य गोलाकार उड़ान पैटर्न", "नीचे से सुनाई देने वाली तीखी चीख", "चट्टानों और खंभों पर बैठता है"],
      tr: ["Görkemli dairesel süzülüş uçuşu", "Aşağıdan duyulabilen keskin çığlık sesi", "Kayalara, çitlere ve direklere tüner"],
      ko: ["위엄 있는 원형 활공 비행 패턴", "아래에서도 들리는 날카로운 울음소리", "바위, 울타리, 전신주에 앉아 휴식"]
    },
    income: {
      es: "Objetivo de fotografía de aves",
      en: "Avian photography target",
      pt: "Alvo de fotografia de aves",
      zh: "鸟类摄影目标",
      fr: "Cible de photographie d'oiseaux",
      de: "Ziel für Vogelfotografie",
      it: "Bersaglio fotografico per uccelli",
      ru: "Цель для фотоохоты на птиц",
      ar: "هدف تصوير الطيور",
      ja: "野鳥撮影ターゲット",
      hi: "पक्षी फोटोग्राफी लक्ष्य",
      tr: "Kuş fotoğrafçılığı hedefi",
      ko: "조류 사진 촬영 목표"
    }
  },
  "animal-cormorant-zancudo": {
    name: {
      es: "Cormorán Neotropical", en: "Neotropical Cormorant", pt: "Biguá / Cormorão", zh: "角鸬鹚", fr: "Cormoran vigua",
      de: "Olivenscharbe / Kormoran", it: "Cormorano", ru: "Баклан", ar: "غراب البحر", ja: "ウ / ウミウ",
      hi: "पनकौआ (कॉर्मोरेंट)", tr: "Karabatak", ko: "가마우지"
    },
    zone: {
      es: "Humedales de Lago Zancudo", en: "Lago Zancudo Wetlands", pt: "Pântanos de Lago Zancudo", zh: "赞库多湖湿地", fr: "Zones humides de Lago Zancudo",
      de: "Feuchtgebiete von Lago Zancudo", it: "Paludi di Lago Zancudo", ru: "Болота Лаго-Занкудо", ar: "أراضي لاغو زانكودو الرطبة", ja: "ザンクード湖湿地帯",
      hi: "लागो ज़ांकुडो आर्द्रभूमि", tr: "Lago Zancudo Sulak Alanları", ko: "라고 잔쿠도 습지"
    },
    description: {
      es: "Ave acuática de plumaje oscuro que bucea en busca de peces en los estuarios poco profundos y pantanos de Lago Zancudo.",
      en: "Dark-feathered waterfowl diving for fish in the shallow estuaries and swampland of Lago Zancudo.",
      pt: "Ave aquática de plumagem escura mergulhando em busca de peixes nos estuários rasos e pântanos de Lago Zancudo.",
      zh: "在赞库多湖的浅河口和沼泽地潜水捕鱼的深色羽毛水鸟。",
      fr: "Oiseau aquatique sombre plongeant pour pêcher dans les marais de Lago Zancudo.",
      de: "Dunkel gefiederter Wasservogel, der in den Sümpfen von Lago Zancudo nach Fischen taucht.",
      it: "Uccello acquatico scuro che si tuffa per pescare nelle paludi di Lago Zancudo.",
      ru: "Темноперая водоплавающая птица, ныряющая за рыбой на мелководье болот Лаго-Занкудо.",
      ar: "طائر مائي داكن الريش يغوص بحثاً عن الأسماك في مستنقعات لاغو زانكودو.",
      ja: "ザンクード湖の浅瀬や湿地帯で魚を獲るために潜水する黒い羽の水鳥。",
      hi: "लागो ज़ांकुडो के दलदलों में मछली पकड़ने के लिए गोता लगाने वाला जलपक्षी।",
      tr: "Lago Zancudo bataklıklarında balık avlamak için dalış yapan su kuşu.",
      ko: "라고 잔쿠도의 얕은 어귀와 습지에서 물고기를 잡기 위해 잠수하는 짙은 깃털의 물새입니다."
    },
    features: {
      es: ["Común a lo largo de humedales, ríos y calas costeras", "Seca su plumaje con las alas extendidas sobre las rocas", "Entrada oficial de fotografía de fauna"],
      en: ["Common along wetlands, rivers, and coastal inlets", "Dries plumage with outstretched wings on rocks", "Official wildlife photography entry"],
      pt: ["Comum em pântanos, rios e enseadas costeiras", "Seca a plumagem com asas abertas sobre rochas", "Entrada oficial de fotografia da vida selvagem"],
      zh: ["常见于湿地、河流和沿海海湾", "在岩石上张开翅膀晾干羽毛", "官方野生动物摄影条目"],
      fr: ["Commun le long des zones humides et rivières", "Sèche son plumage ailes déployées sur les rochers", "Entrée officielle de photo animalière"],
      de: ["Häufig in Feuchtgebieten, Flüssen und Buchten", "Trocknet Gefieder mit ausgebreiteten Flügeln", "Offizieller Wildtierfotografie-Eintrag"],
      it: ["Comune lungo paludi, fiumi e insenature", "Asciuga il piumaggio con ali distese sui sassi", "Voce ufficiale di fotografia naturalistica"],
      ru: ["Обычен на болотах, реках и в бухтах", "Сушит перья, расправив крылья на камнях", "Официальная запись в журнале фотоохоты"],
      ar: ["شائع على طول الأراضي الرطبة والأنهار", "يجفف ريشه بأجنحة مفرودة على الصخور", "إدخال رسمي لتصوير الحياة البرية"],
      ja: ["湿地、河川、海岸の入り江によく生息", "岩の上で翼を広げて羽を乾かす習性", "公式野生動物写真チャレンジ対象"],
      hi: ["आर्द्रभूमि, नदियों और खाड़ियों में आम", "चट्टानों पर पंख फैलाकर सुखाता है", "आधिकारिक वन्यजीव फोटोग्राफी प्रविष्टि"],
      tr: ["Sulak alanlar, nehirler ve koylarda yaygın", "Kayalarda kanatlarını açarak tüylerini kurutur", "Resmi vahşi yaşam fotoğraf kaydı"],
      ko: ["습지, 강, 해안 만을 따라 흔히 발견됨", "바위 위에서 날개를 펼쳐 깃털을 말림", "공식 야생 동물 사진 촬영 항목"]
    },
    income: {
      es: "Objetivo de fotografía de aves acuáticas",
      en: "Waterfowl photography target",
      pt: "Alvo de fotografia de aves aquáticas",
      zh: "水鸟摄影目标",
      fr: "Cible photo d'oiseaux aquatiques",
      de: "Ziel für Wasservogelfotografie",
      it: "Bersaglio fotografico per uccelli acquatici",
      ru: "Цель для фотоохоты на водоплавающих",
      ar: "هدف تصوير الطيور المائية",
      ja: "水鳥撮影ターゲット",
      hi: "जलपक्षी फोटोग्राफी लक्ष्य",
      tr: "Su kuşu fotoğrafçılığı hedefi",
      ko: "물새 사진 촬영 목표"
    }
  },
  "animal-seagull-pier": {
    name: {
      es: "Gaviota de Plata", en: "Silver Gull / Seagull", pt: "Gaivota Prateada", zh: "银鸥 / 海鸥", fr: "Mouette / Goéland argenté",
      de: "Silbermöwe", it: "Gabbiano argentato", ru: "Серебристая чайка", ar: "نورس فضي", ja: "カモメ / セグロカモメ",
      hi: "समुद्री बगला (सीगल)", tr: "Gümüş Martı", ko: "갈매기 / 재갈매기"
    },
    zone: {
      es: "Muelle de Del Perro y Playa de Vespucci", en: "Del Perro Pier & Vespucci Beach", pt: "Píer Del Perro e Praia de Vespucci", zh: "佩罗码头与威斯普奇海滩", fr: "Jetée de Del Perro et plage de Vespucci",
      de: "Del Perro Pier & Vespucci Beach", it: "Molo di Del Perro e spiaggia di Vespucci", ru: "Пирс Дель-Перро и пляж Веспуччи", ar: "رصيف ديل بيرو وشاطئ فيسبوتشي", ja: "デル・ペロ桟橋＆ベスプッチビーチ",
      hi: "डेल पेरो पियर और वेस्पुची बीच", tr: "Del Perro İskelesi ve Vespucci Plajı", ko: "델 페로 부두 및 베스푸치 해변"
    },
    description: {
      es: "Ave costera omnipresente que sobrevuela el paseo marítimo del muelle Del Perro y las concurridas playas de Vespucci.",
      en: "Ubiquitous coastal bird wheeling above Del Perro Pier boardwalk and the busy beaches of Vespucci.",
      pt: "Ave costeira onipresente que sobrevoa o píer de Del Perro e as praias movimentadas de Vespucci.",
      zh: "无处不在的沿海鸟类，在佩罗码头木板路和繁忙的威斯普奇海滩上空盘旋。",
      fr: "Oiseau côtier omniprésent survolant la jetée de Del Perro et les plages de Vespucci.",
      de: "Allgegenwärtiger Küstenvogel über dem Del Perro Pier und den Stränden von Vespucci.",
      it: "Uccello costiero onnipresente sopra il molo di Del Perro e le spiagge di Vespucci.",
      ru: "Повсеместная прибрежная птица, кружащая над пирсом Дель-Перро и пляжами Веспуччи.",
      ar: "طائر ساحلي منتشر يطير فوق رصيف ديل بيرو وشواطئ فيسبوتشي المزدحمة.",
      ja: "デル・ペロ桟橋の遊歩道や賑やかなベスプッチビーチの上空を飛び回る代表的な海鳥。",
      hi: "डेल पेरो पियर और वेस्पुची के व्यस्त समुद्र तटों के ऊपर उड़ने वाला तटीय पक्षी।",
      tr: "Del Perro İskelesi ve Vespucci plajları üzerinde uçan sahil kuşu.",
      ko: "델 페로 부두 보드워크와 번화한 베스푸치 해변 상공을 선회하는 대표적인 해변 조류입니다."
    },
    features: {
      es: ["Se posa en las barandillas del muelle y la noria", "Extremadamente fácil de avistar y fotografiar en la arena", "Objetivo fotográfico rápido"],
      en: ["Perches on pier handrails and the Ferris wheel", "Extremely easy to spot and photograph on the sand", "Quick photo target"],
      pt: ["Pousa nos corrimãos do píer e na roda-gigante", "Extremamente fácil de avistar e fotografar na areia", "Alvo fotográfico rápido"],
      zh: ["栖息在码头栏杆和摩天轮上", "在沙滩上极易发现和拍摄", "快速完成的摄影目标"],
      fr: ["Se pose sur les rambardes et la grande roue", "Très facile à repérer sur le sable", "Cible photo rapide"],
      de: ["Sitzt auf Geländern und dem Riesenrad", "Sehr leicht im Sand zu entdecken und fotografieren", "Schnelles Fotoziel"],
      it: ["Si posa sui corrimano del molo e sulla ruota panoramica", "Facilissimo da individuare sulla sabbia", "Bersaglio fotografico rapido"],
      ru: ["Садится на перила пирса и колесо обозрения", "Очень легко найти и сфотографировать на песке", "Быстрая фотоцель"],
      ar: ["يجثم على درابزين الرصيف وعجلة فيريس", "من السهل جداً رصده وتصويره على الرمال", "هدف تصوير سريع"],
      ja: ["桟橋の手すりや観覧車にとまる", "砂浜の上で非常に簡単に見つけて撮影可能", "手軽な撮影ターゲット"],
      hi: ["पियर की रेलिंग और झूले पर बैठता है", "रेत पर देखना और फोटो खींचना बहुत आसान", "त्वरित फोटो लक्ष्य"],
      tr: ["İskele korkuluklarına ve dönme dolaba tüner", "Kumda tespit etmek ve fotoğraflamak çok kolaydır", "Hızlı fotoğraf hedefi"],
      ko: ["부두 난간과 대관람차에 앉음", "모래사장에서 매우 쉽게 발견하고 촬영 가능", "빠르게 완료할 수 있는 사진 목표"]
    },
    income: {
      es: "Objetivo de foto de fauna costera",
      en: "Coastal wildlife photo target",
      pt: "Alvo de foto de vida selvagem costeira",
      zh: "沿海野生动物摄影目标",
      fr: "Cible photo côtière",
      de: "Ziel für Küstentierfotografie",
      it: "Bersaglio fotografico costiero",
      ru: "Цель для фотоохоты на побережье",
      ar: "هدف تصوير الحياة البرية الساحلية",
      ja: "沿岸野生動物撮影ターゲット",
      hi: "तटीय वन्यजीव फोटो लक्ष्य",
      tr: "Kıyı vahşi yaşam fotoğraf hedefi",
      ko: "해안 야생 동물 사진 촬영 목표"
    }
  },
  "animal-shark-paleto": {
    name: {
      es: "Gran Tiburón Blanco", en: "Great White Shark", pt: "Grande Tubarão-Branco", zh: "大白鲨", fr: "Grand requin blanc",
      de: "Großer Weißer Hai", it: "Grande squalo bianco", ru: "Большая белая акула", ar: "قرش أبيض كبير", ja: "ホオジロザメ",
      hi: "ग्रेट व्हाइट शार्क", tr: "Büyük Beyaz Köpekbalığı", ko: "백상아리"
    },
    zone: {
      es: "Aguas Profundas de Bahía Paleto", en: "Deep Water of Paleto Bay", pt: "Águas Profundas de Paleto Bay", zh: "佩立托湾深海区", fr: "Eaux profondes de Paleto Bay",
      de: "Tiefwasser der Paleto Bay", it: "Acque profonde di Paleto Bay", ru: "Глубокие воды залива Палето", ar: "المياه العميقة لخليج باليتو", ja: "パレト湾の深海",
      hi: "पलेटो बे का गहरा पानी", tr: "Paleto Körfezi Derin Suları", ko: "팔레토 만 심해"
    },
    description: {
      es: "Depredador oceánico que patrulla las aguas profundas. Puede saltar, atacar botes inflables y devorar a buceadores desprevenidos.",
      en: "Apex ocean predator patrolling deep coastal waters. Will breach, attack inflatable boats, and devour unprotected divers.",
      pt: "Predador oceânico que patrulha águas profundas. Pode saltar, atacar barcos infláveis e devorar mergulhadores indefesos.",
      zh: "巡逻于深水沿海区的海洋顶级掠食者。会跃出水面、攻击充气艇并吞食无防备的潜水员。",
      fr: "Superprédateur des océans patrouillant en eaux profondes. Peut attaquer les bateaux et les plongeurs.",
      de: "Ozeanisches Spitzenraubtier in tiefen Gewässern. Greift Schlauchboote und ungeschützte Taucher an.",
      it: "Predatore oceanico che pattuglia le acque profonde. Attacca gommoni e sommozzatori indifesi.",
      ru: "Высший морской хищник, патрулирующий глубокие воды. Может атаковать надувные лодки и ныряльщиков.",
      ar: "مفترس محيطي خطير يجوب المياه العميقة. يهاجم القوارب المطاطية والغواصين غير المحميين.",
      ja: "沿岸の深海を巡回する海洋の頂点捕食者。海面に飛び出し、ボートを襲撃してダイバーを捕食します。",
      hi: "गहरे पानी में गश्त करने वाला समुद्री शिकारी। नावों और गोताखोरों पर हमला करता है।",
      tr: "Derin sularda devriye gezen okyanus avcısı. Şişme botlara ve korumasız dalgıçlara saldırır.",
      ko: "깊은 연안 해역을 순찰하는 해양 최상위 포식자. 수면 위로 솟구치며 보트와 잠수부를 공격합니다."
    },
    features: {
      es: ["Supremo depredador marino con animaciones únicas de muerte", "Aparece como un punto rojo en el minimapa en aguas profundas", "Fotografiable con seguridad desde una embarcación"],
      en: ["Supreme marine predator with unique kill animations", "Appears as an active red blip on the minimap in deep water", "Photographable safely from watercraft"],
      pt: ["Predador marinho supremo com animações de morte únicas", "Aparece como ponto vermelho no minimapa em águas profundas", "Fotografável com segurança de uma embarcação"],
      zh: ["具有独特击杀动画的终极海洋捕食者", "在深水区小地图上显示为活动红点", "可从船只上安全拍照"],
      fr: ["Prédateur marin avec animations de mort uniques", "Apparaît en point rouge sur la mini-carte", "Photographiable depuis un bateau"],
      de: ["Meeresraubtier mit einzigartigen Todesanimationen", "Erscheint als roter Punkt auf der Minikarte", "Sicher von Booten aus fotografierbar"],
      it: ["Predatore marino supremo con animazioni di uccisione uniche", "Punto rosso sulla minimappa in acque profonde", "Fotografabile in sicurezza da un'imbarcazione"],
      ru: ["Морской хищник с уникальными анимациями добивания", "Отображается красной точкой на миникарте", "Безопасно фотографировать с лодки"],
      ar: ["مفترس بحري فائق مع حركات قتل فريدة", "يظهر كنقطة حمراء على الخريطة المصغرة في المياه العميقة", "يمكن تصويره بأمان من القارب"],
      ja: ["独自のキルアニメーションを持つ究極の海洋捕食者", "深海域ではミニマップ上に赤い点で表示される", "ボートや船の上から安全に撮影可能"],
      hi: ["अद्वितीय किल एनिमेशन वाला समुद्री शिकारी", "गहरे पानी में मिनीमैप पर लाल बिंदु के रूप में दिखता है", "नाव से सुरक्षित रूप से फोटो खींचने योग्य"],
      tr: ["Benzersiz ölüm animasyonlarına sahip deniz avcısı", "Derin sularda haritada kırmızı nokta olarak görünür", "Tekneden güvenli şekilde fotoğraflanabilir"],
      ko: ["독특한 킬 모션을 가진 해양 포식자", "심해에서 미니맵에 빨간색 점으로 표시됨", "보트 위에서 안전하게 사진 촬영 가능"]
    },
    income: {
      es: "Fauna marina de océano profundo",
      en: "Deep ocean marine wildlife",
      pt: "Vida marinha de oceano profundo",
      zh: "深海海洋野生生物",
      fr: "Faune marine des profondeurs",
      de: "Tiefsee-Meeresfauna",
      it: "Fauna marina di mare profondo",
      ru: "Обитатель океанских глубин",
      ar: "الحياة البحرية في أعماق المحيط",
      ja: "深海海洋生物",
      hi: "गहरे समुद्र का समुद्री जीवन",
      tr: "Derin okyanus deniz yaşamı",
      ko: "심해 해양 야생 동물"
    }
  },
  "animal-farm-grapeseed": {
    name: {
      es: "Vaca y Cerdo de Granja", en: "Farm Cow & Pig", pt: "Vaca e Porco de Fazenda", zh: "农场奶牛与肉猪", fr: "Vache et cochon de ferme",
      de: "Bauernhof-Kuh & Schwein", it: "Mucca e maiale da fattoria", ru: "Фермерская корова и свинья", ar: "بقرة وخنزير المزرعة", ja: "農場の牛＆豚",
      hi: "फार्म गाय और सूअर", tr: "Çiftlik İneği ve Domuzu", ko: "농장 암소 및 돼지"
    },
    zone: {
      es: "Tierras de Cultivo de Grapeseed", en: "Grapeseed Farmlands", pt: "Terras Agrícolas de Grapeseed", zh: "葡萄籽农田", fr: "Terres agricoles de Grapeseed",
      de: "Ackerland von Grapeseed", it: "Terreni agricoli di Grapeseed", ru: "Сельхозугодья Грейпсид", ar: "أراضي غريبسيد الزراعية", ja: "グレープシード農接地帯",
      hi: "ग्रेपसीड फार्मलैंड", tr: "Grapeseed Tarım Arazileri", ko: "그레이프시드 농경지"
    },
    description: {
      es: "Ganado doméstico que pasta en los corrales agrícolas de Grapeseed, en la base del Monte Chiliad.",
      en: "Domestic livestock grazing in the agricultural corrals of Grapeseed at the base of Mount Chiliad.",
      pt: "Gado doméstico pastando nos currais agrícolas de Grapeseed na base do Monte Chiliad.",
      zh: "在奇力耶德山山脚下的葡萄籽农业围栏中吃草的家畜。",
      fr: "Bétail domestique paissant dans les enclos de Grapeseed au pied du Mont Chiliad.",
      de: "Nutztiere auf den Weiden von Grapeseed am Fuße des Mount Chiliad.",
      it: "Bestiame domestico nei recinti di Grapeseed ai piedi del Monte Chiliad.",
      ru: "Домашний скот, пасущийся в загонах фермы Грейпсид у подножия горы Чилиад.",
      ar: "ماشية داجنة ترعى في حظائر غريبسيد عند قاعدة جبل تشيلياد.",
      ja: "チリアド山のふもとにあるグレープシードの農場囲い地で飼育されている家畜。",
      hi: "माउंट चिलियाड के तल पर ग्रेपसीड के बाड़ों में चरने वाले घरेलू मवेशी।",
      tr: "Mount Chiliad'ın eteğindeki Grapeseed çiftliklerinde otlayan evcil hayvanlar.",
      ko: "칠리아드 산 기슭에 위치한 그레이프시드의 농장 우리에서 풀을 뜯는 가축입니다."
    },
    features: {
      es: ["Ambas especies situadas en los mismos corrales de Grapeseed", "Completamente inofensivas y muy fáciles de fotografiar", "Entorno rural idílico"],
      en: ["Both farm species located in the same Grapeseed pens", "Completely harmless and simple to photograph", "Idyllic rural setting"],
      pt: ["Ambas as espécies nos mesmos currais de Grapeseed", "Totalmente inofensivas e fáceis de fotografar", "Ambiente rural idílico"],
      zh: ["两种家畜均位于葡萄籽的同一围栏中", "完全无害，极易拍摄", "田园诗般的乡村环境"],
      fr: ["Les deux espèces dans les mêmes enclos de Grapeseed", "Totalement inoffensives et faciles à photographier", "Cadre rural idyllique"],
      de: ["Beide Arten in denselben Gehegen in Grapeseed", "Völlig harmlos und einfach zu fotografieren", "Idyllische ländliche Umgebung"],
      it: ["Entrambe le specie nello stesso recinto a Grapeseed", "Completamente innocue e facili da fotografare", "Ambiente rurale idilliaco"],
      ru: ["Оба вида находятся в одних загонах Грейпсид", "Полностью безобидны и легко фотографируются", "Идиллическая сельская местность"],
      ar: ["كلا النوعين في نفس حظائر غريبسيد", "غير ضارة تماماً وسهلة التصوير", "بيئة ريفية شاعرية"],
      ja: ["両方の動物が同じグレープシードの囲いの中にいる", "完全に無害で撮影が極めて容易", "のどかな田園風景"],
      hi: ["दोनों प्रजातियां एक ही बाड़े में स्थित", "पूरी तरह से हानिरहित और फोटो खींचने में आसान", "सुंदर ग्रामीण परिवेश"],
      tr: ["Her iki tür de aynı Grapeseed ağıllarında bulunur", "Tamamen zararsızdır ve fotoğraflaması çok kolaydır", "Kırsal manzara"],
      ko: ["두 가축 모두 같은 그레이프시드 우리에 위치", "완전히 온순하며 사진 촬영이 매우 쉬움", "목가적인 시골 풍경"]
    },
    income: {
      es: "Objetivo fotográfico de fácil captura",
      en: "Instantly completable photo target",
      pt: "Alvo fotográfico de conclusão rápida",
      zh: "可瞬间完成的摄影目标",
      fr: "Cible photo facile et rapide",
      de: "Sofort erfüllbares Fotoziel",
      it: "Bersaglio fotografico completabile all'istante",
      ru: "Легкая фотоцель для быстрого выполнения",
      ar: "هدف تصوير يمكن إنجازه على الفور",
      ja: "即座に完了できる撮影ターゲット",
      hi: "तुरंत पूरा होने वाला फोटो लक्ष्य",
      tr: "Anında tamamlanabilir fotoğraf hedefi",
      ko: "즉시 완료 가능한 사진 촬영 목표"
    }
  },
  "animal-dolphin-pacific": {
    name: {
      es: "Delfín del Pacífico", en: "Pacific Dolphin", pt: "Golfinho do Pacífico", zh: "太平洋海豚", fr: "Dauphin du Pacifique",
      de: "Pazifischer Delfin", it: "Delfino del Pacifico", ru: "Тихоокеанский дельфин", ar: "دلفين المحيط الهادئ", ja: "イルカ / 太平洋イルカ",
      hi: "प्रशांत डॉल्फ़िन", tr: "Pasifik Yunusu", ko: "태평양 돌고래"
    },
    zone: {
      es: "Océano Pacífico (Pacific Bluffs y Chumash)", en: "Pacific Ocean (Pacific Bluffs & Chumash)", pt: "Oceano Pacífico (Pacific Bluffs e Chumash)", zh: "太平洋（太平洋虚张声势与丘马什）", fr: "Océan Pacifique (Pacific Bluffs et Chumash)",
      de: "Pazifischer Ozean (Pacific Bluffs & Chumash)", it: "Oceano Pacifico (Pacific Bluffs e Chumash)", ru: "Тихий океан (Пасифик-Блаффс и Чумаш)", ar: "المحيط الهادئ (باسيفيك بلافز وتشوماش)", ja: "太平洋（パシフィック・ブラフス＆チュマシュ沖）",
      hi: "प्रशांत महासागर (पैसिफिक ब्लफ्स और चुमाश)", tr: "Pasifik Okyanusu (Pacific Bluffs ve Chumash)", ko: "태평양 (퍼시픽 블러프스 및 추마시)"
    },
    description: {
      es: "Mamífero marino inteligente y juguetón. Nada y salta en pequeños grupos en las aguas costeras frente a Pacific Bluffs y Chumash.",
      en: "Intelligent and playful marine mammal. Swims and leaps in small pods in the open coastal waters off Pacific Bluffs and Chumash.",
      pt: "Mamífero marinho inteligente e brincalhão. Nada e salta em pequenos grupos nas águas costeiras de Pacific Bluffs e Chumash.",
      zh: "聪明调皮的海洋哺乳动物。在太平洋崖和丘马什附近的沿海水域中成群结队游泳跳跃。",
      fr: "Mammifère marin intelligent et joueur. Nage et saute en petits groupes au large de Pacific Bluffs et Chumash.",
      de: "Intelligentes und verspieltes Meeressäugetier. Schwimmt und springt in kleinen Gruppen vor Pacific Bluffs und Chumash.",
      it: "Mammifero marino intelligente e giocoso. Nuota e salta in branchi al largo di Pacific Bluffs e Chumash.",
      ru: "Умное и игривое морское млекопитающее. Плавает и выпрыгивает из воды стаями у побережья Пасифик-Блаффс и Чумаша.",
      ar: "ثديي بحري ذكي ومرح. يسبح ويقفز في مجموعات صغيرة في المياه الساحلية المفتوحة.",
      ja: "知的で遊び心のある海洋哺乳類。パシフィック・ブラフスやチュマシュ沖の沿岸水域で群れをなして泳ぎ跳ねます。",
      hi: "बुद्धिमान और चंचल समुद्री स्तनपायी। पैसिफिक ब्लफ्स और चुमाश के खुले पानी में तैरता और कूदता है।",
      tr: "Zeki ve oyuncu deniz memelisi. Pacific Bluffs ve Chumash açıklarındaki kıyı sularında küçük sürüler halinde yüzer.",
      ko: "지능이 높고 장난기 많은 해양 포유류입니다. 퍼시픽 블러프스와 추마시 앞바다에서 무리 지어 헤엄치며 뛰어오릅니다."
    },
    features: {
      es: ["Mamífero acuático juguetón que salta sobre el agua", "Visible en manadas sobre el oleaje del océano abierto", "Animal jugable mediante plantas de peyote submarinas en Modo Historia"],
      en: ["Playful aquatic mammal leaping across the water surface", "Visible in pods across open ocean swells", "Playable animal via underwater peyote plants in Story Mode"],
      pt: ["Mamífero aquático brincalhão saltando na superfície", "Visível em grupos pelas ondas do oceano aberto", "Animal jogável via plantas de peiote submarinas no Modo História"],
      zh: ["在水面上欢快跳跃的水生哺乳动物", "可在开阔洋面的海浪中看到成群的海豚", "在故事模式中可通过水下佩约特仙人掌变为可操控动物"],
      fr: ["Mammifère aquatique sautant hors de l'eau", "Visible en groupes sur les vagues de l'océan", "Jouable via le peyotl sous-marin dans le mode Histoire"],
      de: ["Verspieltes Meeressäugetier springt über die Wasseroberfläche", "In Gruppen auf den Meereswellen sichtbar", "Spielbar über Unterwasser-Peyote-Pflanzen im Story-Modus"],
      it: ["Mammifero acquatico che salta sulla superficie dell'acqua", "Visibile in banchi sulle onde dell'oceano aperto", "Animale giocabile tramite piante di peyote subacquee nella modalità Storia"],
      ru: ["Игривое водное млекопитающее, выпрыгивающее из воды", "Видны стаями в открытом океане", "Играбельное животное через подводный пейот в сюжетном режиме"],
      ar: ["ثديي مائي يقفز عبر سطح الماء", "مرئي في مجموعات عبر أمواج المحيط المفتوح", "حيوان قابل للعب عبر نباتات البيوت تحت الماء في طور القصة"],
      ja: ["水面を軽快に飛び跳ねる水生哺乳類", "外洋のうねりの中に群れで見られる", "ストーリーモードで水中のペヨーテを食べると操作可能"],
      hi: ["पानी की सतह पर छलांग लगाने वाला समुद्री जीव", "खुले समुद्र में झुंड में दिखाई देता है", "कहानी मोड में पानी के नीचे पेयोटे पौधों के माध्यम से खेलने योग्य जानवर"],
      tr: ["Su yüzeyinde sıçrayan oyuncu memeli", "Açık okyanus dalgalarında sürüler halinde görünür", "Hikaye Modunda su altı peyote bitkileriyle oynanabilir hayvan"],
      ko: ["수면 위로 뛰어오르는 해양 포유류", "먼바다 파도 속에서 무리 지어 관찰 가능", "스토리 모드에서 수중 페요테를 통해 직접 조작 가능한 동물"]
    },
    income: {
      es: "Vida marina y avistamiento oceánico",
      en: "Marine life & ocean sighting",
      pt: "Vida marinha e avistamento oceânico",
      zh: "海洋生物与观海体验",
      fr: "Vie marine et observation océanique",
      de: "Meeresleben & Ozean-Sichtung",
      it: "Vita marina e avvistamento oceanico",
      ru: "Морская жизнь и океанские наблюдения",
      ar: "الحياة البحرية ومشاهدة المحيط",
      ja: "海洋生物＆オーシャンサイティング",
      hi: "समुद्री जीवन और महासागर दृश्य",
      tr: "Deniz yaşamı ve okyanus gözlemi",
      ko: "해양 생물 및 바다 관찰"
    }
  },
  "animal-orca-ocean": {
    name: {
      es: "Orca / Ballena Asesina", en: "Orca / Killer Whale", pt: "Orca / Baleia-Assassina", zh: "虎鲸 / 逆戟鲸", fr: "Orque / Épaulard",
      de: "Schwertwal / Orca", it: "Orca / Balena assassina", ru: "Косатка / Кит-убийца", ar: "حوت الأوركا / الحوت القاتل", ja: "シャチ / オルカ",
      hi: "ओर्का / किलर व्हेल", tr: "Katil Balina / Orka", ko: "범고래 / 오르카"
    },
    zone: {
      es: "Alta Mar del Norte (Faro El Gordo y Mt. Chiliad)", en: "Northern High Seas (El Gordo Lighthouse & Mt. Chiliad)", pt: "Alto Mar do Norte (Farol El Gordo e Mt. Chiliad)", zh: "北部公海（埃尔戈多灯塔与奇力耶德山）", fr: "Haute mer du Nord (Phare El Gordo et Mt Chiliad)",
      de: "Nördliche Hochsee (El Gordo Leuchtturm & Mt. Chiliad)", it: "Alto mare settentrionale (Faro El Gordo e Mt. Chiliad)", ru: "Северное открытое море (Маяк Эль-Гордо и гора Чилиад)", ar: "أعالي البحار الشمالية (منارة إل غوردو وجبل تشيلياد)", ja: "北部の公海（エル・ゴルド灯台＆チリアド山沖）",
      hi: "उत्तरी खुला समुद्र (एल गोर्डो लाइटहाउस और माउंट चिलियाड)", tr: "Kuzey Açık Denizleri (El Gordo Deniz Feneri ve Mt. Chiliad)", ko: "북부 공해 (엘 고르도 등대 및 칠리아드 산)"
    },
    description: {
      es: "El cetáceo depredador más grande en las costas de San Andreas. Se desliza por aguas profundas y sale a la superficie con sus inconfundibles manchas blancas y negras.",
      en: "The largest predatory cetacean off the shores of San Andreas. Glides through deep waters and surfaces to breach with unmistakable black-and-white patterns.",
      pt: "O maior cetáceo predador na costa de San Andreas. Desliza em águas profundas e vem à tona com suas marcas pretas e brancas inconfundíveis.",
      zh: "圣安地列斯海岸最大的捕食性鲸类。在深海中滑行并浮出水面，露出标志性的黑白斑纹。",
      fr: "Le plus grand cétacé prédateur au large de San Andreas. Glisse en eaux profondes et fait surface avec ses motifs noir et blanc.",
      de: "Der größte räuberische Wal vor der Küste von San Andreas. Gleitet durch tiefe Gewässer mit unverwechselbarem Schwarz-Weiß-Muster.",
      it: "Il più grande cetaceo predatore al largo di San Andreas. Scivola nelle acque profonde ed emerge con la caratteristica livrea bianca e nera.",
      ru: "Крупнейший хищный китообразный у берегов Сан-Андреаса. Скользит в глубоких водах и выныривает с узнаваемым черно-белым окрасом.",
      ar: "أكبر الحيتان المفترسة قبالة شواطئ سان أندرياس. ينزلق عبر المياه العميقة ويطفو على السطح بنقوشه السوداء والبيضاء المميزة.",
      ja: "サンアンドレアス沿岸で最大の捕食性鯨類。深海を優雅に泳ぎ、特徴的な白黒の模様を見せて海面に浮上します。",
      hi: "सैन एंड्रियास के तटों पर सबसे बड़ा शिकारी व्हेल। विशिष्ट काले और सफेद पैटर्न के साथ गहरे पानी में तैरता है।",
      tr: "San Andreas kıyılarındaki en büyük yırtıcı balina. Derin sularda süzülür ve belirgin siyah-beyaz deseniyle yüzeye çıkar.",
      ko: "산 안드레아스 해안에서 가장 거대한 포식성 고래류입니다. 깊은 바다를 유영하다가 특유의 흑백 무늬를 드러내며 수면 위로 떠오릅니다."
    },
    features: {
      es: ["Enorme mamífero oceánico nadando en aguas profundas del norte", "Especie marina icónica visible mar adentro", "Animal controlable mediante planta de peyote submarina en Modo Historia"],
      en: ["Massive oceanic mammal swimming in northern deep waters", "Iconic marine species visible offshore", "Controllable animal via underwater peyote plant in Story Mode"],
      pt: ["Enorme mamífero oceânico nadando em águas profundas do norte", "Espécie marinha icônica visível em alto-mar", "Animal controlável via peiote submarino no Modo História"],
      zh: ["在北部深水中游泳的巨大海洋哺乳动物", "离岸可见的标志性海洋物种", "在故事模式中可通过水下佩约特仙人掌变为可操控动物"],
      fr: ["Mammifère océanique massif nageant dans les eaux du nord", "Espèce marine emblématique visible au large", "Contrôlable via le peyotl sous-marin dans le mode Histoire"],
      de: ["Riesiges Meeressäugetier in den nördlichen Tiefgewässern", "Ikonische Meeresart vor der Küste sichtbar", "Steuerbar über Unterwasser-Peyote-Pflanze im Story-Modus"],
      it: ["Imponente mammifero oceanico nelle acque profonde del nord", "Iconica specie marina visibile al largo", "Controllabile tramite pianta di peyote subacquea nella modalità Storia"],
      ru: ["Огромное океаническое млекопитающее в северных водах", "Культовый морской вид, заметный в открытом море", "Управляемое животное через подводный пейот в сюжетном режиме"],
      ar: ["ثديي محيطي ضخم يسبح في المياه الشمالية العميقة", "نوع بحري مميز يمكن رؤيته بعيداً عن الشاطئ", "حيوان يمكن التحكم به عبر نبات البيوت تحت الماء في طور القصة"],
      ja: ["北部の深海を泳ぐ巨大な海洋哺乳類", "沖合で見られる象徴的な海洋生物", "ストーリーモードで水中のペヨーテを食べると操作可能"],
      hi: ["उत्तरी गहरे पानी में तैरने वाला विशाल समुद्री स्तनपायी", "तट से दूर दिखने वाली प्रतिष्ठित समुद्री प्रजाति", "कहानी मोड में पानी के नीचे पेयोटे पौधे के माध्यम से नियंत्रित करने योग्य जानवर"],
      tr: ["Kuzey derin sularında yüzen devasa okyanus memelisi", "Kıyıdan uzakta görülebilen ikonik deniz türü", "Hikaye Modunda su altı peyote bitkisi ile kontrol edilebilir hayvan"],
      ko: ["북부 심해에서 헤엄치는 거대한 해양 포유류", "먼바다에서 관찰할 수 있는 상징적인 해양 생물", "스토리 모드에서 수중 페요테를 통해 직접 조작 가능한 동물"]
    },
    income: {
      es: "Fauna marina de océano profundo",
      en: "Deep ocean marine wildlife",
      pt: "Vida marinha de oceano profundo",
      zh: "深海海洋野生生物",
      fr: "Faune marine des profondeurs",
      de: "Tiefsee-Meeresfauna",
      it: "Fauna marina di mare profondo",
      ru: "Обитатель океанских глубин",
      ar: "الحياة البحرية في أعماق المحيط",
      ja: "深海海洋生物",
      hi: "गहरे समुद्र का समुद्री जीवन",
      tr: "Derin okyanus deniz yaşamı",
      ko: "심해 해양 야생 동물"
    }
  }
};

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const modes = ['online', 'historia'];
const baseClient = 'gtaapp.client/src/assets/data/gta5';

modes.forEach(mode => {
  const esTemplate = JSON.parse(fs.readFileSync(path.join(baseClient, mode, 'es', 'fauna.json'), 'utf8'));

  langs.forEach(lang => {
    const localizedFauna = esTemplate.map(item => {
      const trans = animalTranslations[item.id] || {};
      const catLabel = faunaDict["Fauna Salvaje"][lang] || item.categoryLabel;
      const priceFmt = (item.priceFormatted === "Domestic Livestock" || item.priceFormatted === "Ganado Doméstico")
        ? (faunaDict["Domestic Livestock"][lang] || item.priceFormatted)
        : (faunaDict["Wildlife Specimen"][lang] || item.priceFormatted);

      return {
        ...item,
        name: (trans.name && trans.name[lang]) || item.name,
        categoryLabel: catLabel,
        priceFormatted: priceFmt,
        zone: (trans.zone && trans.zone[lang]) || item.zone,
        description: (trans.description && trans.description[lang]) || item.description,
        features: (trans.features && trans.features[lang]) || item.features,
        income: (trans.income && trans.income[lang]) || item.income,
        gameMode: mode === 'online' ? 'online' : 'both'
      };
    });

    const targetFile = path.join(baseClient, mode, lang, 'fauna.json');
    fs.writeFileSync(targetFile, JSON.stringify(localizedFauna, null, 2), 'utf8');
  });
  console.log(`Successfully localized all fauna for mode: ${mode}`);
});
