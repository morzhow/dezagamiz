import type { AppLanguage } from './i18n';
import type { AppView } from '../types/dezagamiz';

export interface FamilyFuelSavingsInput {
  monthlyKm: number;
  consumptionLPer100Km: number;
  metanPriceUzs?: number;
  petrolAi92PriceUzs?: number;
}

export interface FamilyFuelSavingsResult {
  monthlyKm: number;
  monthlyPetrolCostUzs: number;
  monthlyMetanCostUzs: number;
  monthlySavingsUzs: number;
  yearlySavingsUzs: number;
  yearlyPrimeCashbackUzs: number;
  totalYearlyBenefitUzs: number;
  yearlyCo2SavedKg: number;
  yearlyQueueMinutesSaved: number;
}

export function calculateFamilyFuelSavings(
  input: FamilyFuelSavingsInput,
): FamilyFuelSavingsResult {
  const monthlyKm = Math.max(0, Math.min(20000, Number(input.monthlyKm) || 0));
  const consumption = Math.max(2, Math.min(35, Number(input.consumptionLPer100Km) || 9));
  const metanPrice = Math.max(1000, Number(input.metanPriceUzs) || 5750);
  const ai92Price = Math.max(2000, Number(input.petrolAi92PriceUzs) || 12600);

  const monthlyUnits = (monthlyKm / 100) * consumption;
  const monthlyPetrolCostUzs = Math.round(monthlyUnits * ai92Price);
  const monthlyMetanCostUzs = Math.round(monthlyUnits * metanPrice);
  const monthlySavingsUzs = Math.max(0, monthlyPetrolCostUzs - monthlyMetanCostUzs);
  const yearlySavingsUzs = monthlySavingsUzs * 12;
  const yearlyPrimeCashbackUzs = Math.round(monthlyMetanCostUzs * 12 * 0.05);
  const totalYearlyBenefitUzs = yearlySavingsUzs + yearlyPrimeCashbackUzs;

  // Methane burns roughly 24% cleaner than petrol (~0.56 kg CO2 reduction per unit)
  const yearlyCo2SavedKg = Math.round(monthlyUnits * 12 * 0.56);
  // 2 refuels/week approx 4 min saved per bay visit via in-car queuing & pay
  const refuelsPerYear = Math.round((monthlyKm / 260) * 12);
  const yearlyQueueMinutesSaved = Math.max(0, refuelsPerYear * 4);

  return {
    monthlyKm,
    monthlyPetrolCostUzs,
    monthlyMetanCostUzs,
    monthlySavingsUzs,
    yearlySavingsUzs,
    yearlyPrimeCashbackUzs,
    totalYearlyBenefitUzs,
    yearlyCo2SavedKg,
    yearlyQueueMinutesSaved,
  };
}

export interface SimpleStationRevenueInput {
  partnerStations: number;
  carsPerStationPerDay: number;
  subscriptionPerStationUzs?: number;
  partnerFeePerOrderUzs?: number;
  sponsoredMapSlots?: number;
  sponsorSlotPriceUzs?: number;
}

export interface SimpleStationRevenueResult {
  monthlyOrders: number;
  subscriptionIncomeUzs: number;
  partnerFeeIncomeUzs: number;
  sponsorMapIncomeUzs: number;
  monthlyTotalUzs: number;
  yearlyTotalUzs: number;
}

export function calculateSimpleStationRevenue(
  input: SimpleStationRevenueInput,
): SimpleStationRevenueResult {
  const partnerStations = Math.max(0, Math.min(500, Math.round(input.partnerStations || 0)));
  const carsPerDay = Math.max(0, Math.min(2000, Math.round(input.carsPerStationPerDay || 0)));
  const subPerStation = Math.max(0, Math.round(input.subscriptionPerStationUzs ?? 200000));
  const feePerOrder = Math.max(0, Math.round(input.partnerFeePerOrderUzs ?? 700));
  const sponsorSlots = Math.max(
    0,
    Math.round(input.sponsoredMapSlots ?? Math.max(1, Math.round(partnerStations * 1.5))),
  );
  const sponsorPrice = Math.max(0, Math.round(input.sponsorSlotPriceUzs ?? 120000));

  const monthlyOrders = partnerStations * carsPerDay * 30;
  const subscriptionIncomeUzs = partnerStations * subPerStation;
  const partnerFeeIncomeUzs = monthlyOrders * feePerOrder;
  const sponsorMapIncomeUzs = partnerStations > 0 ? sponsorSlots * sponsorPrice : 0;
  const monthlyTotalUzs =
    subscriptionIncomeUzs + partnerFeeIncomeUzs + sponsorMapIncomeUzs;
  const yearlyTotalUzs = monthlyTotalUzs * 12;

  return {
    monthlyOrders,
    subscriptionIncomeUzs,
    partnerFeeIncomeUzs,
    sponsorMapIncomeUzs,
    monthlyTotalUzs,
    yearlyTotalUzs,
  };
}

export interface PitchSlideItem {
  id: string;
  indexLabel: string;
  title: string;
  summary: string;
  bulletPoints: string[];
  speakerNote: string;
  keyMetricValue: string;
  keyMetricLabel: string;
  proofView: Exclude<AppView, 'creator'>;
  proofLabel: string;
}

export interface DefenseQaItem {
  id: string;
  category: 'parents' | 'jury' | 'business';
  question: string;
  shortAnswer: string;
  speakerTip: string;
  proofView: Exclude<AppView, 'creator'>;
  proofLabel: string;
}

export interface StageChecklistItem {
  id: string;
  title: string;
  desc: string;
  targetView: Exclude<AppView, 'creator'>;
  actionLabel: string;
}

export interface SimpleMonetizationPath {
  id: string;
  title: string;
  effortLabel: string;
  potentialLabel: string;
  howItWorks: string;
}

export interface ShowcaseLocalizedContent {
  slides: PitchSlideItem[];
  qaItems: DefenseQaItem[];
  checklist: StageChecklistItem[];
  monetizationPaths: SimpleMonetizationPath[];
}

const CONTENT_BY_LANG: Record<AppLanguage, ShowcaseLocalizedContent> = {
  ru: {
    slides: [
      {
        id: 'problem',
        indexLabel: '01',
        title: 'Проблема водителей на метановых АГНКС',
        summary:
          'В Узбекистане миллионы машин ездят на метане (CNG). Но зимой в мороз и летом в жару водитель всё ещё тратит время на очереди к кассе, поиск свободной колонки и не знает, сколько реально занято боксов.',
        bulletPoints: [
          'Зимой и в дождь приходится выходить из тёплого салона идти к окошку кассы.',
          'Непонятно заранее на карте, где метан свободен прямо сейчас, а где пробка.',
          'Семьи не видят прозрачную историю чеков и точный литраж/кубы в одном месте.',
        ],
        speakerNote:
          'Скажи залу: «Представьте январское утро в Ташкенте — минус 8, вы с семьёй в машине, а чтобы оплатить газ, нужно выходить к кассе. dezagamiz решает это за 3 нажатия из салона».',
        keyMetricValue: '4 мин',
        keyMetricLabel: 'экономии времени на каждой заправке',
        proofView: 'stations',
        proofLabel: 'Показать карту станций',
      },
      {
        id: 'solution',
        indexLabel: '02',
        title: 'Как работает dezagamiz в 3 шага',
        summary:
          'Водитель выбирает ближайшую АГНКС по GPS, бронирует свободную колонку и оплачивает картой Uzcard, Humo или фирменной картой dezagamiz — заправщик сам подходит к машине.',
        bulletPoints: [
          'Живые слоты колонок: занятые подсвечены отдельно, выбрать можно только свободную.',
          'Оплата из салона + мгновенный чек и живой 4-этапный трекер с таймером до секунд.',
          'Персональная карта dezagamiz (кэшбэк 3%–5%) + мульти-гараж для семейных авто.',
        ],
        speakerNote:
          'Покажи прямо на экране: нажми «Показать оплату», выбери колонку №2 и покажи живой прогресс заправки со звуковым сигналом.',
        keyMetricValue: '3 шага',
        keyMetricLabel: 'выбор колонки -> оплата -> заправка без выхода',
        proofView: 'fuel',
        proofLabel: 'Показать экран заправки',
      },
      {
        id: 'tech',
        indexLabel: '03',
        title: 'Инженерная начинка: GPS, 360°, ИИ и 5 языков',
        summary:
          'Под капотом не просто макет: реальная математика координат, проверка банковских карт по алгоритму Луна (Luhn), ИИ-помощник Gemini с функциями управления, синтезатор мелодий и моментальный перевод.',
        bulletPoints: [
          'Алгоритм Луна + проверка Uzcard (8600/5614), Humo (9860), Visa, Mastercard.',
          'ИИ Gemini выполняет живые команды: открывает разделы, меняет тему, язык и музыку.',
          'Все названия станций, заправщиков, профили и карты переведены на 5 языков: RU, UZ, EN, KK, TR.',
        ],
        speakerNote:
          'Это главный козырь перед строгим жюри: покажи переключение языка на UZ/EN и попроси ИИ прямо на сцене: «Привет, включи тёмную тему»!',
        keyMetricValue: '5 языков',
        keyMetricLabel: 'полный перевод интерфейса и всех данных',
        proofView: 'assistant',
        proofLabel: 'Показать ИИ и студию музыки',
      },
      {
        id: 'business',
        indexLabel: '04',
        title: 'Польза людям и простой заработок уже сейчас',
        summary:
          'Водители экономят до 55% на топливе благодаря метану и кэшбэку до 5%, а владелец приложения может зарабатывать уже сегодня простыми способами без банковских лицензий.',
        bulletPoints: [
          'Подписка для частных АГНКС/АЗС (панель администратора заправки уже готова в приложении).',
          'Рекламные места на карте для автомоек, шиномонтажа и кафе рядом со станцией.',
          'Партнёрская комиссия через готовые шлюзы Payme / Click / Uzum без своей банковской лицензии.',
        ],
        speakerNote:
          'Родители и жюри всегда спрашивают «А как это окупается?». Открой вкладку «Заработок» прямо здесь — там живой калькулятор показывает доход даже с 3–5 первых заправок.',
        keyMetricValue: '3–5 АЗС',
        keyMetricLabel: 'достаточно для первых реальных денег в месяц',
        proofView: 'profile',
        proofLabel: 'Показать карты и кэшбэк',
      },
    ],
    qaItems: [
      {
        id: 'qa-attendant',
        category: 'parents',
        question: 'Зачем приложение, если на газовых заправках и так стоят живые заправщики?',
        shortAnswer:
          'Заправщик подключает шланг, а деньги и очередь на кассе всё равно отнимают время водителя. С dezagamiz водитель не выходит под дождь или мороз, заранее видит свободную колонку на карте и заправщик получает готовый оплаченный чек с номером машины.',
        speakerTip: 'Улыбнись и приведи пример с зимним утром или машиной с детьми на заднем сиденье.',
        proofView: 'fuel',
        proofLabel: 'Открыть живой трекер заправки',
      },
      {
        id: 'qa-security',
        category: 'parents',
        question: 'А это безопасно? Вдруг спишут лишние деньги или украдут данные карты?',
        shortAnswer:
          'Приложение проверяет карты по банковскому стандарту Луна и префиксам Uzcard/Humo, маскирует номер до 4 последних цифр, не хранит CVC в открытом виде, а карту dezagamiz можно заморозить в 1 клик при подозрении.',
        speakerTip: 'Покажи кнопку «Заморозить карту» в разделе карт — родители сразу успокоятся.',
        proofView: 'profile',
        proofLabel: 'Показать заморозку карты',
      },
      {
        id: 'qa-monetize-now',
        category: 'business',
        question: 'Ты школьник — как ты реально можешь заработать на этом приложении уже сейчас?',
        shortAnswer:
          'Мне не нужна банковская лицензия. Первые деньги приходят из 3 простых источников: 1) ежемесячная подписка для 2–5 знакомых частных заправок за панель колонок и привлечение клиентов; 2) платные метки на карте для соседних автомоек и кафе; 3) подключение ссылки оплаты через Payme/Click как партнёр.',
        speakerTip: 'Открой вкладку «Калькулятор дохода» и передвинь ползунок на 5 заправок — цифры убеждают лучше слов.',
        proofView: 'stations',
        proofLabel: 'Показать места рядом на карте',
      },
      {
        id: 'qa-offline-gps',
        category: 'jury',
        question: 'Что будет, если на трассе за городом пропал GPS или браузер заблокировал геолокацию?',
        shortAnswer:
          'В dezagamiz предусмотрен умный резервный режим: если GPS недоступен, водитель одним нажатием выбирает город (Ташкент, Самарканд, Бухара, Фергана) или район, либо перетаскивает жёлтого человечка прямо по карте. Расчёты расстояния по формуле Хаверсинуса работают мгновенно.',
        speakerTip: 'Упомяни «формулу Хаверсинуса на сфере» — техническое жюри это обожает.',
        proofView: 'stations',
        proofLabel: 'Показать выбор города и 360°',
      },
      {
        id: 'qa-ai-hallucination',
        category: 'jury',
        question: 'Как вы защитились от того, чтобы ИИ не выдумывал несуществующие заправки и цены?',
        shortAnswer:
          'Сервер перед каждым запросом передаёт в Gemini актуальный список реальных станций, свободных колонок, текущих тарифов в сумах и координат водителя. А действия выполняются через строгие типизированные инструменты (Function Calling) на сервере.',
        speakerTip: 'Покажи на экране, что ИИ сам переключает тему или открывает историю по голосовой/текстовой команде.',
        proofView: 'assistant',
        proofLabel: 'Показать команды ИИ',
      },
      {
        id: 'qa-why-music',
        category: 'parents',
        question: 'А зачем в приложении для заправки личная музыка и генератор мелодий?',
        shortAnswer:
          'Во время 3-минутной заправки водитель сидит внутри салона. Вместо скучного ожидания он включает свою приятную мелодию, а когда колонка заканчивает заправку — звучит личный хрустальный сигнал оповещения, даже если телефон лежит рядом.',
        speakerTip: 'Нажми Play на мелодии «Ташкент · Нео-соул» на 3 секунды — живой звук всегда оживляет зал.',
        proofView: 'assistant',
        proofLabel: 'Включить обновлённую мелодию',
      },
      {
        id: 'qa-vs-maps',
        category: 'business',
        question: 'Чем приложение лучше обычных карт (Яндекс или Google Карт)?',
        shortAnswer:
          'Обычные карты лишь показывают точку на дороге, но не знают: сколько колонок свободно на АГНКС №2, есть ли там метан 200 бар или пропан, какой заправщик на смене и не дают оплатить прямо из салона с кэшбэком.',
        speakerTip: 'Короткий ударный тезис: «Карты ведут до шлагбаума, а dezagamiz заправляет машину до полного бака».',
        proofView: 'fuel',
        proofLabel: 'Показать слоты колонок',
      },
      {
        id: 'qa-scalability',
        category: 'jury',
        question: 'Можно ли добавить новую заправку или изменить цену газа без программиста?',
        shortAnswer:
          'Да! Внутри приложения уже встроена защищённая кодом панель администратора и владельца АЗС: прямо из браузера можно менять цены на метан/пропан/бензин, включать или выключать колонки и вести поток заказов в реальном времени.',
        speakerTip: 'Скажи, что это готовый B2B-инструмент, который можно показать директору любой местной заправки завтра.',
        proofView: 'history',
        proofLabel: 'Показать цифровой реестр чеков',
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Включить светлую/тёмную тему и показать плавную анимацию',
        desc: 'Нажмите на переключатель темы в шапке — проектор покажет мягкий переход без резких скачков.',
        targetView: 'fuel',
        actionLabel: 'К экрану заправки',
      },
      {
        id: 'chk-2',
        title: 'Переключить язык (например RU -> UZ или EN)',
        desc: 'Покажите родителям и учителю английского, что переводятся даже имена станций и заправщиков.',
        targetView: 'stations',
        actionLabel: 'Показать на карте',
      },
      {
        id: 'chk-3',
        title: 'Включить обновлённую фоновую мелодию и спросить ИИ «Привет»',
        desc: 'Пусть зазвучит студийная Rhodes-мелодия и ИИ выдаст кликабельные кнопки навигации.',
        targetView: 'assistant',
        actionLabel: 'Открыть ИИ и музыку',
      },
      {
        id: 'chk-4',
        title: 'Показать заморозку карты dezagamiz и электронные чеки',
        desc: 'Закрывает вопрос родителей о безопасности семейных денег и контроле расходов.',
        targetView: 'profile',
        actionLabel: 'К картам и гаражу',
      },
      {
        id: 'chk-5',
        title: 'Завершить выступление калькулятором выгоды и дохода',
        desc: 'Покажите конкретную цифру экономии семьи за год и реальный план заработка.',
        targetView: 'history',
        actionLabel: 'Показать историю чеков',
      },
    ],
    monetizationPaths: [
      {
        id: 'mon-b2b',
        title: '1. Подписка для частных АГНКС/АЗС (самый быстрый старт)',
        effortLabel: 'Сложность: Лёгкая',
        potentialLabel: '150–300 тыс. сум / мес с 1 АЗС',
        howItWorks:
          'Вы приходите к владельцу местной частной заправки и предлагаете готовую витрину с живыми ценами, картой и приёмом предзаказов с колонками. Даже 5 знакомых заправок дают стабильный доход каждый месяц без сложного эквайринга.',
      },
      {
        id: 'mon-map',
        title: '2. Реклама заведений рядом на карте (кафе, мойка, СТО)',
        effortLabel: 'Сложность: Очень лёгкая',
        potentialLabel: '100–150 тыс. сум / мес с точки',
        howItWorks:
          'Водитель заправляется 3–5 минут и смотрит на карту «Что рядом». Местные автомойки, шиномонтажки и кофейни возле АГНКС платят небольшую фиксу в месяц за выделенную карточку и кнопку маршрута.',
      },
      {
        id: 'mon-paylink',
        title: '3. Партнёрская ссылка Payme / Click / Uzum Business',
        effortLabel: 'Сложность: Средняя',
        potentialLabel: '500–1 000 сум сервис-сбор или % партнёра',
        howItWorks:
          'Не нужно быть банком или получать лицензию: оплата оформляется через готовый чек/QR-ссылку официальных систем Узбекистана (Payme, Click), а приложение получает комиссию за удобный сервис без очередей.',
      },
      {
        id: 'mon-fleet',
        title: '4. Версия под заказ для небольшого автопарка / такси-компании',
        effortLabel: 'Сложность: Проектная',
        potentialLabel: 'от 1.5 млн сум разово + поддержка',
        howItWorks:
          'В приложении уже есть мульти-гараж машин и история чеков по каждой машине. Можно продать это как готовый учёт расходов газа для директора местного таксопарка или службы доставки.',
      },
    ],
  },
  uz: {
    slides: [
      {
        id: 'problem',
        indexLabel: '01',
        title: 'Metan zapravkalardagi haydovchilar muammosi',
        summary:
          "O'zbekistonda millionlab mashinalar metanda yuradi. Qishda sovuqda va yozda issiqda haydovchi hamon kassa navbatida kutadi va qaysi kolonkalar bo'shligini oldindan bilmaydi.",
        bulletPoints: [
          'Qishda va yomgʻirda iliq salondan chiqib kassaga borishga toʻgʻri keladi.',
          "Xaritada qayerda bo'sh kolonkalar borligi oldindan ko'rinmaydi.",
          'Oilalar uchun cheklar va gaz sarfi tarixi bir joyda saqlanmaydi.',
        ],
        speakerNote:
          "Tinglovchilarga ayting: «Tasavvur qiling, qishda -8 daraja sovuqda oilangiz bilan mashinadasiz. dezagamiz bilan kassaga tushmasdan 3 bosishda toʻlov qilasiz».",
        keyMetricValue: '4 daq',
        keyMetricLabel: 'har bir zapravkada tejaladigan vaqt',
        proofView: 'stations',
        proofLabel: "Stansiyalar xaritasini ko'rsatish",
      },
      {
        id: 'solution',
        indexLabel: '02',
        title: 'dezagamiz 3 qadamda qanday ishlaydi',
        summary:
          "Haydovchi GPS orqali yaqin AGTKShni tanlaydi, bo'sh kolonkani band qiladi va Uzcard, Humo yoki dezagamiz kartasi bilan to'laydi — operator o'zi keladi.",
        bulletPoints: [
          "Jonli kolonkalar: faqat bo'sh kolonkani tanlash mumkin.",
          "Salondan to'lov + tezkor elektron chek va soniyali 4 bosqichli kuzatuv.",
          'Shaxsiy dezagamiz kartasi (3%–5% keshbek) va bir nechta mashina uchun garaj.',
        ],
        speakerNote:
          "Sahnada jonli ko'rsating: to'lov ekraniga o'ting, bo'sh kolonkani tanlang va taymerli jarayonni namoyish eting.",
        keyMetricValue: '3 qadam',
        keyMetricLabel: 'kolonka tanlash -> tolov -> mashinadan chiqmasdan quyish',
        proofView: 'fuel',
        proofLabel: "To'lov ekranini ko'rsatish",
      },
      {
        id: 'tech',
        indexLabel: '03',
        title: 'Texnologiya: GPS, 360°, AI va 5 ta til',
        summary:
          'Bu shunchaki maket emas: koordinatalar matematikasi, Luhn karta tekshiruvi, boshqaruvchi Gemini AI yordamchisi, musiqa sintezatori va 5 tilga tarjima.',
        bulletPoints: [
          'Luhn algoritmi va Uzcard (8600/5614), Humo (9860), Visa, Mastercard tekshiruvi.',
          'Gemini AI buyruqlarni bajaradi: boʻlimlarni ochadi, mavzu, til va musiqani almashtiradi.',
          'Stansiya nomlari, operatorlar va profil 5 tilda ishlaydi: RU, UZ, EN, KK, TR.',
        ],
        speakerNote:
          'Hakamlar oldida tilni bir bosishda almashtiring va AIga «Salom, tungi rejimni yoq» deb buyruq bering.',
        keyMetricValue: '5 til',
        keyMetricLabel: "interfeys va barcha ma'lumotlar tarjimasi",
        proofView: 'assistant',
        proofLabel: 'AI va musiqa studiyasini ochish',
      },
      {
        id: 'business',
        indexLabel: '04',
        title: 'Odamlar foydasi va hoziroq daromad qilish yoʻli',
        summary:
          "Haydovchilar metan va 5% keshbek orqali katta mablag' tejaydi, loyiha egasi esa bank litsenziyasisiz ham darhol daromad olishni boshlashi mumkin.",
        bulletPoints: [
          'Xususiy zapravkalar uchun tayyor boshqaruv paneli obunasi (oylik toʻlov).',
          'Xaritada stansiya yonidagi avtoyuvish, shina xizmati va kafelar reklamasi.',
          'Payme / Click / Uzum tayyor havolalari orqali hamkorlik xizmat haqi.',
        ],
        speakerNote:
          "Ota-onalar va hakamlarga «Daromad kalkulyatori»ni ko'rsating — 5 ta hamkor zapravkaning o'zi oyiga yaxshi daromad beradi.",
        keyMetricValue: '3–5 AGTKSh',
        keyMetricLabel: 'birinchi barqaror oylik daromad uchun yetarli',
        proofView: 'profile',
        proofLabel: "Kartalar va keshbekni ko'rsatish",
      },
    ],
    qaItems: [
      {
        id: 'qa-attendant',
        category: 'parents',
        question: 'Zapravkada operatorlar bor boʻlsa, bu ilova nimaga kerak?',
        shortAnswer:
          "Operator shlangni ulaydi, lekin kassa navbati baribir haydovchining vaqtini oladi. dezagamiz bilan haydovchi sovuqda salondan chiqmaydi, bo'sh kolonkani oldindan ko'radi va operator tayyor chekni oladi.",
        speakerTip: "Qishki sovuqda bolalar bilan mashinada o'tirgan oila misolini keltiring.",
        proofView: 'fuel',
        proofLabel: 'Jonli kuzatuvni ochish',
      },
      {
        id: 'qa-security',
        category: 'parents',
        question: 'Bu xavfsizmi? Karta maʼlumotlari oʻgʻirlanib ketmaydimi?',
        shortAnswer:
          "Ilova Luhn bank algoritmi bo'yicha tekshiradi, karta raqamining o'rtasini yashiradi, CVC kodni ochiq saqlamaydi va shaxsiy kartani 1 bosishda muzlatish tugmasiga ega.",
        speakerTip: "Kartalar bo'limidagi «Kartani muzlatish» tugmasini ko'rsating.",
        proofView: 'profile',
        proofLabel: "Kartani muzlatishni ko'rsatish",
      },
      {
        id: 'qa-monetize-now',
        category: 'business',
        question: "Maktab o'quvchisi sifatida bundan hozirning o'zida qanday pul ishlash mumkin?",
        shortAnswer:
          "Bank litsenziyasi shart emas: 1) tanish xususiy zapravkalarga kolonkalar va narxlar panelini oylik obuna qilib berish; 2) xaritadagi yaqin kafe va moykalardan reklama olish; 3) Payme/Click hamkorlik havolasi orqali kichik xizmat haqi.",
        speakerTip: "Daromad kalkulyatorida slayderni 5 ta zapravkaga qo'yib ko'rsating.",
        proofView: 'stations',
        proofLabel: 'Xaritadagi joylarni ochish',
      },
      {
        id: 'qa-offline-gps',
        category: 'jury',
        question: 'Trassada GPS ishlamay qolsa yoki ruxsat berilmasa nima boʻladi?',
        shortAnswer:
          "Zaxira rejimi bor: haydovchi bir bosishda shaharni (Toshkent, Samarqand, Buxoro, Fargʻona) tanlashi yoki xaritada odamcha belgisini surishi mumkin. Masofa Haversin formulasi bilan hisoblanadi.",
        speakerTip: "«Haversin sferik formulasi» atamasini ayting — hakamlarga juda yoqadi.",
        proofView: 'stations',
        proofLabel: 'Shahar tanlash va 360°',
      },
      {
        id: 'qa-ai-hallucination',
        category: 'jury',
        question: 'AI mavjud boʻlmagan narx yoki zapravkani toʻqib chiqarmasligi qanday taʼminlangan?',
        shortAnswer:
          "Server har bir xabar bilan Geminiga ayni damdagi real zapravkalar, bo'sh kolonkalar va narxlarni uzatadi. Amallar esa qat'iy Function Calling vositalari orqali bajariladi.",
        speakerTip: "AIdan mavzuni yoki bo'limni almashtirishni jonli so'rang.",
        proofView: 'assistant',
        proofLabel: 'AI buyruqlarini sinash',
      },
      {
        id: 'qa-why-music',
        category: 'parents',
        question: 'Zapravka ilovasida shaxsiy musiqa va ohang yaratish nimaga kerak?',
        shortAnswer:
          "Quyish paytidagi 3 daqiqada haydovchi salonda kutib o'tiradi. Yoqimli musiqa va zapravka tugaganini bildiruvchi xrustal signal kutishni qulay qiladi.",
        speakerTip: "Yangilangan Rhodes ohangini 3 soniya chalib ko'rsating.",
        proofView: 'assistant',
        proofLabel: 'Yangi ohangni tinglash',
      },
      {
        id: 'qa-vs-maps',
        category: 'business',
        question: 'Oddiy Google yoki Yandex xaritalardan nimasi bilan ustun?',
        shortAnswer:
          "Oddiy xarita faqat manzilni ko'rsatadi, lekin nechta kolonka bo'shligini, 200 bar metan borligini bilmaydi va mashinadan chiqmasdan keshbekli to'lov qildirib bermaydi.",
        speakerTip: "Qisqa shior: «Xarita eshikkacha olib boradi, dezagamiz esa bakni to'ldiradi».",
        proofView: 'fuel',
        proofLabel: "Kolonkalarni ko'rsatish",
      },
      {
        id: 'qa-scalability',
        category: 'jury',
        question: 'Dasturchisiz yangi narx kiritish yoki zapravkani boshqarish mumkinmi?',
        shortAnswer:
          "Ha! Ilovada kod bilan himoyalangan maxsus Boshqaruvchi paneli bor: narxlar va kolonkalar holatini brauzerdan turib o'zgartirish mumkin.",
        speakerTip: "Bu tayyor B2B mahsulot ekanini ta'kidlang.",
        proofView: 'history',
        proofLabel: "Cheklar tarixini ko'rsatish",
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Yorugʻ va tungi mavzular animatsiyasini koʻrsatish',
        desc: "Yuqoridagi tugmani bosib, silliq o'tishni proyektorda namoyish eting.",
        targetView: 'fuel',
        actionLabel: "To'lov ekraniga",
      },
      {
        id: 'chk-2',
        title: 'Tilni almashtirish (UZ / RU / EN)',
        desc: "Stansiya va operator nomlari ham bir zumda tarjima bo'lishini ko'rsating.",
        targetView: 'stations',
        actionLabel: 'Xaritani ochish',
      },
      {
        id: 'chk-3',
        title: 'Yangilangan ohangni yoqish va AIdan soʻrash',
        desc: "«Salom» deb yozib, AI tugmalari va yangi musiqani tinglating.",
        targetView: 'assistant',
        actionLabel: 'AI va musiqa',
      },
      {
        id: 'chk-4',
        title: 'Kartani muzlatish va elektron cheklarni koʻrsatish',
        desc: "Ota-onalarning xavfsizlik haqidagi savollarini yopadi.",
        targetView: 'profile',
        actionLabel: 'Kartalarga',
      },
      {
        id: 'chk-5',
        title: 'Oila tejami va daromad kalkulyatori bilan yakunlash',
        desc: "Aniq yillik foyda va oddiy biznes-rejani ko'rsating.",
        targetView: 'history',
        actionLabel: 'Cheklar tarixiga',
      },
    ],
    monetizationPaths: [
      {
        id: 'mon-b2b',
        title: '1. Xususiy zapravkalar uchun oylik obuna (eng oson yoʻl)',
        effortLabel: 'Qiyinligi: Oson',
        potentialLabel: "150–300 ming so'm / oy (1 AGTKSh)",
        howItWorks:
          "Mahalliy xususiy zapravka rahbariga tayyor narxlar vitrinasi, xarita va navbatsiz buyurtma panelini taklif qilasiz. 5 ta zapravka oyiga barqaror daromad beradi.",
      },
      {
        id: 'mon-map',
        title: '2. Xaritadagi yon-atrof bizneslari reklamasi (kafe, moyka, STO)',
        effortLabel: 'Qiyinligi: Juda oson',
        potentialLabel: "100–150 ming so'm / oy",
        howItWorks:
          "Haydovchi gaz quyishda xaritadagi yaqin joylarni ko'radi. Zapravka yonidagi avtomoyka va qahvaxonalar ajratib ko'rsatish uchun oylik kichik haq to'laydi.",
      },
      {
        id: 'mon-paylink',
        title: '3. Payme / Click / Uzum Business hamkorlik havolasi',
        effortLabel: 'Qiyinligi: Oʻrtacha',
        potentialLabel: "500–1000 so'm xizmat haqi",
        howItWorks:
          "Bank litsenziyasi kerak emas: to'lov rasmiy tizimlar havolasi orqali o'tadi, ilova esa qulaylik uchun kichik hamkorlik haqi oladi.",
      },
      {
        id: 'mon-fleet',
        title: '4. Kichik taksoparklar uchun buyurtma hisobi',
        effortLabel: 'Qiyinligi: Loyihaviy',
        potentialLabel: "1.5 mln so'mdan boshlab",
        howItWorks:
          "Ilovada ko'p mashinali garaj va cheklar tarixi tayyor. Uni mahalliy taksoparkka yoqilg'i nazorati tizimi sifatida sotish mumkin.",
      },
    ],
  },
  en: {
    slides: [
      {
        id: 'problem',
        indexLabel: '01',
        title: 'The real pain at methane CNG stations',
        summary:
          'Millions of drivers in Uzbekistan run on CNG methane, yet still leave warm/cool cars to queue at cashier windows without knowing which pump bays are free.',
        bulletPoints: [
          'Drivers step out into freezing winter mornings or summer heat just to pay.',
          'Standard maps show pins—not live free bay counts or 200-bar gas availability.',
          'Families lack one unified receipt ledger across multiple vehicles.',
        ],
        speakerNote:
          'Tell parents and judges: "Imagine a -8°C January morning in Tashkent with kids in the car. dezagamiz lets you pay in 3 taps without leaving your seat."',
        keyMetricValue: '4 min',
        keyMetricLabel: 'saved per station visit',
        proofView: 'stations',
        proofLabel: 'Show live station map',
      },
      {
        id: 'solution',
        indexLabel: '02',
        title: 'How dezagamiz works in 3 effortless steps',
        summary:
          'Locate the nearest CNG/fuel station via GPS, lock an open bay, and pay with Uzcard, Humo, or your dezagamiz card—an attendant comes straight to your car.',
        bulletPoints: [
          'Live bay telemetry: busy pumps are blocked so you never pay for an occupied spot.',
          'In-car checkout + instant digital receipt and 4-stage live progress timer.',
          'Personal dezagamiz Prime card (up to 5% cashback) + multi-car garage.',
        ],
        speakerNote:
          'Demo live on stage: jump to Fuel, tap a green free bay, and show the live attendant tracker.',
        keyMetricValue: '3 taps',
        keyMetricLabel: 'pick free bay -> pay -> attendant refuels',
        proofView: 'fuel',
        proofLabel: 'Open live fueling screen',
      },
      {
        id: 'tech',
        indexLabel: '03',
        title: 'Under the hood: GPS, 360°, Gemini AI & 5 Languages',
        summary:
          'This is real full-stack engineering: Haversine geodesic distance math, Luhn bank-card verification, tool-calling Gemini AI, custom Web Audio synthesizer, and instant 5-language localization.',
        bulletPoints: [
          'Real Luhn checksum + BIN detection for Uzcard (8600/5614), Humo (9860), Visa, Mastercard.',
          'Gemini AI executes live actions: switches theme, language, navigation, and music.',
          'Everything—even station names, attendants, and cards—adapts across RU, UZ, EN, KK, TR.',
        ],
        speakerNote:
          'Your strongest tech moment: switch the language live and ask Gemini "Hi, turn on dark mode".',
        keyMetricValue: '5 langs',
        keyMetricLabel: 'complete UI & data localization',
        proofView: 'assistant',
        proofLabel: 'Show AI & music studio',
      },
      {
        id: 'business',
        indexLabel: '04',
        title: 'Real family savings & simple monetization today',
        summary:
          'Families save up to 55% switching to methane plus 5% card cashback, while a student founder can earn real revenue right away without needing a banking license.',
        bulletPoints: [
          'Monthly SaaS subscription for private CNG/LPG stations (Admin dashboard already built).',
          'Sponsored map listings for neighboring car washes, tire shops, and coffee spots.',
          'Official Payme / Click / Uzum Business payment-link affiliate fees.',
        ],
        speakerNote:
          'Use the Income Calculator tab to prove that even 5 local partner stations create steady monthly revenue.',
        keyMetricValue: '3–5 sites',
        keyMetricLabel: 'enough to generate first real monthly income',
        proofView: 'profile',
        proofLabel: 'Show cards & cashback',
      },
    ],
    qaItems: [
      {
        id: 'qa-attendant',
        category: 'parents',
        question: 'Why build an app when gas stations already have live attendants?',
        shortAnswer:
          'The attendant connects the nozzle, but paying at the cashier window still wastes time in queues and bad weather. dezagamiz handles payment from the car so the attendant walks straight up with a paid receipt.',
        speakerTip: 'Give the relatable example of rain or children sleeping in the back seat.',
        proofView: 'fuel',
        proofLabel: 'Open live tracker',
      },
      {
        id: 'qa-security',
        category: 'parents',
        question: 'Is it safe? Could someone steal card numbers or overcharge?',
        shortAnswer:
          'Every card undergoes strict Luhn checksum and prefix validation, numbers are masked except the last 4 digits, CVC is never exposed, and drivers can freeze their dezagamiz card in 1 click.',
        speakerTip: 'Open Cards and click Freeze Card to prove instant safety control.',
        proofView: 'profile',
        proofLabel: 'Show card freeze toggle',
      },
      {
        id: 'qa-monetize-now',
        category: 'business',
        question: 'As a student, how can you realistically make money with this right now?',
        shortAnswer:
          'No bank license needed: 1) charge a small monthly SaaS fee to 3–5 private stations for live bay/price management; 2) sell featured map pins to nearby car washes & cafes; 3) route checkouts via official Payme/Click merchant links for a partner service fee.',
        speakerTip: 'Switch to the Revenue Calculator and set 5 partner stations.',
        proofView: 'stations',
        proofLabel: 'Show nearby business pins',
      },
      {
        id: 'qa-offline-gps',
        category: 'jury',
        question: 'What happens on a highway if GPS drops or permission is denied?',
        shortAnswer:
          'We built a resilient fallback: 1-tap city/district presets (Tashkent, Samarkand, Bukhara, Fergana) or draggable Street-View Pegman pin placement with instant Haversine distance ranking.',
        speakerTip: 'Mention "spherical Haversine formula"—engineering judges love crisp math details.',
        proofView: 'stations',
        proofLabel: 'Show city & 360° fallback',
      },
      {
        id: 'qa-ai-hallucination',
        category: 'jury',
        question: 'How do you stop the AI from inventing fake gas stations or wrong prices?',
        shortAnswer:
          'Every chat turn injects live server-side stations, available bays, exact UZS prices, and GPS coordinates into Gemini, using typed Function Calling so actions are strictly validated.',
        speakerTip: 'Run a live AI command on stage to switch view or theme.',
        proofView: 'assistant',
        proofLabel: 'Test Gemini AI commands',
      },
      {
        id: 'qa-why-music',
        category: 'parents',
        question: 'Why include a personal music studio inside a refueling app?',
        shortAnswer:
          'During a 3-minute methane fill-up inside the cabin, pleasant synthesized Rhodes melodies replace idle waiting, and a custom crystal chime alerts the driver the instant fueling finishes.',
        speakerTip: 'Play the upgraded Tashkent Neo-Soul track for 3 seconds—audio engages the room.',
        proofView: 'assistant',
        proofLabel: 'Play upgraded melody',
      },
      {
        id: 'qa-vs-maps',
        category: 'business',
        question: 'How is this better than Google Maps or Yandex Maps?',
        shortAnswer:
          'General maps stop at the station entrance. dezagamiz shows which specific pump bay is free, gas pressure (200 bar CNG / 16 bar LPG), attendant on duty, and completes checkout inside the car.',
        speakerTip: 'One-liner: "Maps take you to the gate; dezagamiz fills your tank."',
        proofView: 'fuel',
        proofLabel: 'Show bay selector',
      },
      {
        id: 'qa-scalability',
        category: 'jury',
        question: 'Can a station owner update prices or add bays without a developer?',
        shortAnswer:
          'Yes! A passcode-protected Creator & Station Admin Console is already built in—managers can update UZS tariffs, toggle bay availability, and advance active orders in real time.',
        speakerTip: 'Highlight that the B2B product is ready to pitch tomorrow.',
        proofView: 'history',
        proofLabel: 'Show digital receipt ledger',
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Toggle Light / Dark theme smooth animation',
        desc: 'Show the smooth radial/fade transition on the projector screen.',
        targetView: 'fuel',
        actionLabel: 'Go to Fueling',
      },
      {
        id: 'chk-2',
        title: 'Switch UI language live (RU / UZ / EN)',
        desc: 'Point out that station names, addresses, and attendants localize dynamically.',
        targetView: 'stations',
        actionLabel: 'Open Map',
      },
      {
        id: 'chk-3',
        title: 'Play the upgraded melody & greet the AI assistant',
        desc: 'Let the studio Rhodes chord loop play briefly and trigger AI quick navigation.',
        targetView: 'assistant',
        actionLabel: 'Open AI & Music',
      },
      {
        id: 'chk-4',
        title: 'Demonstrate 1-click card freeze & multi-car garage',
        desc: 'Directly reassures parents about payment security.',
        targetView: 'profile',
        actionLabel: 'Open Cards',
      },
      {
        id: 'chk-5',
        title: 'Close with Family Savings & Monetization Calculators',
        desc: 'Leave the audience with concrete UZS numbers and a practical business plan.',
        targetView: 'history',
        actionLabel: 'Open History',
      },
    ],
    monetizationPaths: [
      {
        id: 'mon-b2b',
        title: '1. Monthly SaaS for private CNG/LPG stations (fastest start)',
        effortLabel: 'Effort: Easy',
        potentialLabel: '150–300k UZS / month per station',
        howItWorks:
          'Offer local private stations a live bay status page, price board, and pre-paid order console. Signing just 5 local stations creates immediate recurring monthly income.',
      },
      {
        id: 'mon-map',
        title: '2. Sponsored nearby places on map (car wash, tires, cafe)',
        effortLabel: 'Effort: Very easy',
        potentialLabel: '100–150k UZS / month per spot',
        howItWorks:
          'Drivers check Nearby Places while refueling. Local car washes and cafes next to stations pay a small monthly flat fee for highlighted placement and route buttons.',
      },
      {
        id: 'mon-paylink',
        title: '3. Affiliate checkout via Payme / Click / Uzum Business',
        effortLabel: 'Effort: Moderate',
        potentialLabel: '500–1,000 UZS partner service fee',
        howItWorks:
          'No banking license required—transactions flow through official Uzbekistan payment links while your platform earns a transparent convenience partner share.',
      },
      {
        id: 'mon-fleet',
        title: '4. White-label fleet tracker for small taxi / delivery teams',
        effortLabel: 'Effort: Project-based',
        potentialLabel: '1.5M+ UZS setup + support',
        howItWorks:
          'Package the existing multi-vehicle garage and per-plate receipt ledger as a turnkey fuel-expense monitor for local taxi fleets.',
      },
    ],
  },
  kk: {
    slides: [
      {
        id: 'problem',
        indexLabel: '01',
        title: 'Метан бекеттеріндегі жүргізушілердің мәселесі',
        summary:
          'Қыста аязда және жазда аптап ыстықта жүргізуші кассаға кезекке тұруға мәжбүр және қай колонка бос екенін алдын ала білмейді.',
        bulletPoints: [
          'Төлем жасау үшін жылы салоннан суыққа шығуға тура келеді.',
          'Картада дәл қазір қай колонка бос екені көрінбейді.',
          'Отбасылық көліктердің чектері мен шығыны бір жерде сақталмайды.',
        ],
        speakerNote:
          'Залға айтыңыз: «Қыста -8 градуста балалармен көлікте отырғаныңызды елестетіңіз. dezagamiz салоннан шықпай 3 рет басу арқылы төлеуге мүмкіндік береді».',
        keyMetricValue: '4 мин',
        keyMetricLabel: 'әр құюда үнемделетін уақыт',
        proofView: 'stations',
        proofLabel: 'Бекеттер картасын көрсету',
      },
      {
        id: 'solution',
        indexLabel: '02',
        title: 'dezagamiz 3 қадамда қалай жұмыс істейді',
        summary:
          'Жүргізуші GPS арқылы жақын бекетті таңдайды, бос колонканы брондайды және Uzcard, Humo не dezagamiz картасымен төлейді — оператор өзі келеді.',
        bulletPoints: [
          'Тікелей колонкалар: тек бос колонканы таңдауға болады.',
          'Салоннан төлем + лезде чек және секундтық 4 кезеңді трекер.',
          'Жеке dezagamiz картасы (3%–5% кэшбэк) және мульти-гараж.',
        ],
        speakerNote: 'Сахнада тікелей төлем экранын ашып, бос колонканы таңдап көрсетіңіз.',
        keyMetricValue: '3 қадам',
        keyMetricLabel: 'колонка -> төлем -> салоннан шықпай құю',
        proofView: 'fuel',
        proofLabel: 'Құю экранын ашу',
      },
      {
        id: 'tech',
        indexLabel: '03',
        title: 'Технология: GPS, 360°, ЖИ және 5 тіл',
        summary:
          'Ішінде нақты координата математикасы, Luhn карта тексеруі, Gemini ЖИ көмекшісі, әуен синтезаторы және 5 тілге аударма бар.',
        bulletPoints: [
          'Luhn алгоритмі және Uzcard, Humo, Visa, Mastercard тексеруі.',
          'Gemini ЖИ бөлімдерді ашып, тақырыпты, тілді және музыканы басқарады.',
          'Барлық станциялар мен операторлар 5 тілде: RU, UZ, EN, KK, TR.',
        ],
        speakerNote: 'Тілді бір басуда ауыстырып, ЖИ-ге «Сәлем, қараңғы режимді қос» деп жазыңыз.',
        keyMetricValue: '5 тіл',
        keyMetricLabel: 'толық аударма және деректер',
        proofView: 'assistant',
        proofLabel: 'ЖИ және музыка студиясы',
      },
      {
        id: 'business',
        indexLabel: '04',
        title: 'Адамдарға пайдасы және дәл қазір табыс табу',
        summary:
          'Отбасы метан мен 5% кэшбэк арқылы үнемдейді, ал автор банк лицензиясынсыз-ақ қарапайым жолмен табыс таба алады.',
        bulletPoints: [
          'Жеке газ бекеттеріне айлық жазылым (админ панелі дайын).',
          'Картадағы көрші көлік жуу, шина жөндеу және кафелер жарнамасы.',
          'Payme / Click / Uzum дайын сілтемелері арқылы серіктестік комиссия.',
        ],
        speakerNote: 'Табыс калькуляторын ашып, 5 бекеттен түсетін айлық табысты көрсетіңіз.',
        keyMetricValue: '3–5 АГНКС',
        keyMetricLabel: 'алғашқы тұрақты табыс үшін жеткілікті',
        proofView: 'profile',
        proofLabel: 'Карталар мен кэшбэк',
      },
    ],
    qaItems: [
      {
        id: 'qa-attendant',
        category: 'parents',
        question: 'Бекетте операторлар тұрса, қосымша не үшін керек?',
        shortAnswer:
          'Оператор шлангты қосады, бірақ касса кезегі бәрібір уақыт алады. dezagamiz арқылы суықта сыртқа шықпай төлейсіз, ал оператор дайын чекпен көлікке өзі келеді.',
        speakerTip: 'Қыста көлікте балалар отырған сәтті мысал ретінде келтіріңіз.',
        proofView: 'fuel',
        proofLabel: 'Тікелей трекерді ашу',
      },
      {
        id: 'qa-security',
        category: 'parents',
        question: 'Бұл қауіпсіз бе? Карта деректері ұрланбай ма?',
        shortAnswer:
          'Карталар Luhn банктік алгоритмімен тексеріледі, ортаңғы цифрлар жасырылады, CVC ашық сақталмайды және 1 басуда картаны бұғаттау бар.',
        speakerTip: 'Карталар бөлімінде «Картаны мұздату» батырмасын көрсетіңіз.',
        proofView: 'profile',
        proofLabel: 'Картаны бұғаттауды көрсету',
      },
      {
        id: 'qa-monetize-now',
        category: 'business',
        question: 'Оқушы ретінде осы қосымшадан дәл қазір қалай ақша табуға болады?',
        shortAnswer:
          'Банк лицензиясы керек емес: 1) жеке бекеттерге дайын басқару панелін айлық жазылымға беру; 2) картадағы көрші кафе мен мойкалардан жарнама алу; 3) Payme/Click ресми сілтемесі арқылы шағын сервис ақысы.',
        speakerTip: 'Калькуляторда 5 бекетті таңдап көрсетіңіз.',
        proofView: 'stations',
        proofLabel: 'Жақын орындарды көрсету',
      },
      {
        id: 'qa-offline-gps',
        category: 'jury',
        question: 'Тас жолда GPS өшіп қалса не болады?',
        shortAnswer:
          'Қосалқы режим бар: қаланы бір басуда таңдауға немесе картадағы белгіні қолмен жылжытуға болады. Қашықтық Хаверсин формуласымен есептеледі.',
        speakerTip: '«Хаверсин формуласы» дегенді атап өтіңіз.',
        proofView: 'stations',
        proofLabel: 'Қала таңдау және 360°',
      },
      {
        id: 'qa-ai-hallucination',
        category: 'jury',
        question: 'ЖИ жалған баға не бекет ойлап таппауын қалай шештіңіз?',
        shortAnswer:
          'Сервер Gemini-ге нақты станцияларды, бос колонкаларды және сум бағасын жібереді, ал командалар Function Calling арқылы қатаң тексеріледі.',
        speakerTip: 'Сахнада ЖИ арқылы тақырыпты ауыстырып көрсетіңіз.',
        proofView: 'assistant',
        proofLabel: 'ЖИ командаларын сынау',
      },
      {
        id: 'qa-why-music',
        category: 'parents',
        question: 'Жанармай қосымшасында жеке музыка не үшін қажет?',
        shortAnswer:
          'Құю кезіндегі 3 минутта жүргізуші салон ішінде жағымды әуен тыңдайды, ал құю аяқталғанда жеке сигнал хабар береді.',
        speakerTip: 'Жаңартылған әуенді 3 секунд қосып беріңіз.',
        proofView: 'assistant',
        proofLabel: 'Жаңа әуенді тыңдау',
      },
      {
        id: 'qa-vs-maps',
        category: 'business',
        question: 'Кәдімгі Google не Яндекс картадан артықшылығы қандай?',
        shortAnswer:
          'Кәдімгі карта тек нүктені көрсетеді, ал dezagamiz қай колонка бос екенін, газ түрін көрсетеді және салоннан кэшбэкпен төлеуге мүмкіндік береді.',
        speakerTip: 'Қысқа түйін: «Карта есікке дейін апарады, dezagamiz бакты толтырады».',
        proofView: 'fuel',
        proofLabel: 'Колонкаларды көрсету',
      },
      {
        id: 'qa-scalability',
        category: 'jury',
        question: 'Бағдарламашысыз жаңа баға қосуға бола ма?',
        shortAnswer:
          'Иә! Ішінде арнайы кодпен қорғалған Әкімші панелі бар: бағалар мен колонкаларды браузерден тікелей өзгертуге болады.',
        speakerTip: 'Бұл дайын B2B құрал екенін айтыңыз.',
        proofView: 'history',
        proofLabel: 'Чектер тізімін ашу',
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Ашық/қараңғы режим анимациясын көрсету',
        desc: 'Тақырыпты ауыстырғанда тегіс өтуді проектордан көрсетіңіз.',
        targetView: 'fuel',
        actionLabel: 'Құю бөліміне',
      },
      {
        id: 'chk-2',
        title: 'Тілді ауыстыру (KK / RU / UZ / EN)',
        desc: 'Бекеттер мен оператор есімдері де аударылатынын көрсетіңіз.',
        targetView: 'stations',
        actionLabel: 'Картаға өту',
      },
      {
        id: 'chk-3',
        title: 'Жаңартылған әуенді қосу және ЖИ-ге жазу',
        desc: 'Жаңа студиялық әуенді қосып, ЖИ-ге сәлемдесіңіз.',
        targetView: 'assistant',
        actionLabel: 'ЖИ және музыка',
      },
      {
        id: 'chk-4',
        title: 'Картаны бұғаттау және электронды чектерді көрсету',
        desc: 'Ата-аналардың қауіпсіздік сұрақтарына нақты жауап.',
        targetView: 'profile',
        actionLabel: 'Карталарға',
      },
      {
        id: 'chk-5',
        title: 'Үнемдеу және табыс калькуляторымен аяқтау',
        desc: 'Нақты цифрлар мен табыс жоспарын көрсетіңіз.',
        targetView: 'history',
        actionLabel: 'Тарихқа өту',
      },
    ],
    monetizationPaths: [
      {
        id: 'mon-b2b',
        title: '1. Жеке газ бекеттеріне айлық жазылым',
        effortLabel: 'Қиындығы: Жеңіл',
        potentialLabel: '150–300 мың сум / ай (1 АГНКС)',
        howItWorks:
          'Жергілікті жеке бекет иесіне тікелей бағалар мен бос колонка панелін ұсынасыз. 5 бекет ай сайын тұрақты табыс береді.',
      },
      {
        id: 'mon-map',
        title: '2. Картада көрші қызметтер жарнамасы (мойка, СТО, кафе)',
        effortLabel: 'Қиындығы: Өте жеңіл',
        potentialLabel: '100–150 мың сум / ай',
        howItWorks:
          'Жүргізуші картадан жақын маңдағы орындарды көреді. Бекет жанындағы автожуу мен кофеханалар айлық шағын жарнама ақысын төлейді.',
      },
      {
        id: 'mon-paylink',
        title: '3. Payme / Click / Uzum серіктестік сілтемесі',
        effortLabel: 'Қиындығы: Орташа',
        potentialLabel: '500–1000 сум сервис ақысы',
        howItWorks:
          'Банк лицензиясы қажет емес — төлем ресми жүйелер арқылы өтеді.',
      },
      {
        id: 'mon-fleet',
        title: '4. Шағын таксопарктерге дайын есеп жүйесі',
        effortLabel: 'Қиындығы: Жобалық',
        potentialLabel: '1.5 млн сумнан бастап',
        howItWorks:
          'Қосымшадағы мульти-гараж бен чектер тарихын жергілікті таксопаркке орнатып беру.',
      },
    ],
  },
  tr: {
    slides: [
      {
        id: 'problem',
        indexLabel: '01',
        title: 'Metan CNG istasyonlarındaki sürücü sorunu',
        summary:
          'Kışın soğukta veya yaz sıcağında sürücü hâlâ vezneye yürüyüp sıra bekliyor ve hangi pompanın boş olduğunu önceden göremiyor.',
        bulletPoints: [
          'Ödeme için sıcak veya serin araçtan dışarı çıkmak gerekiyor.',
          'Haritada o an hangi pompanın boş olduğu görünmüyor.',
          'Aile araçları için tüm fiş ve harcamalar tek yerde tutulmuyor.',
        ],
        speakerNote:
          'Dinleyicilere şöyle deyin: "Ocak ayında -8 derecede araçta çocuklarınızla olduğunuzu düşünün. dezagamiz ile inmeden 3 dokunuşla ödersiniz."',
        keyMetricValue: '4 dk',
        keyMetricLabel: 'her yakıt alımında zaman tasarrufu',
        proofView: 'stations',
        proofLabel: 'İstasyon haritasını göster',
      },
      {
        id: 'solution',
        indexLabel: '02',
        title: 'dezagamiz 3 adımda nasıl çalışır',
        summary:
          'GPS ile en yakın istasyonu seçin, boş pompayı ayırtın ve Uzcard, Humo veya dezagamiz kartıyla ödeyin — görevli doğrudan araca gelir.',
        bulletPoints: [
          'Canlı pompa durumu: dolu pompalar engellenir, sadece boş olan seçilir.',
          'Araç içi ödeme + anında dijital fiş ve 4 aşamalı canlı sayaç.',
          'Kişisel dezagamiz kartı (%3–%5 nakit iade) + çoklu araç garajı.',
        ],
        speakerNote: 'Sahnede canlı ödeme ekranını açıp boş bir pompa seçerek sayacı gösterin.',
        keyMetricValue: '3 adım',
        keyMetricLabel: 'pompa seç -> öde -> araçtan inmeden dolum',
        proofView: 'fuel',
        proofLabel: 'Dolum ekranını aç',
      },
      {
        id: 'tech',
        indexLabel: '03',
        title: 'Mühendislik: GPS, 360°, Yapay Zeka ve 5 Dil',
        summary:
          'Bu sadece bir tasarım değil: Haversine mesafe hesabı, Luhn kart doğrulaması, komut çalıştıran Gemini AI, Web Audio müzik sentezleyici ve 5 dil desteği.',
        bulletPoints: [
          'Luhn algoritması ve Uzcard, Humo, Visa, Mastercard doğrulaması.',
          'Gemini AI tema, dil, ekran ve müzik komutlarını anında uygular.',
          'İstasyonlar, görevliler ve profil dahil tüm veriler 5 dilde çevrilir.',
        ],
        speakerNote: 'Dili canlı değiştirin ve yapay zekaya "Merhaba, karanlık modu aç" yazın.',
        keyMetricValue: '5 dil',
        keyMetricLabel: 'tam arayüz ve veri yerelleştirme',
        proofView: 'assistant',
        proofLabel: 'AI ve müzik stüdyosunu aç',
      },
      {
        id: 'business',
        indexLabel: '04',
        title: 'Aile tasarrufu ve hemen basit gelir modeli',
        summary:
          'Sürücüler metan ve %5 iade ile tasarruf ederken, geliştirici banka lisansı olmadan hemen basit yollarla gelir elde edebilir.',
        bulletPoints: [
          'Özel istasyonlar için aylık SaaS yönetim paneli aboneliği.',
          'Haritada yakındaki oto yıkama, lastikçi ve kafeler için sponsorlu pinler.',
          'Resmi Payme / Click / Uzum ödeme bağlantılarıyla iş ortağı payı.',
        ],
        speakerNote: 'Gelir hesaplayıcıda 5 istasyon seçerek aylık geliri velilere ve jüriye gösterin.',
        keyMetricValue: '3–5 istasyon',
        keyMetricLabel: 'ilk gerçek aylık gelir için yeterli',
        proofView: 'profile',
        proofLabel: 'Kartlar ve iadeyi göster',
      },
    ],
    qaItems: [
      {
        id: 'qa-attendant',
        category: 'parents',
        question: 'İstasyonlarda görevli varken uygulamaya neden gerek var?',
        shortAnswer:
          'Görevli hortumu bağlar ama vezne kuyruğu yine vakit kaybettirir. dezagamiz ile yağmurda veya soğukta araçtan çıkmazsınız, görevli ödenmiş fişle doğrudan aracınıza gelir.',
        speakerTip: 'Soğuk kış sabahı veya arka koltuktaki çocuklar örneğini verin.',
        proofView: 'fuel',
        proofLabel: 'Canlı takibi aç',
      },
      {
        id: 'qa-security',
        category: 'parents',
        question: 'Güvenli mi? Kart bilgileri çalınır mı?',
        shortAnswer:
          'Kartlar Luhn algoritmasıyla doğrulanır, numaranın ortası maskelenir, CVC açık tutulmaz ve tek dokunuşla kartı dondurma düğmesi vardır.',
        speakerTip: 'Kartlar sekmesinde «Kartı dondur» düğmesini gösterin.',
        proofView: 'profile',
        proofLabel: 'Kart dondurmayı göster',
      },
      {
        id: 'qa-monetize-now',
        category: 'business',
        question: 'Bir öğrenci olarak bu uygulamadan şu an nasıl para kazanabilirsin?',
        shortAnswer:
          'Banka lisansı gerekmez: 1) yerel özel istasyonlara hazır canlı pompa/fiyat panelini aylık abonelikle sunmak; 2) haritadaki yakın kafe ve oto yıkamalardan reklam almak; 3) resmi Payme/Click bağlantılarıyla hizmet payı almak.',
        speakerTip: 'Gelir hesaplayıcısında 5 istasyonu gösterin.',
        proofView: 'stations',
        proofLabel: 'Yakındaki yerleri göster',
      },
      {
        id: 'qa-offline-gps',
        category: 'jury',
        question: 'Şehir dışında GPS çekmezse veya izin verilmezse ne olur?',
        shortAnswer:
          'Yedek mod devreye girer: tek dokunuşla şehir seçilebilir veya haritada konum manuel yerleştirilir. Mesafe Haversine formülüyle anında hesaplanır.',
        speakerTip: 'Haversine formülünden bahsedin — jüri teknik detayı sever.',
        proofView: 'stations',
        proofLabel: 'Şehir seçimi ve 360°',
      },
      {
        id: 'qa-ai-hallucination',
        category: 'jury',
        question: 'Yapay zekanın sahte fiyat veya istasyon uydurmasını nasıl engellediniz?',
        shortAnswer:
          'Sunucu her soruda Gemini modeline gerçek istasyonları, boş pompaları ve güncel som fiyatlarını gönderir; işlemler Function Calling ile doğrulanır.',
        speakerTip: 'Sahnede AI ile temayı canlı değiştirin.',
        proofView: 'assistant',
        proofLabel: 'AI komutlarını test et',
      },
      {
        id: 'qa-why-music',
        category: 'parents',
        question: 'Yakıt uygulamasında müzik stüdyosu neden var?',
        shortAnswer:
          '3 dakikalık dolum sırasında araç içinde keyifli melodi çalar ve dolum bittiğinde özel kristal uyarı sesi sürücüyü bilgilendirir.',
        speakerTip: 'Yenilenmiş Rhodes melodisini 3 saniye çalın.',
        proofView: 'assistant',
        proofLabel: 'Yeni melodiyi çal',
      },
      {
        id: 'qa-vs-maps',
        category: 'business',
        question: 'Google veya Yandex Haritalardan farkı nedir?',
        shortAnswer:
          'Standart haritalar sadece konumu gösterir; dezagamiz boş pompa sayısını, 200 bar metan durumunu gösterir ve araç içinden nakit iadeli ödeme sağlar.',
        speakerTip: 'Kısa cümle: "Haritalar kapıya götürür, dezagamiz depoyu doldurur."',
        proofView: 'fuel',
        proofLabel: 'Pompaları göster',
      },
      {
        id: 'qa-scalability',
        category: 'jury',
        question: 'Yazılımcı olmadan yeni fiyat eklenebilir mi?',
        shortAnswer:
          'Evet! Uygulama içinde şifre korumalı Kurucu & İstasyon Paneli hazır: tarayıcıdan fiyatlar ve pompalar anında güncellenir.',
        speakerTip: 'Hazır bir B2B ürün olduğunu vurgulayın.',
        proofView: 'history',
        proofLabel: 'Dijital fişleri göster',
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Açık/koyu tema geçiş animasyonunu göster',
        desc: 'Başlıktaki tema düğmesiyle yumuşak geçişi projeksiyonda gösterin.',
        targetView: 'fuel',
        actionLabel: 'Dolum ekranına git',
      },
      {
        id: 'chk-2',
        title: 'Dili canlı değiştir (TR / RU / UZ / EN)',
        desc: 'İstasyon ve görevli adlarının da çevrildiğini gösterin.',
        targetView: 'stations',
        actionLabel: 'Haritayı aç',
      },
      {
        id: 'chk-3',
        title: 'Yenilenmiş melodiyi çal ve AI asistanı selamla',
        desc: 'Stüdyo kalitesindeki melodiyi dinletip AI butonlarını gösterin.',
        targetView: 'assistant',
        actionLabel: 'AI ve müzik',
      },
      {
        id: 'chk-4',
        title: 'Tek tıkla kart dondurma ve fiş geçmişini göster',
        desc: 'Velilerin güvenlik sorularını anında yanıtlar.',
        targetView: 'profile',
        actionLabel: 'Kartlara git',
      },
      {
        id: 'chk-5',
        title: 'Tasarruf ve gelir hesaplayıcıyla bitir',
        desc: 'Somut rakamlar ve gerçekçi iş planıyla sunumu tamamlayın.',
        targetView: 'history',
        actionLabel: 'Fiş geçmişi',
      },
    ],
    monetizationPaths: [
      {
        id: 'mon-b2b',
        title: '1. Özel istasyonlar için aylık abonelik (en hızlı başlangıç)',
        effortLabel: 'Zorluk: Kolay',
        potentialLabel: '150–300 bin som / ay (1 istasyon)',
        howItWorks:
          'Yerel özel istasyonlara canlı fiyat, harita ve sipariş paneli sunun. Sadece 5 istasyon bile düzenli aylık gelir sağlar.',
      },
      {
        id: 'mon-map',
        title: '2. Haritada yakındaki işletme reklamları (oto yıkama, kafe)',
        effortLabel: 'Zorluk: Çok kolay',
        potentialLabel: '100–150 bin som / ay',
        howItWorks:
          'Sürücüler yakıt alırken yakındaki yerlere bakar. Yakındaki oto yıkama ve kafeler öne çıkarılma için küçük aylık ücret öder.',
      },
      {
        id: 'mon-paylink',
        title: '3. Payme / Click / Uzum iş ortağı ödeme bağlantısı',
        effortLabel: 'Zorluk: Orta',
        potentialLabel: '500–1.000 som hizmet payı',
        howItWorks:
          'Banka lisansı gerekmez — ödemeler resmi sistemler üzerinden geçer.',
      },
      {
        id: 'mon-fleet',
        title: '4. Küçük taksi filoları için yakıt takip sistemi',
        effortLabel: 'Zorluk: Proje bazlı',
        potentialLabel: '1.5M+ som kurulum',
        howItWorks:
          'Mevcut çoklu araç garajı ve fiş geçmişi yerel taksi filolarına paket olarak sunulabilir.',
      },
    ],
  },
};

export function getShowcaseContent(lang: AppLanguage): ShowcaseLocalizedContent {
  return CONTENT_BY_LANG[lang] || CONTENT_BY_LANG.ru;
}
