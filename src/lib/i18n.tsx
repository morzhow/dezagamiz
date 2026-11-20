import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { FuelCode, PersonalTrack } from '../types/dezagamiz';

export type AppLanguage = 'ru' | 'uz' | 'en' | 'kk' | 'tr';

export const SUPPORTED_LANGUAGES: {
  code: AppLanguage;
  nativeLabel: string;
  shortLabel: string;
}[] = [
  { code: 'ru', nativeLabel: 'Русский', shortLabel: 'RU' },
  { code: 'uz', nativeLabel: "O'zbekcha", shortLabel: 'UZ' },
  { code: 'en', nativeLabel: 'English', shortLabel: 'EN' },
  { code: 'kk', nativeLabel: 'Қазақша', shortLabel: 'KZ' },
  { code: 'tr', nativeLabel: 'Türkçe', shortLabel: 'TR' },
];

export interface TranslationBundle {
  // Loading & Brand
  loadingTitle: string;
  loadingSubtitle: string;
  loadingReadySubtitle: string;
  loadingWaitBtn: string;
  enterAppBtn: string;
  splashFooterMeta: string;
  enteringApp: string;
  // Gate header & Hero
  gateBadge: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageAlt: string;
  step1Label: string;
  step1Title: string;
  step1Desc: string;
  step2Label: string;
  step2Title: string;
  step2Desc: string;
  step3Label: string;
  step3Title: string;
  step3Desc: string;
  heroCities: string;
  heroPriceFrom: string;
  // Gate Tabs
  tabRegister: string;
  tabLogin: string;
  tabGuest: string;
  tabCreator: string;
  // Registration & Login & Card Fields
  stage1Of2: string;
  stage2Of2: string;
  driverAndCar: string;
  cardBinding: string;
  fullNameLabel: string;
  phoneLabel: string;
  carModelLabel: string;
  plateNumberLabel: string;
  preferredFuelLabel: string;
  nextBindCard: string;
  back: string;
  bindCardAndEnter: string;
  checkingCard: string;
  cardExpiryLabel: string;
  cardCvcLabel: string;
  cardHolderLabel: string;
  cardPreviewLabel: string;
  cardPreviewExpiryLabel: string;
  loginTitle: string;
  loginSubtitle: string;
  loginButton: string;
  checkingAccount: string;
  firstTimeHint: string;
  // Validation Errors (Auth / Profile / Fuel)
  errEnterFullName: string;
  errEnterUzPhone: string;
  errEnterCarModel: string;
  errEnterUzPlate: string;
  errCheckCardNumber: string;
  errEnterCardExpiry: string;
  errEnterCardHolder: string;
  errEnterCardCvc: string;
  errRegisterFailed: string;
  errLoginFailed: string;
  errCreatorCodeInvalid: string;
  errChooseRoleFailed: string;
  errSelectFreeBay: string;
  errFuelNotOnBay: string;
  errMinFuelAmount: string;
  errPersonalCardFrozen: string;
  errPersonalCardLowFunds: string;
  errBindCardToPay: string;
  errPaymentFailed: string;
  errSwitchCarFailed: string;
  errAddCarFailed: string;
  errSwitchCarProfileFailed: string;
  errDeleteCarFailed: string;
  errAddCardFailed: string;
  errSwitchCardFailed: string;
  errDeleteLastCard: string;
  errIssueCardFailed: string;
  errTopUpCheck: string;
  errTopUpMin: string;
  errTopUpMax: string;
  errCardDigits: string;
  errCardNetwork: string;
  errCardLuhn: string;
  errTopUpFailed: string;
  errCardDesignFailed: string;
  errCardFreezeFailed: string;
  // Guest 3-day mode
  guestTitle: string;
  guestSubtitle: string;
  guestRuleBadge: string;
  guestLimitItem1: string;
  guestLimitItem2: string;
  guestLimitItem3: string;
  guestStartButton: string;
  guestStarting: string;
  guestExpiredNotice: string;
  guestBannerLabel: string;
  guestUpgradeButton: string;
  // Creator & Role Choice & Admin Console
  creatorTitle: string;
  creatorSubtitle: string;
  creatorCodeLabel: string;
  creatorCodePlaceholder: string;
  verifyPassword: string;
  verifyingPassword: string;
  passwordConfirmed: string;
  chooseRoleTitle: string;
  chooseRoleSubtitle: string;
  roleAdminTitle: string;
  roleAdminDesc: string;
  enterAsAdmin: string;
  roleDriverTitle: string;
  roleDriverDesc: string;
  enterAsDriver: string;
  creatorAccessBadge: string;
  creatorPanelTitle: string;
  creatorPanelSubtitle: string;
  creatorDriverModeBadge: string;
  creatorLockBtn: string;
  creatorExitBtn: string;
  creatorLoadingMetrics: string;
  creatorStatDrivers: string;
  creatorStatOrders: string;
  creatorStatActivePrefix: string;
  creatorStatMethane: string;
  creatorStatRevenue: string;
  creatorStationManageEyebrow: string;
  creatorStationManageTitle: string;
  creatorSelectStationLabel: string;
  creatorPricesLabel: string;
  creatorBaysStatusLabel: string;
  creatorApplyStationBtn: string;
  creatorSavingStationBtn: string;
  creatorStationUpdatedMsg: string;
  creatorOrdersTitle: string;
  creatorOrdersEmpty: string;
  creatorColReceiptCar: string;
  creatorColStationBay: string;
  creatorColAmount: string;
  creatorColStatus: string;
  creatorColControl: string;
  creatorStagePaid: string;
  creatorStageApproaching: string;
  creatorStageFueling: string;
  creatorStageCompleted: string;
  creatorNextStageBtn: string;
  creatorDoneLabel: string;
  creatorDriversTitle: string;
  creatorDriversEmpty: string;
  creatorColDriver: string;
  creatorColPhone: string;
  creatorColCarPlate: string;
  creatorColLinkedCard: string;
  // Navigation
  navFuel: string;
  navStations: string;
  navAssistant: string;
  navHistory: string;
  navCards: string;
  navCardsShort: string;
  navCreator: string;
  navAdminPanel: string;
  navAdminShort: string;
  navDriverShort: string;
  switchToDriver: string;
  switchToAdmin: string;
  logout: string;
  // Fueling Workspace & Live Tracker
  fuelTitle: string;
  fuelSubtitle: string;
  yourCar: string;
  selectStationStep: string;
  selectBayStep: string;
  freeBaysCount: string;
  selectFuelStep: string;
  amountStep: string;
  fullTank: string;
  payWithCardLabel: string;
  cardsCountLabel: string;
  payFromCarBtn: string;
  processingPayment: string;
  howItWorksTitle: string;
  howStep1: string;
  howStep2Prefix: string;
  howStep3: string;
  driverProfileActive: string;
  cardVerifiedText: string;
  bayFree: string;
  bayBusy: string;
  bayShortLabel: string;
  notAtBay: string;
  open24h: string;
  distanceKmUnit: string;
  trackerStage1Title: string;
  trackerStage1Sub: string;
  trackerStage2Title: string;
  trackerStage2Sub: string;
  trackerStage3Title: string;
  trackerStage3Sub: string;
  trackerStage4Title: string;
  trackerStage4Sub: string;
  trackerHeadlinePaid: string;
  trackerHeadlineApproaching: string;
  trackerHeadlineFuelingPrefix: string;
  trackerHeadlineCompleted: string;
  trackerDescPaid: string;
  trackerDescApproachingSuffix: string;
  trackerDescFuelingMid: string;
  trackerDescCompleted: string;
  trackerTariffLabel: string;
  trackerVolumeFilledLabel: string;
  trackerGoalLabel: string;
  trackerPaidFromCardLabel: string;
  trackerStatusLabel: string;
  trackerStatusPaid: string;
  trackerStatusEtaPrefix: string;
  trackerStatusEtaSec: string;
  trackerStatusFuelingPrefix: string;
  trackerStatusDone: string;
  trackerStayInsideHint: string;
  trackerBtnAtCar: string;
  trackerBtnStartFuel: string;
  trackerBtnFinishFuel: string;
  trackerRateLabel: string;
  trackerRateAriaPrefix: string;
  trackerNewOrderBtn: string;
  trackerAttendantCardTitle: string;
  trackerExperiencePrefix: string;
  trackerExperienceUnit: string;
  trackerUniformLabel: string;
  trackerRolePaid: string;
  trackerRoleApproaching: string;
  trackerRoleFueling: string;
  trackerRoleCompleted: string;
  trackerCarVerifyPrefix: string;
  trackerPaymentDetailsTitle: string;
  trackerDetailStation: string;
  trackerDetailBay: string;
  trackerDetailFuel: string;
  trackerDetailCard: string;
  trackerDetailCashback: string;
  trackerDetailTotal: string;
  // Stations Directory & Smart Routing
  stationsTitle: string;
  stationsSubtitle: string;
  allCities: string;
  allFuels: string;
  goToFueling: string;
  chooseStation: string;
  attendantLabel: string;
  fuelFilterLabel: string;
  useMyGps: string;
  locatingGps: string;
  driverLocationLabel: string;
  searchOriginPlaceholder: string;
  nearestRouteTitle: string;
  nearestFuelBadge: string;
  coordinatesLabel: string;
  routeDistanceLabel: string;
  routeEtaLabel: string;
  routeBuilding: string;
  refuelHereBtn: string;
  openGoogleMapsBtn: string;
  routeStepsTitle: string;
  findNearestOnMapBtn: string;
  nearestStationRank: string;
  gpsPermissionDenied: string;
  resolvingCoords: string;
  noStationForFuel: string;
  youAreHere: string;
  liveGpsOn: string;
  liveGpsActive: string;
  stopLiveGps: string;
  nearbyPlacesTitle: string;
  nearbyPlacesLoading: string;
  nearbyPlacesEmpty: string;
  nearbyAll: string;
  nearbyGas: string;
  nearbyFood: string;
  nearbyStore: string;
  nearbyService: string;
  showRouteMapBtn: string;
  hideRouteMapBtn: string;
  expandMapBtn: string;
  collapseMapBtn: string;
  liveRouteModeTitle: string;
  openPlaceOnMap: string;
  locationAccessTitle: string;
  locationModeMyLocation: string;
  locationModeCity: string;
  locationGrantBtn: string;
  locationGrantedBadge: string;
  locationBlockedHint: string;
  nearestStationsSectionTitle: string;
  nearestFromMyGps: string;
  nearestInCityPrefix: string;
  mapLoadFailedNotice: string;
  retryMapBtn: string;
  mapLayerRoadmap: string;
  mapLayerSatellite: string;
  mapSatelliteLabels: string;
  mapView360Btn: string;
  mapExit360Btn: string;
  streetViewOpenExternal: string;
  streetViewDragHint: string;
  streetViewSatelliteOrbitLabel: string;
  streetViewStreetModeLabel: string;
  streetViewUnavailableHint: string;
  streetViewLoading: string;
  pegmanAriaLabel: string;
  pegmanDragTooltip: string;
  pegmanDropAction: string;
  pegmanDroppedPointLabel: string;
  gpsSignalTimeout: string;
  gpsSignalUnavailable: string;
  mapFollowDriverBtn: string;
  mapFollowingDriver: string;
  liveTelemetryUpdated: string;
  districtTashkentCenter: string;
  districtChilonzor: string;
  districtYunusobod: string;
  districtSergeli: string;
  // History
  historyTitle: string;
  historySubtitle: string;
  totalOrders: string;
  totalMethane: string;
  totalPaid: string;
  noOrdersTitle: string;
  noOrdersSubtitle: string;
  receiptTitle: string;
  receiptBtn: string;
  historyColReceiptDate: string;
  historyColStationBay: string;
  historyColFuel: string;
  historyColVolume: string;
  historyColAmount: string;
  historyColAttendant: string;
  historyColAction: string;
  historyCloseReceiptAria: string;
  historyDetailCar: string;
  historyDetailBayFuel: string;
  historyDetailAttendant: string;
  historyDetailCardPay: string;
  historyDetailTotalCharged: string;
  // Profile
  linkedCardsTitle: string;
  linkedCardsSubtitle: string;
  addCardBtn: string;
  hideForm: string;
  primaryCard: string;
  makePrimary: string;
  saveCarData: string;
  myVehiclesTitle: string;
  addNewCarBtn: string;
  newCarModelLabel: string;
  newCarPlateLabel: string;
  saveNewCarBtn: string;
  activeCarBadge: string;
  selectCarBtn: string;
  deleteCarLabel: string;
  carAddedSuccess: string;
  profileUpdatedSuccess: string;
  profileSaveBtnError: string;
  profileNewCardNumberLabel: string;
  profileBindNewCardBtn: string;
  profileExpiryPrefix: string;
  profileDeleteCardAriaPrefix: string;
  profileAttendantSectionEyebrow: string;
  profileDriverCarTitle: string;
  profileAttendantCarHint: string;
  profileAccountPhoneLabel: string;
  profileDriverNameLabel: string;
  // Personal dezagamiz Card
  personalCardEyebrow: string;
  personalCardTitle: string;
  personalCardSubtitle: string;
  personalCardCta: string;
  personalCardIssuing: string;
  personalCardTierLabel: string;
  personalCardTierStandard: string;
  personalCardTierStandardDesc: string;
  personalCardTierPrime: string;
  personalCardTierPrimeDesc: string;
  personalCardStyleLabel: string;
  personalCardStyleCobalt: string;
  personalCardStyleArctic: string;
  personalCardStyleNight: string;
  personalCardInitialTopUp: string;
  personalCardBalanceLabel: string;
  personalCardBonusLabel: string;
  personalCardCashbackLabel: string;
  personalCardTopUpBtn: string;
  personalCardTopUpConfirm: string;
  personalCardFreezeBtn: string;
  personalCardUnfreezeBtn: string;
  personalCardFrozenBadge: string;
  personalCardActiveBadge: string;
  personalCardShowNumber: string;
  personalCardHideNumber: string;
  personalCardPayOption: string;
  personalCardIssuedSuccess: string;
  personalCardTopUpSuccess: string;
  personalCardIssuePromptLink: string;
  // Theme switcher
  themeLight: string;
  themeDark: string;
  themeSwitchAria: string;
  // Assistant & Personal Music
  assistantTitle: string;
  assistantSubtitle: string;
  assistantWelcome: string;
  assistantPlaceholder: string;
  assistantSendBtn: string;
  assistantThinking: string;
  assistantClearBtn: string;
  assistantActionOpenStation: string;
  assistantActionPlayMelody: string;
  assistantPrompt1: string;
  assistantPrompt2: string;
  assistantPrompt3: string;
  assistantPrompt4: string;
  musicStudioTitle: string;
  musicStudioSubtitle: string;
  musicTabTracks: string;
  musicTabComposeAi: string;
  musicTabCustom: string;
  musicPlayBtn: string;
  musicPauseBtn: string;
  musicNextBtn: string;
  musicLoopLabel: string;
  musicVolumeLabel: string;
  musicDownloadWavBtn: string;
  musicChimeActiveLabel: string;
  musicSetChimeBtn: string;
  musicAutoPlayFuelLabel: string;
  musicUploadTitle: string;
  musicUploadHint: string;
  musicUploadBtn: string;
  musicUploading: string;
  musicComposePromptLabel: string;
  musicComposePromptPlaceholder: string;
  musicComposeBpmLabel: string;
  musicComposePresetLabel: string;
  musicComposeBtn: string;
  musicComposing: string;
  musicSequencerTitle: string;
  musicSequencerHint: string;
  musicSaveCustomBtn: string;
  musicCustomTitlePlaceholder: string;
  musicQuickCardTitle: string;
  musicOpenStudioBtn: string;
  musicPresetRhodes: string;
  musicPresetWarmPad: string;
  musicPresetPluck: string;
  musicPresetChime: string;
  musicPresetBass: string;
  musicMood1: string;
  musicMood2: string;
  musicMood3: string;
  musicMood4: string;
  musicSourceGemini: string;
  musicSourceFile: string;
  musicSourceCustom: string;
  musicSourcePreset: string;
  musicDeleteTrackAria: string;
  musicComposeSuccessPrefix: string;
  musicComposeSuccessSuffix: string;
  musicUploadSuccessPrefix: string;
  musicUploadSuccessSuffix: string;
  musicCustomSavedPrefix: string;
  musicCustomSavedSuffix: string;
  musicSelectAtLeastOneNote: string;
  musicPreset1Title: string;
  musicPreset1Sub: string;
  musicPreset2Title: string;
  musicPreset2Sub: string;
  musicPreset3Title: string;
  musicPreset3Sub: string;
  assistantPromptGreeting: string;
  assistantActionGoTo: string;
  assistantActionThemeDark: string;
  assistantActionThemeLight: string;
  assistantActionThemeToggled: string;
  assistantActionLangChanged: string;
  assistantActionGpsOn: string;
  assistantActionGpsOff: string;
  assistantErrReply: string;
  musicDefaultComposePrompt: string;
  musicDefaultCustomTitle: string;
  musicPreviewDefaultTitle: string;
  musicCustomFallbackTitle: string;
  musicComposeFailedErr: string;
  musicUploadFailedErr: string;
  musicSaveCustomFailedErr: string;
  musicPlaybackAudioErr: string;
  musicPlaybackBlockedErr: string;
  musicFileTooLargeErr: string;
  musicFileReadErr: string;
  musicUploadTrackFallback: string;
  creatorShowCodeAria: string;
  creatorHideCodeAria: string;
  sampleFullNamePlaceholder: string;
  sampleCardHolderPlaceholder: string;
  personalCardDriverFallback: string;
  meterUnit: string;
  languageSelectorAria: string;
  creatorLoadErr: string;
  creatorLockErr: string;
  creatorUpdateStationErr: string;
  creatorAdvanceOrderErr: string;
  driverMarkerSelf: string;
  closeAria: string;
  zoomInAria: string;
  zoomOutAria: string;
  entryModeAria: string;
  primaryNavAria: string;
  mobileNavAria: string;
  rotateLeftAria: string;
  rotateRightAria: string;
  // Fuels & Units
  fuelMetan: string;
  fuelPropan: string;
  fuelAi92: string;
  fuelAi95: string;
  fuelMetanFull: string;
  fuelPropanFull: string;
  fuelAi92Full: string;
  fuelAi95Full: string;
  pressure200Bar: string;
  pressure16Bar: string;
  currencyUzs: string;
  unitM3: string;
  unitLiter: string;
  // Updated Melody 4 & Showcase Presentation / Defense / Monetization
  musicPreset4Title: string;
  musicPreset4Sub: string;
  navShowcase: string;
  navShowcaseShort: string;
  openShowcaseBtn: string;
  launchJuryDemoBtn: string;
  showcaseBackToGate: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  showcaseProjectorModeOn: string;
  showcaseSpeakerNotesOn: string;
  showcaseSpeakerCueLabel: string;
  showcaseTimerLabel: string;
  showcaseTimerStart: string;
  showcaseTimerPause: string;
  showcaseTimerReset: string;
  showcaseTarget3Min: string;
  showcaseTabSlides: string;
  showcaseTabSavings: string;
  showcaseTabDefense: string;
  showcaseTabMonetization: string;
  showcaseTabChecklist: string;
  showcasePrevSlide: string;
  showcaseNextSlide: string;
  showcaseShowLiveBtn: string;
  showcaseQuizModeBtn: string;
  showcaseQuizNextBtn: string;
  showcaseQuizRevealBtn: string;
  showcaseQuizHideBtn: string;
  showcaseQuizTimerLabel: string;
  showcaseFilterAll: string;
  showcaseFilterParents: string;
  showcaseFilterJury: string;
  showcaseFilterBusiness: string;
  showcaseSavingsTitle: string;
  showcaseSavingsSubtitle: string;
  showcaseMonthlyKmLabel: string;
  showcaseConsumptionLabel: string;
  showcaseOutMonthlySavings: string;
  showcaseOutYearlySavings: string;
  showcaseOutPrimeCashback: string;
  showcaseOutTotalBenefit: string;
  showcaseOutCo2Saved: string;
  showcaseOutTimeSaved: string;
  unitKgShort: string;
  unitHourShort: string;
  unitMinShort: string;
  showcaseMonetizeTitle: string;
  showcaseMonetizeSubtitle: string;
  showcaseStationsCountLabel: string;
  showcaseCarsPerDayLabel: string;
  showcaseOutMonthlyOrders: string;
  showcaseOutSubIncome: string;
  showcaseOutFeeIncome: string;
  showcaseOutAdIncome: string;
  showcaseOutMonthlyRevenue: string;
  showcaseOutYearlyRevenue: string;
  showcaseChecklistTitle: string;
  showcaseChecklistSubtitle: string;
  showcaseChecklistProgress: string;
  safetyMetanRule: string;
  safetyStayInCarNote: string;
  trackerExitForMetanHint: string;
  carSupportedFuelsLabel: string;
  carFuelAutoSelected: string;
  carNoGboHybridWarn: string;
  carEvOnlyWarn: string;
  bayCodeTitle: string;
  bayCodeLabel: string;
  bayCodePlaceholder: string;
  bayCodeAutofillBtn: string;
  bayCodeScanQrBtn: string;
  bayCodeScanningQr: string;
  bayCodeVerifiedBadge: string;
  bayCodeDemoHintPrefix: string;
  errBayCodeMismatch: string;
  compactLocationTitle: string;
  howItWorksToggleOpen: string;
  howItWorksToggleClose: string;
  secretAdminActivatedToast: string;
  secretAdminBackToDriverBtn: string;
  sortNearestLabel: string;
  sortBestNearbyLabel: string;
  bestMatchBadge: string;
  stationStatusOpen: string;
  stationStatusBusy: string;
  stationStatusMaint: string;
  queueLowLabel: string;
  queueMediumLabel: string;
  queueHighLabel: string;
  geoFallbackCityNotice: string;
  mapFallbackActiveNote: string;
  carMatchOk: string;
  carMatchNo: string;
  showcaseBackToApp: string;
  creatorOperationalStatusLabel: string;
  creatorQueueLevelLabel: string;
  creatorFuelAvailabilityLabel: string;
  creatorFuelOn: string;
  creatorFuelOff: string;
  creatorDemoEventsTitle: string;
  creatorDemoEventsEmpty: string;
  creatorSafetySandboxTitle: string;
  creatorSafetySandboxSub: string;
  creatorTestCarLabel: string;
  creatorTestFuelLabel: string;
  creatorTestBayLabel: string;
  creatorTestCodeInputLabel: string;
  creatorRunCheckBtn: string;
  creatorCheckPassed: string;
  creatorCheckBlockedCode: string;
  creatorCheckBlockedFuel: string;
}

const RU: TranslationBundle = {
  loadingTitle: 'dezagamiz',
  loadingSubtitle: 'Подключаем станции и проверяем доступ...',
  loadingReadySubtitle: 'Станции и тарифы Узбекистана подключены · Готово к запуску',
  loadingWaitBtn: 'Загрузка приложения...',
  enterAppBtn: 'Перейти к приложению',
  splashFooterMeta: 'АГНКС и АЗС · Оплата газа и бензина из салона',
  enteringApp: 'Входим в dezagamiz...',
  gateBadge: 'Вход после регистрации с картой или гость на 3 дня',
  heroEyebrow: 'Сеть АГНКС и АЗС по всему Узбекистану',
  heroTitle: 'Платите за газ из салона — заправщик подойдёт сам',
  heroSubtitle:
    'Больше не нужно выходить на жару, холод или стоять в очереди к кассе. Выберите колонку на станции dezagamiz, оплатите привязанной картой, и наш оператор подключит газовый пистолет за секунды.',
  heroImageAlt: 'Станция заправки dezagamiz в Ташкенте в сине-белом стиле',
  step1Label: 'Шаг 01',
  step1Title: 'Регистрация авто',
  step1Desc: 'Оператор узнает вашу машину по номеру на колонке',
  step2Label: 'Шаг 02',
  step2Title: 'Привязка карты',
  step2Desc: 'Uzcard, Humo, Visa или Mastercard для оплаты',
  step3Label: 'Шаг 03',
  step3Title: 'Заправка газом',
  step3Desc: 'После оплаты заправщик сам подходит и заправляет авто',
  heroCities: 'Ташкент · Самарканд · Бухара · Фергана',
  heroPriceFrom: 'Метан от 5 700 сум/м³',
  tabRegister: 'Регистрация',
  tabLogin: 'Войти',
  tabGuest: 'Гость (3 дн.)',
  tabCreator: 'Создатель',
  stage1Of2: 'Этап 1 из 2',
  stage2Of2: 'Этап 2 из 2',
  driverAndCar: 'Водитель и авто',
  cardBinding: 'Привязка карты',
  fullNameLabel: 'Имя и фамилия водителя',
  phoneLabel: 'Номер телефона (Узбекистан)',
  carModelLabel: 'Марка и модель авто',
  plateNumberLabel: 'Госномер авто',
  preferredFuelLabel: 'Основной вид топлива',
  nextBindCard: 'Далее: привязать карту',
  back: 'Назад',
  bindCardAndEnter: 'Привязать карту и войти',
  checkingCard: 'Проверяем карту...',
  cardExpiryLabel: 'ММ/ГГ',
  cardCvcLabel: 'CVC / Код',
  cardHolderLabel: 'Имя на карте',
  cardPreviewLabel: 'Привязанная карта оплаты',
  cardPreviewExpiryLabel: 'Срок',
  loginTitle: 'Вход для зарегистрированных водителей',
  loginSubtitle:
    'Войти могут водители, которые уже зарегистрировали авто и привязали банковскую карту.',
  loginButton: 'Войти в dezagamiz',
  checkingAccount: 'Проверяем аккаунт...',
  firstTimeHint: 'Впервые в приложении? Переключитесь на вкладку «Регистрация»',
  errEnterFullName: 'Введите ваше имя и фамилию',
  errEnterUzPhone: 'Введите номер телефона Узбекистана в формате +998 XX XXX XX XX',
  errEnterCarModel: 'Укажите марку и модель автомобиля (например, Chevrolet Cobalt)',
  errEnterUzPlate: 'Введите корректный госномер Узбекистана (например, 01 A 777 AA)',
  errCheckCardNumber: 'Проверьте номер банковской карты',
  errEnterCardExpiry: 'Укажите действующий срок карты (ММ/ГГ)',
  errEnterCardHolder: 'Введите имя держателя карты',
  errEnterCardCvc: 'Введите 3-значный код CVC/CVV',
  errRegisterFailed: 'Не удалось завершить регистрацию',
  errLoginFailed: 'Не удалось войти. Проверьте регистрацию и привязку карты.',
  errCreatorCodeInvalid: 'Неверный код создателя',
  errChooseRoleFailed: 'Не удалось выбрать режим входа',
  errSelectFreeBay: 'Выберите свободную колонку',
  errFuelNotOnBay: 'Выбранный вид топлива отсутствует на этой колонке',
  errMinFuelAmount: 'Минимальная сумма заправки — 10 000 сум',
  errPersonalCardFrozen:
    'Персональная карта dezagamiz заморожена. Разморозьте её в разделе «Карта и авто».',
  errPersonalCardLowFunds:
    'Недостаточно средств на персональной карте dezagamiz. Пополните баланс в разделе «Карта и авто».',
  errBindCardToPay: 'Привяжите банковскую карту для оплаты',
  errPaymentFailed: 'Не удалось провести оплату',
  errSwitchCarFailed: 'Не удалось переключить автомобиль',
  errAddCarFailed: 'Не удалось добавить авто',
  errSwitchCarProfileFailed: 'Не удалось сменить авто',
  errDeleteCarFailed: 'Не удалось удалить авто',
  errAddCardFailed: 'Не удалось добавить карту',
  errSwitchCardFailed: 'Не удалось сменить карту',
  errDeleteLastCard: 'Нельзя удалить единственную карту',
  errIssueCardFailed: 'Не удалось оформить карту',
  errTopUpCheck: 'Проверьте сумму пополнения',
  errTopUpMin: 'Минимальная сумма пополнения — 10 000 сум',
  errTopUpMax: 'Максимальная сумма одного пополнения — 5 000 000 сум',
  errCardDigits: 'Введите 16 цифр номера карты',
  errCardNetwork: 'Поддерживаются карты Uzcard (8600), Humo (9860), Visa и Mastercard',
  errCardLuhn: 'Некорректный контрольный номер карты',
  errTopUpFailed: 'Не удалось пополнить карту',
  errCardDesignFailed: 'Не удалось обновить дизайн карты',
  errCardFreezeFailed: 'Не удалось изменить статус карты',
  guestTitle: 'Гостевой режим на 3 дня',
  guestSubtitle:
    'Попробуйте оплату и отслеживание заправщика без привязки своей карты. Максимальный срок гостевого доступа — строго 3 дня (72 часа), больше 3 дней пользоваться нельзя.',
  guestRuleBadge: 'Ограничение: максимум 3 дня',
  guestLimitItem1: 'Доступны все станции, реальные цены Узбекистана и заказ из салона.',
  guestLimitItem2: 'Таймер на 3 дня привязывается к устройству и не продлевается.',
  guestLimitItem3: 'Через 3 дня для продолжения потребуется регистрация с картой.',
  guestStartButton: 'Войти как гость на 3 дня',
  guestStarting: 'Открываем гостевой доступ...',
  guestExpiredNotice:
    'Срок гостевого режима (3 дня) истёк. Зарегистрируйтесь и привяжите карту.',
  guestBannerLabel: 'Гостевой режим · осталось',
  guestUpgradeButton: 'Зарегистрироваться и привязать карту',
  creatorTitle: 'Вход в раздел создателя',
  creatorSubtitle:
    'Введите секретный пароль, чтобы выбрать вход как Админ или как обычный человек.',
  creatorCodeLabel: 'Код создателя',
  creatorCodePlaceholder: 'Введите секретный код',
  verifyPassword: 'Проверить пароль',
  verifyingPassword: 'Проверяем пароль...',
  passwordConfirmed: 'Пароль подтверждён',
  chooseRoleTitle: 'Выберите режим входа',
  chooseRoleSubtitle:
    'Войдите как администратор для управления станциями и ценами, или как обычный человек для заправки автомобиля.',
  roleAdminTitle: 'Админ',
  roleAdminDesc: 'Управление ценами станций, колонками, заказами и водителями.',
  enterAsAdmin: 'Войти как Админ',
  roleDriverTitle: 'Обычный человек',
  roleDriverDesc: 'Обычный режим водителя: выбор колонки, оплата картой и заправка.',
  enterAsDriver: 'Войти как обычный человек',
  creatorAccessBadge: 'Специальный доступ · Код подтверждён',
  creatorPanelTitle: 'Кабинет создателя dezagamiz',
  creatorPanelSubtitle:
    'Управление ценами на газ и топливо, колонками АГНКС и мониторинг водителей по всему Узбекистану.',
  creatorDriverModeBadge: 'Режим: Обычный человек',
  creatorLockBtn: 'Заблокировать раздел создателя',
  creatorExitBtn: 'Выйти из кабинета создателя',
  creatorLoadingMetrics: 'Загружаем показатели сети dezagamiz...',
  creatorStatDrivers: 'Водителей с картой',
  creatorStatOrders: 'Заказов',
  creatorStatActivePrefix: 'активных',
  creatorStatMethane: 'Отпущено метана',
  creatorStatRevenue: 'Оборот сети',
  creatorStationManageEyebrow: 'Управление станцией',
  creatorStationManageTitle: 'Тарифы и колонки',
  creatorSelectStationLabel: 'Выберите станцию',
  creatorPricesLabel: 'Цены (за м³ / л)',
  creatorBaysStatusLabel: 'Статус колонок на станции',
  creatorApplyStationBtn: 'Применить изменения на станции',
  creatorSavingStationBtn: 'Сохраняем...',
  creatorStationUpdatedMsg: 'Тарифы и состояние колонок обновлены для всех водителей',
  creatorOrdersTitle: 'Заказы на заправку',
  creatorOrdersEmpty:
    'Заказов пока нет. Как только водитель оплатит газ из салона, заказ появится здесь.',
  creatorColReceiptCar: 'Чек / Авто',
  creatorColStationBay: 'Станция / Кол.',
  creatorColAmount: 'Сумма',
  creatorColStatus: 'Статус',
  creatorColControl: 'Контроль',
  creatorStagePaid: 'Оплачен',
  creatorStageApproaching: 'Заправщик идёт',
  creatorStageFueling: 'Идёт заправка',
  creatorStageCompleted: 'Завершён',
  creatorNextStageBtn: 'След. этап',
  creatorDoneLabel: 'Готово',
  creatorDriversTitle: 'Зарегистрированные водители',
  creatorDriversEmpty: 'Пока нет зарегистрированных водителей с привязанной картой.',
  creatorColDriver: 'Водитель',
  creatorColPhone: 'Телефон',
  creatorColCarPlate: 'Авто и номер',
  creatorColLinkedCard: 'Привязанная карта',
  navFuel: 'Заправка',
  navStations: 'Станции',
  navAssistant: 'Помощник',
  navHistory: 'История',
  navCards: 'Карта и авто',
  navCardsShort: 'Карта',
  navCreator: 'Создатель',
  navAdminPanel: 'Админ-панель',
  navAdminShort: 'Админ',
  navDriverShort: 'Водитель',
  switchToDriver: 'Обычный человек',
  switchToAdmin: 'Админ',
  logout: 'Выйти',
  fuelTitle: 'Заправка не выходя из машины',
  fuelSubtitle:
    'Оплатите нужный объём с привязанной карты — оператор dezagamiz сам подойдёт к колонке и заправит авто.',
  yourCar: 'Ваш автомобиль',
  selectStationStep: '1. Станция заправки в Узбекистане',
  selectBayStep: '2. Номер колонки, у которой вы остановились',
  freeBaysCount: 'Свободно',
  selectFuelStep: '3. Вид газа или топлива на колонке',
  amountStep: '4. Сумма заправки',
  fullTank: 'Полный баллон',
  payWithCardLabel: 'Оплата привязанной картой',
  cardsCountLabel: 'Карты',
  payFromCarBtn: 'Оплатить из машины',
  processingPayment: 'Проводим оплату...',
  howItWorksTitle: 'Как проходит заправка',
  howStep1: 'Вы остаётесь в салоне с закрытыми окнами и оплачиваете нужную сумму.',
  howStep2Prefix: 'Дежурный заправщик на колонке',
  howStep3:
    'Оператор подходит, подключает газ и заправляет автомобиль до заданного объёма.',
  driverProfileActive: 'Профиль водителя активен',
  cardVerifiedText: 'Безопасная оплата картой подтверждена',
  bayFree: 'Свободна',
  bayBusy: 'Занята',
  bayShortLabel: 'Колонка №',
  notAtBay: 'Нет на ТРК',
  open24h: 'Круглосуточно 24/7',
  distanceKmUnit: 'км',
  trackerStage1Title: 'Оплата прошла',
  trackerStage1Sub: 'Средства списаны, заказ передан на колонку',
  trackerStage2Title: 'Заправщик подходит',
  trackerStage2Sub: 'Оператор идёт к вашему автомобилю',
  trackerStage3Title: 'Идёт заправка газом',
  trackerStage3Sub: 'Пистолет подключён, оставайтесь в салоне',
  trackerStage4Title: 'Заправка завершена',
  trackerStage4Sub: 'Лючок закрыт, можно спокойно уезжать',
  trackerHeadlinePaid: 'Оплата подтверждена',
  trackerHeadlineApproaching: 'Заправщик подходит к вашей машине',
  trackerHeadlineFuelingPrefix: 'Идёт заправка:',
  trackerHeadlineCompleted: 'Заправка успешно завершена',
  trackerDescPaid: 'Не выходите из машины — свободный заправщик уже принял ваш заказ.',
  trackerDescApproachingSuffix: 'идёт к вашему',
  trackerDescFuelingMid: 'Заправочный пистолет подключён к колонке',
  trackerDescCompleted: 'Пистолет отключён, клапан закрыт. Цифровой чек сохранён в истории.',
  trackerTariffLabel: 'Тариф',
  trackerVolumeFilledLabel: 'Заправлено объёма',
  trackerGoalLabel: 'Цель',
  trackerPaidFromCardLabel: 'Оплачено с карты',
  trackerStatusLabel: 'Статус подачи',
  trackerStatusPaid: 'Передача на пост',
  trackerStatusEtaPrefix: 'Подойдёт через ~',
  trackerStatusEtaSec: 'сек',
  trackerStatusFuelingPrefix: 'Подача газа',
  trackerStatusDone: 'Заправка 100%',
  trackerStayInsideHint: 'Окна можно не открывать — оператор видит марку и госномер авто',
  trackerBtnAtCar: 'Оператор уже у машины',
  trackerBtnStartFuel: 'Начать подачу газа',
  trackerBtnFinishFuel: 'Завершить заправку',
  trackerRateLabel: 'Оцените работу заправщика',
  trackerRateAriaPrefix: 'Оценка',
  trackerNewOrderBtn: 'Новая заправка',
  trackerAttendantCardTitle: 'Ваш заправщик на смене',
  trackerExperiencePrefix: 'Стаж',
  trackerExperienceUnit: 'лет',
  trackerUniformLabel: 'Синяя форма dezagamiz',
  trackerRolePaid: 'Получил сигнал с вашего заказа',
  trackerRoleApproaching: 'Подходит с газовым пистолетом к колонке',
  trackerRoleFueling: 'Контролирует заправку до заданного объёма',
  trackerRoleCompleted: 'Закрыл заправочную крышку автомобиля',
  trackerCarVerifyPrefix: 'Для сверки на колонке передан ваш автомобиль:',
  trackerPaymentDetailsTitle: 'Детали оплаты',
  trackerDetailStation: 'Станция',
  trackerDetailBay: 'Колонка',
  trackerDetailFuel: 'Топливо',
  trackerDetailCard: 'Карта',
  trackerDetailCashback: 'Кэшбэк dezagamiz',
  trackerDetailTotal: 'Итого оплачено',
  stationsTitle: 'Ближайшие станции и маршруты dezagamiz',
  stationsSubtitle:
    'Выберите нужный вид топлива (например, пропан), определите геолокацию — и приложение проложит маршрут до ближайшей АЗС с точными координатами.',
  allCities: 'Все города',
  allFuels: 'Все виды',
  goToFueling: 'Перейти к заправке',
  chooseStation: 'Построить маршрут и выбрать',
  attendantLabel: 'Оператор',
  fuelFilterLabel: 'Выберите нужное топливо',
  useMyGps: 'Моё местоположение (GPS)',
  locatingGps: 'Определяем GPS...',
  driverLocationLabel: 'Ваша точка старта',
  searchOriginPlaceholder: 'Введите улицу или район в Узбекистане...',
  nearestRouteTitle: 'Рекомендуемый маршрут до ближайшей АЗС',
  nearestFuelBadge: 'Ближайшая АЗС',
  coordinatesLabel: 'Точные координаты',
  routeDistanceLabel: 'По маршруту',
  routeEtaLabel: 'В пути',
  routeBuilding: 'Строим маршрут...',
  refuelHereBtn: 'Заправиться здесь',
  openGoogleMapsBtn: 'Открыть в Google Картах',
  routeStepsTitle: 'Подсказки маршрута',
  findNearestOnMapBtn: 'Найти ближайшую на карте',
  nearestStationRank: 'Ближайшая',
  gpsPermissionDenied: 'Нет доступа к GPS. Выберите район или введите адрес в Узбекистане.',
  resolvingCoords: 'Уточняем точные координаты через Google Maps...',
  noStationForFuel: 'Для выбранного топлива нет подходящих станций в этом фильтре.',
  youAreHere: 'Вы здесь',
  liveGpsOn: 'Live GPS (в реальном времени)',
  liveGpsActive: 'Локация обновляется в реальном времени',
  stopLiveGps: 'Пауза GPS',
  nearbyPlacesTitle: 'Все ближайшие места рядом',
  nearbyPlacesLoading: 'Ищем все ближайшие места вокруг вас...',
  nearbyPlacesEmpty: 'В радиусе 3 км дополнительные места не найдены.',
  nearbyAll: 'Все места',
  nearbyGas: 'АЗС рядом',
  nearbyFood: 'Кафе и еда',
  nearbyStore: 'Магазины',
  nearbyService: 'Автосервис',
  showRouteMapBtn: 'Показать карту маршрута',
  hideRouteMapBtn: 'Скрыть карту',
  expandMapBtn: 'Развернуть карту',
  collapseMapBtn: 'Обычный вид',
  liveRouteModeTitle: 'Карта маршрута и локация в реальном времени',
  openPlaceOnMap: 'Показать на карте',
  locationAccessTitle: 'Откуда искать ближайшие заправки',
  locationModeMyLocation: 'Моё местоположение',
  locationModeCity: 'Выбрать город',
  locationGrantBtn: 'Разрешить доступ к геолокации',
  locationGrantedBadge: 'Доступ к локации разрешён',
  locationBlockedHint:
    'Доступ к геолокации запрещён в браузере. Разрешите его в настройках сайта или выберите город ниже.',
  nearestStationsSectionTitle: 'Ближайшие заправки',
  nearestFromMyGps: 'Рядом с вашей геолокацией',
  nearestInCityPrefix: 'Ближайшие в городе',
  mapLoadFailedNotice:
    'Интерактивная карта временно недоступна (ошибка сети или блокировка скрипта Google Maps). Выбор ближайших станций работает, или откройте маршрут напрямую в Google Картах.',
  retryMapBtn: 'Повторить загрузку карты',
  mapLayerRoadmap: 'Карта',
  mapLayerSatellite: 'Спутник',
  mapSatelliteLabels: 'Надписи',
  mapView360Btn: '360° Панорама',
  mapExit360Btn: 'Назад на карту',
  streetViewOpenExternal: 'Открыть 360° в Google Картах',
  streetViewDragHint: 'Перетаскивайте экран для обзора 360°',
  streetViewSatelliteOrbitLabel: '360° Спутниковый обзор станции',
  streetViewStreetModeLabel: '360° Панорама улиц Google',
  streetViewUnavailableHint:
    'Для этого проезда нет уличной съёмки Google — открыт 360° спутниковый обзор',
  streetViewLoading: 'Загружаем панораму 360°...',
  pegmanAriaLabel: 'Просмотр 360° (перетащите жёлтого человечка на карту)',
  pegmanDragTooltip: 'Перетащите на карту или нажмите для 360°',
  pegmanDropAction: 'Отпустите для просмотра 360°',
  pegmanDroppedPointLabel: 'Точка обзора 360° на карте',
  gpsSignalTimeout: 'Долгое ожидание GPS — продолжаем поиск спутников...',
  gpsSignalUnavailable: 'Сигнал GPS временно недоступен — повторяем попытку...',
  mapFollowDriverBtn: 'Следовать',
  mapFollowingDriver: 'Слежение GPS',
  liveTelemetryUpdated: 'Обновлено',
  districtTashkentCenter: 'Ташкент · Центр',
  districtChilonzor: 'Чиланзар',
  districtYunusobod: 'Юнусабад',
  districtSergeli: 'Сергели',
  historyTitle: 'История заправок и чеки',
  historySubtitle:
    'Все оплаты с привязанной карты и данные заправщиков, обслуживавших ваш автомобиль.',
  totalOrders: 'Всего заправок',
  totalMethane: 'Заправлено метана',
  totalPaid: 'Оплачено всего',
  noOrdersTitle: 'Заправок пока не было',
  noOrdersSubtitle:
    'После первой оплаты из машины здесь появится цифровой чек с объёмом газа и именем заправщика.',
  receiptTitle: 'Электронный чек dezagamiz',
  receiptBtn: 'Чек',
  historyColReceiptDate: 'Чек / Дата',
  historyColStationBay: 'Станция и колонка',
  historyColFuel: 'Топливо',
  historyColVolume: 'Объём',
  historyColAmount: 'Сумма',
  historyColAttendant: 'Оператор',
  historyColAction: 'Действие',
  historyCloseReceiptAria: 'Закрыть чек',
  historyDetailCar: 'Автомобиль',
  historyDetailBayFuel: 'Колонка и топливо',
  historyDetailAttendant: 'Заправщик',
  historyDetailCardPay: 'Оплата картой',
  historyDetailTotalCharged: 'Итого списано',
  linkedCardsTitle: 'Привязанные карты',
  linkedCardsSubtitle:
    'Минимум одна активная карта обязательна для постоянного входа и оплаты из салона.',
  addCardBtn: 'Добавить карту',
  hideForm: 'Скрыть форму',
  primaryCard: 'Основная',
  makePrimary: 'Сделать основной',
  saveCarData: 'Сохранить данные авто',
  myVehiclesTitle: 'Мои автомобили',
  addNewCarBtn: 'Добавить новую машину',
  newCarModelLabel: 'Марка и модель нового авто',
  newCarPlateLabel: 'Госномер нового авто',
  saveNewCarBtn: 'Добавить авто в профиль',
  activeCarBadge: 'Текущее авто',
  selectCarBtn: 'Выбрать',
  deleteCarLabel: 'Удалить авто',
  carAddedSuccess: 'Новый автомобиль добавлен и выбран основным',
  profileUpdatedSuccess: 'Данные автомобиля и профиля обновлены',
  profileSaveBtnError: 'Ошибка сохранения',
  profileNewCardNumberLabel: 'Номер новой карты',
  profileBindNewCardBtn: 'Привязать новую карту',
  profileExpiryPrefix: 'Срок',
  profileDeleteCardAriaPrefix: 'Удалить карту',
  profileAttendantSectionEyebrow: 'Данные для заправщика',
  profileDriverCarTitle: 'Водитель и автомобиль',
  profileAttendantCarHint: 'Оператор на станции ориентируется по модели и госномеру вашей машины.',
  profileAccountPhoneLabel: 'Телефон аккаунта',
  profileDriverNameLabel: 'Имя водителя',
  personalCardEyebrow: 'Фирменная топливная карта водителя',
  personalCardTitle: 'Персональная карта dezagamiz',
  personalCardSubtitle:
    'Мгновенный выпуск в стиле dezagamiz: оплата газа и бензина без комиссии и до 5% кэшбэка бонусами на счёт.',
  personalCardCta: 'Оформить карту dezagamiz',
  personalCardIssuing: 'Выпускаем карту...',
  personalCardTierLabel: 'Тариф карты',
  personalCardTierStandard: 'Стандарт',
  personalCardTierStandardDesc: 'Выпуск 0 сум · кэшбэк 3% бонусами',
  personalCardTierPrime: 'Prime',
  personalCardTierPrimeDesc: 'Выпуск 0 сум · кэшбэк 5% + приоритет',
  personalCardStyleLabel: 'Стиль оформления',
  personalCardStyleCobalt: 'Синий флагман',
  personalCardStyleArctic: 'Белый хром',
  personalCardStyleNight: 'Ночной Ташкент',
  personalCardInitialTopUp: 'Стартовое пополнение с карты',
  personalCardBalanceLabel: 'Баланс карты',
  personalCardBonusLabel: 'Бонусы кэшбэка',
  personalCardCashbackLabel: 'Кэшбэк',
  personalCardTopUpBtn: 'Пополнить баланс',
  personalCardTopUpConfirm: 'Зачислить на карту',
  personalCardFreezeBtn: 'Заморозить',
  personalCardUnfreezeBtn: 'Разморозить',
  personalCardFrozenBadge: 'Заморожена',
  personalCardActiveBadge: 'Активна',
  personalCardShowNumber: 'Показать номер',
  personalCardHideNumber: 'Скрыть номер',
  personalCardPayOption: 'Персональная карта dezagamiz',
  personalCardIssuedSuccess: 'Персональная карта dezagamiz оформлена и готова к оплате!',
  personalCardTopUpSuccess: 'Баланс персональной карты dezagamiz пополнен',
  personalCardIssuePromptLink: 'Оформить персональную карту dezagamiz (кэшбэк до 5%)',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',
  themeSwitchAria: 'Переключить светлую и тёмную тему',
  assistantTitle: 'Персональный ИИ-помощник Gemini',
  assistantSubtitle: 'Маршруты к АГНКС · Расчёт топлива · Личная музыка в дорогу',
  assistantWelcome:
    'Здравствуйте! Я ваш персональный помощник dezagamiz на базе Gemini. Могу подсказать ближайшую АГНКС, рассчитать заправку для вашего авто или сочинить личную мелодию в дорогу.',
  assistantPlaceholder: 'Спросите про заправку, маршрут или попросите сочинить мелодию...',
  assistantSendBtn: 'Отправить',
  assistantThinking: 'Gemini готовит ответ...',
  assistantClearBtn: 'Очистить',
  assistantActionOpenStation: 'Перейти к выбранной станции',
  assistantActionPlayMelody: 'Включить созданную мелодию',
  assistantPrompt1: 'Какая ближайшая АГНКС с метаном сейчас свободна?',
  assistantPrompt2: 'Рассчитай, сколько м³ метана выйдет на 120 000 сум.',
  assistantPrompt3: 'Сочини спокойную ночную мелодию для поездки по Ташкенту.',
  assistantPrompt4: 'Поставь мягкий звуковой сигнал заправки и включи музыку.',
  musicStudioTitle: 'Личная музыка и мелодии',
  musicStudioSubtitle: 'Свои аудиофайлы · Мелодии Gemini · Сигнал заправки',
  musicTabTracks: 'Мои треки',
  musicTabComposeAi: 'Создать с Gemini',
  musicTabCustom: 'Свой файл / Ноты',
  musicPlayBtn: 'Играть',
  musicPauseBtn: 'Пауза',
  musicNextBtn: 'Следующий',
  musicLoopLabel: 'Повтор',
  musicVolumeLabel: 'Громкость',
  musicDownloadWavBtn: 'Скачать WAV',
  musicChimeActiveLabel: 'Сигнал заправки',
  musicSetChimeBtn: 'Назначить сигналом',
  musicAutoPlayFuelLabel: 'Играть мелодию при заправке',
  musicUploadTitle: 'Загрузить свой трек или мелодию',
  musicUploadHint: 'MP3, WAV, OGG или M4A до 5 МБ · хранится в вашем профиле',
  musicUploadBtn: 'Выбрать аудиофайл',
  musicUploading: 'Загружаем трек...',
  musicComposePromptLabel: 'Настроение или стиль мелодии',
  musicComposePromptPlaceholder: 'Например: тёплый ночной ло-фай для поездки по Ташкенту',
  musicComposeBpmLabel: 'Темп (BPM)',
  musicComposePresetLabel: 'Инструмент',
  musicComposeBtn: 'Сочинить мелодию в Gemini',
  musicComposing: 'Gemini сочиняет мелодию...',
  musicSequencerTitle: 'Редактор собственной мелодии (16 шагов)',
  musicSequencerHint: 'Нажмите на ноты — звук сразу прозвучит, затем сохраните мелодию',
  musicSaveCustomBtn: 'Сохранить свою мелодию',
  musicCustomTitlePlaceholder: 'Название вашей мелодии',
  musicQuickCardTitle: 'Личная музыка и Gemini-помощник',
  musicOpenStudioBtn: 'Открыть помощника и музыку',
  musicPresetRhodes: 'Rhodes',
  musicPresetWarmPad: 'Тёплый пэд',
  musicPresetPluck: 'Щипковый',
  musicPresetChime: 'Колокольчик',
  musicPresetBass: 'Бас-грув',
  musicMood1: 'Ночной Ташкент · плавный ло-фай для поездки',
  musicMood2: 'Энергичный утренний ритм по трассе',
  musicMood3: 'Восточный рассвет · лёгкая инструментальная мелодия',
  musicMood4: 'Чистый мягкий сигнал завершения заправки',
  musicSourceGemini: 'Gemini AI',
  musicSourceFile: 'Файл',
  musicSourceCustom: 'Своя мелодия',
  musicSourcePreset: 'Пресет',
  musicDeleteTrackAria: 'Удалить трек',
  musicComposeSuccessPrefix: 'Мелодия «',
  musicComposeSuccessSuffix: '» создана и добавлена в библиотеку.',
  musicUploadSuccessPrefix: 'Трек «',
  musicUploadSuccessSuffix: '» загружен в ваш профиль.',
  musicCustomSavedPrefix: 'Мелодия «',
  musicCustomSavedSuffix: '» сохранена и запущена.',
  musicSelectAtLeastOneNote: 'Отметьте хотя бы одну ноту на сетке.',
  musicPreset1Title: 'Ташкент · Ночной круиз',
  musicPreset1Sub: 'Мягкий Rhodes · Ло-фай атмосфера для дороги',
  musicPreset2Title: 'Самарканд · Рассвет',
  musicPreset2Sub: 'Щипковый синтез · Лёгкий восточный лад',
  musicPreset3Title: 'Сигнал заправки dezagamiz',
  musicPreset3Sub: 'Чистый хрустальный перезвон готовности колонки',
  assistantPromptGreeting: 'Привет! Подскажи нужный раздел',
  assistantActionGoTo: 'Открыть раздел:',
  assistantActionThemeDark: 'Тёмная тема включена',
  assistantActionThemeLight: 'Светлая тема включена',
  assistantActionThemeToggled: 'Тема переключена',
  assistantActionLangChanged: 'Язык переключён',
  assistantActionGpsOn: 'Live GPS включён',
  assistantActionGpsOff: 'Live GPS выключен',
  assistantErrReply: 'Не удалось получить ответ от Gemini.',
  musicDefaultComposePrompt: 'Спокойный ночной ло-фай ритм для поездки по городу',
  musicDefaultCustomTitle: 'Моя дорожная мелодия',
  musicPreviewDefaultTitle: 'Предпрослушивание',
  musicCustomFallbackTitle: 'Моя мелодия',
  musicComposeFailedErr: 'Ошибка генерации мелодии в Gemini.',
  musicUploadFailedErr: 'Не удалось загрузить файл.',
  musicSaveCustomFailedErr: 'Не удалось сохранить мелодию.',
  musicPlaybackAudioErr: 'Не удалось воспроизвести аудиофайл.',
  musicPlaybackBlockedErr: 'Нажмите Play для старта звука в браузере.',
  musicFileTooLargeErr: 'Максимальный размер аудиофайла — 5 МБ.',
  musicFileReadErr: 'Не удалось прочитать файл',
  musicUploadTrackFallback: 'Мой трек',
  creatorShowCodeAria: 'Показать код',
  creatorHideCodeAria: 'Скрыть код',
  sampleFullNamePlaceholder: 'Азизбек Каримов',
  sampleCardHolderPlaceholder: 'АЗИЗБЕК КАРИМОВ',
  personalCardDriverFallback: 'КАРТА ВОДИТЕЛЯ',
  meterUnit: 'м',
  languageSelectorAria: 'Выбор языка приложения',
  creatorLoadErr: 'Не удалось загрузить панель создателя',
  creatorLockErr: 'Не удалось заблокировать раздел создателя',
  creatorUpdateStationErr: 'Ошибка при обновлении станции',
  creatorAdvanceOrderErr: 'Не удалось изменить статус заказа',
  driverMarkerSelf: 'Я',
  closeAria: 'Закрыть',
  zoomInAria: 'Приблизить',
  zoomOutAria: 'Отдалить',
  entryModeAria: 'Режим входа',
  primaryNavAria: 'Основная навигация',
  mobileNavAria: 'Мобильная навигация',
  rotateLeftAria: 'Повернуть влево на 45°',
  rotateRightAria: 'Повернуть вправо на 45°',
  fuelMetan: 'Метан',
  fuelPropan: 'Пропан',
  fuelAi92: 'АИ-92',
  fuelAi95: 'АИ-95',
  fuelMetanFull: 'Метан (CNG)',
  fuelPropanFull: 'Пропан (LPG)',
  fuelAi92Full: 'Бензин АИ-92',
  fuelAi95Full: 'Бензин АИ-95',
  pressure200Bar: '200 бар',
  pressure16Bar: '16 бар',
  currencyUzs: 'сум',
  unitM3: 'м³',
  unitLiter: 'л',
  musicPreset4Title: 'Регистан · Драйв на трассе',
  musicPreset4Sub: 'Бодрый синт-грув с плотным басом и лёгкой мелодией для дороги',
  navShowcase: 'Защита',
  navShowcaseShort: 'Защита',
  openShowcaseBtn: 'Презентация и защита проекта',
  launchJuryDemoBtn: 'Запустить живое приложение (Демо)',
  showcaseBackToGate: 'Назад ко входу',
  showcaseTitle: 'Презентация и защита проекта',
  showcaseSubtitle: 'Слайды для выступления, ответы на вопросы жюри и родителей, калькуляторы выгоды и простого заработка',
  showcaseProjectorModeOn: 'Проектор (без шпаргалки)',
  showcaseSpeakerNotesOn: 'Подсказка спикера',
  showcaseSpeakerCueLabel: 'Что сказать залу:',
  showcaseTimerLabel: 'Таймер выступления',
  showcaseTimerStart: 'Старт',
  showcaseTimerPause: 'Пауза',
  showcaseTimerReset: 'Сброс',
  showcaseTarget3Min: 'Цель: 3:00',
  showcaseTabSlides: 'Слайды',
  showcaseTabSavings: 'Экономия семьи',
  showcaseTabDefense: 'Защита от вопросов',
  showcaseTabMonetization: 'Как заработать',
  showcaseTabChecklist: 'План на сцене',
  showcasePrevSlide: 'Назад',
  showcaseNextSlide: 'Следующий слайд',
  showcaseShowLiveBtn: 'Показать вживую',
  showcaseQuizModeBtn: 'Тренировка 30с',
  showcaseQuizNextBtn: 'Следующий вопрос',
  showcaseQuizRevealBtn: 'Показать ответ',
  showcaseQuizHideBtn: 'Скрыть ответ',
  showcaseQuizTimerLabel: 'На ответ',
  showcaseFilterAll: 'Все вопросы',
  showcaseFilterParents: 'От родителей',
  showcaseFilterJury: 'От жюри',
  showcaseFilterBusiness: 'Про деньги',
  showcaseSavingsTitle: 'Калькулятор экономии семьи на метане',
  showcaseSavingsSubtitle: 'Сравнение расходов за месяц и год: Метан + кэшбэк 5% по карте dezagamiz Prime против Бензина АИ-92',
  showcaseMonthlyKmLabel: 'Пробег авто в месяц',
  showcaseConsumptionLabel: 'Средний расход на 100 км',
  showcaseOutMonthlySavings: 'Экономия в месяц',
  showcaseOutYearlySavings: 'Экономия на топливе за год',
  showcaseOutPrimeCashback: 'Кэшбэк 5% за год (Prime)',
  showcaseOutTotalBenefit: 'Итоговая выгода семьи за год',
  showcaseOutCo2Saved: 'Меньше выбросов CO₂ в год',
  showcaseOutTimeSaved: 'Свободного времени без очередей',
  unitKgShort: 'кг',
  unitHourShort: 'ч',
  unitMinShort: 'мин',
  showcaseMonetizeTitle: 'Как заработать на приложении уже сейчас',
  showcaseMonetizeSubtitle: '4 простых пути без банковских лицензий и сложных разрешений + живой расчёт дохода',
  showcaseStationsCountLabel: 'Подключённых частных АГНКС/АЗС',
  showcaseCarsPerDayLabel: 'Машин через приложение в день (на 1 АЗС)',
  showcaseOutMonthlyOrders: 'Заказов в месяц',
  showcaseOutSubIncome: 'Подписки АЗС (200 тыс./мес)',
  showcaseOutFeeIncome: 'Партнёрский сбор (700 сум/чек)',
  showcaseOutAdIncome: 'Реклама кафе и моек на карте',
  showcaseOutMonthlyRevenue: 'Прогноз дохода в месяц',
  showcaseOutYearlyRevenue: 'Прогноз дохода за год',
  showcaseChecklistTitle: 'Чек-лист идеального показа на сцене',
  showcaseChecklistSubtitle: 'Отмечайте шаги во время выступления, чтобы ничего не забыть перед родителями и жюри',
  showcaseChecklistProgress: 'Выполнено шагов',
  safetyMetanRule: 'Оплатите онлайн без очереди в кассу. Внимание: при заправке метаном по правилам ТБ необходимо выйти из салона и открыть капот.',
  safetyStayInCarNote: 'Режим «Не выходя из машины» — ожидайте заправщика в салоне',
  trackerExitForMetanHint: 'По правилам ТБ АГНКС при заправке метаном выйдите из салона и откройте капот',
  carSupportedFuelsLabel: 'Подходит для авто',
  carFuelAutoSelected: 'Подобран подходящий вид топлива для вашей модели',
  carNoGboHybridWarn: 'Для данной модели (гибрид/бензин без ГБО) доступны только АИ-92 и АИ-95. Метан и Пропан не поддерживаются.',
  carEvOnlyWarn: 'Выбран электромобиль: газовая и бензиновая заправка не подходят. Переключите авто в гараже или используйте ЭЗС.',
  bayCodeTitle: 'Защита от оплаты чужой колонки',
  bayCodeLabel: 'Код подтверждения с дисплея колонки',
  bayCodePlaceholder: '4 цифры с экрана',
  bayCodeAutofillBtn: 'Подставить демо-код',
  bayCodeScanQrBtn: 'Сканировать QR на колонке',
  bayCodeScanningQr: 'Сканируем QR колонки...',
  bayCodeVerifiedBadge: 'Колонка подтверждена',
  bayCodeDemoHintPrefix: 'На табло колонки сейчас',
  errBayCodeMismatch: 'Введите верный 4-значный код с дисплея выбранной колонки или отсканируйте QR-код',
  compactLocationTitle: 'Город и ближайшая АЗС',
  howItWorksToggleOpen: 'Как это работает?',
  howItWorksToggleClose: 'Скрыть подсказку',
  secretAdminActivatedToast: 'Секретный вход администратора активирован. Нажмите «Выйти», чтобы открыть окно ввода кода администратора.',
  secretAdminBackToDriverBtn: 'Вернуться ко входу водителя',
  sortNearestLabel: 'Ближайшие',
  sortBestNearbyLabel: 'Лучшие рядом',
  bestMatchBadge: 'Лучшая рядом',
  stationStatusOpen: 'Работает',
  stationStatusBusy: 'Высокая нагрузка',
  stationStatusMaint: 'Техобслуживание',
  queueLowLabel: 'Без очереди',
  queueMediumLabel: 'Средняя очередь',
  queueHighLabel: 'Большая очередь',
  geoFallbackCityNotice: 'Геолокация недоступна — расстояния рассчитаны от центра выбранного города',
  mapFallbackActiveNote: 'Включена встроенная интерактивная схема станций',
  carMatchOk: 'Подходит авто',
  carMatchNo: 'Нет топлива для авто',
  showcaseBackToApp: 'К заправке',
  creatorOperationalStatusLabel: 'Статус работы станции',
  creatorQueueLevelLabel: 'Загруженность и очередь',
  creatorFuelAvailabilityLabel: 'Доступность видов топлива',
  creatorFuelOn: 'Вкл',
  creatorFuelOff: 'Выкл',
  creatorDemoEventsTitle: 'Журнал событий и проверок',
  creatorDemoEventsEmpty: 'Событий пока нет — измените статус станции или проверьте код колонки',
  creatorSafetySandboxTitle: 'Проверка правил ТБ и кодов колонок',
  creatorSafetySandboxSub: 'Покажите жюри и родителям, как приложение подбирает топливо по модели авто, включает ТБ ПБ АГНКС для метана и проверяет 4-значный код колонки',
  creatorTestCarLabel: 'Тестовая модель авто',
  creatorTestFuelLabel: 'Выбираемое топливо',
  creatorTestBayLabel: 'Тестовая колонка',
  creatorTestCodeInputLabel: 'Введённый код с экрана',
  creatorRunCheckBtn: 'Проверить защиту и ТБ',
  creatorCheckPassed: 'Разрешено: код колонки совпал, топливо совместимо с авто',
  creatorCheckBlockedCode: 'Заблокировано: неверный код колонки (защита от чужой колонки)',
  creatorCheckBlockedFuel: 'Предупреждение: топливо не поддерживается данной моделью авто',
};

const UZ: TranslationBundle = {
  loadingTitle: 'dezagamiz',
  loadingSubtitle: 'Stansiyalar ulanmoqda va ruxsat tekshirilmoqda...',
  loadingReadySubtitle: "O'zbekiston stansiyalari va tariflari ulandi · Kirishga tayyor",
  loadingWaitBtn: 'Ilova yuklanmoqda...',
  enterAppBtn: "Ilovaga o'tish",
  splashFooterMeta: "AGTKSh va AYoQSh · Mashinadan chiqmasdan to'lov",
  enteringApp: 'dezagamiz ilovasiga kirilmoqda...',
  gateBadge: "Ro'yxatdan o'tish yoki 3 kunlik mehmon rejimi",
  heroEyebrow: "O'zbekiston bo'ylab AGTKSh va AYoQSh tarmog'i",
  heroTitle: "Mashinadan tushmasdan to'lang — zapravkachi o'zi keladi",
  heroSubtitle:
    "Issiqda, sovuqda mashinadan chiqish yoki kassada navbat kutish shart emas. dezagamiz stansiyasida kolonkani tanlang, karta orqali to'lang va operatorimiz gaz shlangini soniyalarda ulaydi.",
  heroImageAlt: 'Toshkentdagi dezagamiz yoqilg‘i quyish shoxobchasi',
  step1Label: '01-qadam',
  step1Title: "Avtoni ro'yxatga olish",
  step1Desc: "Operator mashinangizni davlat raqami orqali taniydi",
  step2Label: '02-qadam',
  step2Title: 'Kartani ulash',
  step2Desc: "Tezkor to'lov uchun Uzcard, Humo, Visa yoki Mastercard",
  step3Label: '03-qadam',
  step3Title: 'Gaz quyish',
  step3Desc: "To'lovdan so'ng zapravkachi o'zi kelib mashinani to'ldiradi",
  heroCities: 'Toshkent · Samarqand · Buxoro · Fargʻona',
  heroPriceFrom: "Metan 5 700 so'm/m³ dan",
  tabRegister: "Ro'yxat",
  tabLogin: 'Kirish',
  tabGuest: 'Mehmon (3 kun)',
  tabCreator: 'Yaratuvchi',
  stage1Of2: '1-bosqich / 2',
  stage2Of2: '2-bosqich / 2',
  driverAndCar: 'Haydovchi va avto',
  cardBinding: 'Karta ulash',
  fullNameLabel: 'Haydovchi ism va familiyasi',
  phoneLabel: "Telefon raqami (O'zbekiston)",
  carModelLabel: 'Avtomobil rusumi va modeli',
  plateNumberLabel: 'Davlat raqami',
  preferredFuelLabel: "Asosiy yoqilg'i turi",
  nextBindCard: 'Keyingi: kartani ulash',
  back: 'Orqaga',
  bindCardAndEnter: 'Kartani ulash va kirish',
  checkingCard: 'Karta tekshirilmoqda...',
  cardExpiryLabel: 'OO/YY',
  cardCvcLabel: 'CVC / Kod',
  cardHolderLabel: 'Kartadagi ism',
  cardPreviewLabel: "Ulangan to'lov kartasi",
  cardPreviewExpiryLabel: 'Muddat',
  loginTitle: "Ro'yxatdan o'tgan haydovchilar uchun kirish",
  loginSubtitle:
    "Avtomobilini ro'yxatdan o'tkazgan va bank kartasini ulagan haydovchilar kirishi mumkin.",
  loginButton: 'dezagamiz ga kirish',
  checkingAccount: 'Hisob tekshirilmoqda...',
  firstTimeHint: "Ilovada birinchi martamisiz? «Ro'yxat» bo'limiga o'ting",
  errEnterFullName: 'Ism va familiyangizni kiriting',
  errEnterUzPhone: "O'zbekiston telefon raqamini +998 XX XXX XX XX shaklida kiriting",
  errEnterCarModel: 'Avtomobil rusumi va modelini kiriting (masalan, Chevrolet Cobalt)',
  errEnterUzPlate: "To'g'ri davlat raqamini kiriting (masalan, 01 A 777 AA)",
  errCheckCardNumber: 'Bank kartasi raqamini tekshiring',
  errEnterCardExpiry: 'Kartaning amal qilish muddatini kiriting (OO/YY)',
  errEnterCardHolder: 'Karta egasining ismini kiriting',
  errEnterCardCvc: '3 xonali CVC/CVV kodini kiriting',
  errRegisterFailed: "Ro'yxatdan o'tishni yakunlab bo'lmadi",
  errLoginFailed: "Kirib bo'lmadi. Ro'yxatdan o'tish va kartani tekshiring.",
  errCreatorCodeInvalid: "Yaratuvchi kodi noto'g'ri",
  errChooseRoleFailed: 'Kirish rejimini tanlab bo‘lmadi',
  errSelectFreeBay: "Bo'sh kolonkani tanlang",
  errFuelNotOnBay: "Tanlangan yoqilg'i turi ushbu kolonkada yo'q",
  errMinFuelAmount: "Minimal quyish summasi — 10 000 so'm",
  errPersonalCardFrozen:
    "Shaxsiy dezagamiz kartasi muzlatilgan. Uni «Karta va avto» bo'limida faollashtiring.",
  errPersonalCardLowFunds:
    "Shaxsiy dezagamiz kartasida mablag' yetarli emas. «Karta va avto» bo'limida balansni to'ldiring.",
  errBindCardToPay: "To'lov uchun bank kartasini ulang",
  errPaymentFailed: "To'lovni amalga oshirib bo'lmadi",
  errSwitchCarFailed: 'Avtomobilni almashtirib bo‘lmadi',
  errAddCarFailed: "Avtoni qo'shib bo'lmadi",
  errSwitchCarProfileFailed: "Avtoni almashtirib bo'lmadi",
  errDeleteCarFailed: "Avtoni o'chirib bo'lmadi",
  errAddCardFailed: "Kartani qo'shib bo'lmadi",
  errSwitchCardFailed: "Kartani almashtirib bo'lmadi",
  errDeleteLastCard: "Yagona kartani o'chirib bo'lmaydi",
  errIssueCardFailed: "Kartani rasmiylashtirib bo'lmadi",
  errTopUpCheck: "To'ldirish summasini tekshiring",
  errTopUpMin: "Eng kam to'ldirish summasi — 10 000 so'm",
  errTopUpMax: "Bir martalik maksimal to'ldirish — 5 000 000 so'm",
  errCardDigits: 'Karta raqamining 16 raqamini kiriting',
  errCardNetwork: "Uzcard (8600), Humo (9860), Visa va Mastercard kartalari qo'llab-quvvatlanadi",
  errCardLuhn: "Karta nazorat raqami noto'g'ri",
  errTopUpFailed: "Kartani to'ldirib bo'lmadi",
  errCardDesignFailed: "Karta dizaynini yangilab bo'lmadi",
  errCardFreezeFailed: "Karta holatini o'zgartirib bo'lmadi",
  guestTitle: '3 kunlik mehmon rejimi',
  guestSubtitle:
    "Kartangizni ulamasdan turib ilovani sinab ko'ring. Mehmon rejimi qat'iy 3 kun (72 soat) amal qiladi, 3 kundan ortiq foydalanib bo'lmaydi.",
  guestRuleBadge: 'Cheklov: maksimal 3 kun',
  guestLimitItem1: "Barcha stansiyalar, O'zbekistonning haqiqiy narxlari va buyurtma ochiq.",
  guestLimitItem2: '3 kunlik taymer qurilmaga bogʻlanadi va uzaytirilmaydi.',
  guestLimitItem3: "3 kundan keyin davom etish uchun karta bilan ro'yxatdan o'tish kerak.",
  guestStartButton: '3 kunga mehmon sifatida kirish',
  guestStarting: 'Mehmon kirishi ochilmoqda...',
  guestExpiredNotice:
    "3 kunlik mehmon rejimi muddati tugadi. Ro'yxatdan o'tib karta ulang.",
  guestBannerLabel: 'Mehmon rejimi · qoldi',
  guestUpgradeButton: "Ro'yxatdan o'tish va karta ulash",
  creatorTitle: "Yaratuvchi bo'limiga kirish",
  creatorSubtitle:
    'Admin yoki oddiy foydalanuvchi rejimini tanlash uchun maxfiy parolni kiriting.',
  creatorCodeLabel: 'Yaratuvchi kodi',
  creatorCodePlaceholder: 'Maxfiy kodni kiriting',
  verifyPassword: 'Parolni tekshirish',
  verifyingPassword: 'Parol tekshirilmoqda...',
  passwordConfirmed: 'Parol tasdiqlandi',
  chooseRoleTitle: 'Kirish rejimini tanlang',
  chooseRoleSubtitle:
    "Stansiyalar va narxlarni boshqarish uchun Admin sifatida, yoki yoqilg'i quyish uchun Oddiy odam sifatida kiring.",
  roleAdminTitle: 'Admin',
  roleAdminDesc: 'Stansiya narxlari, kolonkalar, buyurtmalar va haydovchilarni boshqarish.',
  enterAsAdmin: 'Admin sifatida kirish',
  roleDriverTitle: 'Oddiy odam',
  roleDriverDesc: "Oddiy haydovchi rejimi: kolonka tanlash, karta bilan to'lash va quyish.",
  enterAsDriver: 'Oddiy odam sifatida kirish',
  creatorAccessBadge: 'Maxsus ruxsat · Kod tasdiqlangan',
  creatorPanelTitle: 'dezagamiz Yaratuvchi kabineti',
  creatorPanelSubtitle:
    "O'zbekiston bo'ylab gaz va benzin narxlari, kolonkalar hamda haydovchilar nazorati.",
  creatorDriverModeBadge: 'Rejim: Oddiy odam',
  creatorLockBtn: "Yaratuvchi bo'limini yopish",
  creatorExitBtn: 'Yaratuvchi kabinetidan chiqish',
  creatorLoadingMetrics: "dezagamiz tarmog'i ko'rsatkichlari yuklanmoqda...",
  creatorStatDrivers: 'Kartali haydovchilar',
  creatorStatOrders: 'Buyurtmalar',
  creatorStatActivePrefix: 'faol',
  creatorStatMethane: 'Metan berildi',
  creatorStatRevenue: 'Tarmoq aylanmasi',
  creatorStationManageEyebrow: 'Stansiya boshqaruvi',
  creatorStationManageTitle: 'Tariflar va kolonkalar',
  creatorSelectStationLabel: 'Stansiyani tanlang',
  creatorPricesLabel: 'Narxlar (m³ / l uchun)',
  creatorBaysStatusLabel: 'Stansiyadagi kolonkalar holati',
  creatorApplyStationBtn: "O'zgarishlarni qo'llash",
  creatorSavingStationBtn: 'Saqlanmoqda...',
  creatorStationUpdatedMsg: "Tariflar va kolonkalar holati barcha haydovchilar uchun yangilandi",
  creatorOrdersTitle: 'Zapravka buyurtmalari',
  creatorOrdersEmpty:
    "Hozircha buyurtmalar yo'q. Haydovchi salondan to'lov qilgach buyurtma shu yerda ko'rinadi.",
  creatorColReceiptCar: 'Chek / Avto',
  creatorColStationBay: 'Stansiya / Kol.',
  creatorColAmount: 'Summa',
  creatorColStatus: 'Holat',
  creatorColControl: 'Boshqaruv',
  creatorStagePaid: "To'landi",
  creatorStageApproaching: 'Zapravkachi kelmoqda',
  creatorStageFueling: 'Quyish ketmoqda',
  creatorStageCompleted: 'Yakunlandi',
  creatorNextStageBtn: 'Keyingi bosqich',
  creatorDoneLabel: 'Tayyor',
  creatorDriversTitle: "Ro'yxatdan o'tgan haydovchilar",
  creatorDriversEmpty: "Hozircha karta ulagan haydovchilar yo'q.",
  creatorColDriver: 'Haydovchi',
  creatorColPhone: 'Telefon',
  creatorColCarPlate: 'Avto va raqam',
  creatorColLinkedCard: 'Ulangan karta',
  navFuel: 'Zapravka',
  navStations: 'Stansiyalar',
  navAssistant: 'Yordamchi',
  navHistory: 'Tarix',
  navCards: 'Karta va avto',
  navCardsShort: 'Karta',
  navCreator: 'Yaratuvchi',
  navAdminPanel: 'Admin paneli',
  navAdminShort: 'Admin',
  navDriverShort: 'Haydovchi',
  switchToDriver: 'Oddiy odam',
  switchToAdmin: 'Admin',
  logout: 'Chiqish',
  fuelTitle: 'Mashinadan chiqmasdan zapravka',
  fuelSubtitle:
    "Ulangan kartadan kerakli summani to'lang — dezagamiz operatori kolonka yoniga o'zi kelib quyadi.",
  yourCar: 'Sizning avtomobilingiz',
  selectStationStep: "1. O'zbekistondagi zapravka stansiyasi",
  selectBayStep: "2. Siz to'xtagan kolonka raqami",
  freeBaysCount: "Bo'sh",
  selectFuelStep: '3. Kolonkadagi gaz yoki benzin turi',
  amountStep: "4. To'lov summasi",
  fullTank: "To'liq ballon",
  payWithCardLabel: "Ulangan karta orqali to'lov",
  cardsCountLabel: 'Kartalar',
  payFromCarBtn: "Mashinadan to'lash",
  processingPayment: "To'lov amalga oshirilmoqda...",
  howItWorksTitle: 'Zapravka qanday kechadi',
  howStep1: "Siz oynalarni yopgan holda salonda qolasiz va kerakli summani to'laysiz.",
  howStep2Prefix: 'Kolonkadagi navbatchi zapravkachi',
  howStep3: "Operator keladi, gaz shlangini ulaydi va belgilangan hajmgacha to'ldiradi.",
  driverProfileActive: 'Haydovchi profili faol',
  cardVerifiedText: "Karta orqali xavfsiz to'lov tasdiqlangan",
  bayFree: "Bo'sh",
  bayBusy: 'Band',
  bayShortLabel: 'Kolonka №',
  notAtBay: 'TRKda yoʻq',
  open24h: 'Tun-u kun 24/7',
  distanceKmUnit: 'km',
  trackerStage1Title: "To'lov o'tdi",
  trackerStage1Sub: "Mablag' yechildi, buyurtma kolonkaga yuborildi",
  trackerStage2Title: 'Zapravkachi kelmoqda',
  trackerStage2Sub: 'Operator avtomobilingiz tomonga yurmoqda',
  trackerStage3Title: 'Gaz quyilmoqda',
  trackerStage3Sub: 'Shlang ulangan, salonda qoling',
  trackerStage4Title: 'Zapravka yakunlandi',
  trackerStage4Sub: 'Qopqoq yopildi, xotirjam ketishingiz mumkin',
  trackerHeadlinePaid: "To'lov tasdiqlandi",
  trackerHeadlineApproaching: 'Zapravkachi mashinangizga yaqinlashmoqda',
  trackerHeadlineFuelingPrefix: 'Quyish jarayoni:',
  trackerHeadlineCompleted: 'Zapravka muvaffaqiyatli yakunlandi',
  trackerDescPaid: "Mashinadan tushmang — bo'sh zapravkachi buyurtmangizni qabul qildi.",
  trackerDescApproachingSuffix: 'avtomobilingiz tomonga kelmoqda:',
  trackerDescFuelingMid: 'Quyish shlangi kolonkaga ulangan',
  trackerDescCompleted: 'Shlang ajratildi, klapan yopildi. Elektron chek tarixga saqlandi.',
  trackerTariffLabel: 'Tarif',
  trackerVolumeFilledLabel: 'Quyilgan hajm',
  trackerGoalLabel: 'Maqsad',
  trackerPaidFromCardLabel: 'Kartadan toʻlandi',
  trackerStatusLabel: 'Jarayon holati',
  trackerStatusPaid: 'Kolonkaga uzatildi',
  trackerStatusEtaPrefix: 'Taxminan ~',
  trackerStatusEtaSec: 'soniyada keladi',
  trackerStatusFuelingPrefix: 'Gaz uzatilmoqda',
  trackerStatusDone: 'Zapravka 100%',
  trackerStayInsideHint: "Oynalarni ochish shart emas — operator avto rusumi va raqamini ko'radi",
  trackerBtnAtCar: 'Operator mashina yonida',
  trackerBtnStartFuel: 'Gaz quyishni boshlash',
  trackerBtnFinishFuel: 'Zapravkani yakunlash',
  trackerRateLabel: 'Zapravkachi ishini baholang',
  trackerRateAriaPrefix: 'Baho',
  trackerNewOrderBtn: 'Yangi zapravka',
  trackerAttendantCardTitle: 'Smenadagi zapravkachingiz',
  trackerExperiencePrefix: 'Tajriba',
  trackerExperienceUnit: 'yil',
  trackerUniformLabel: "Ko'k dezagamiz formasi",
  trackerRolePaid: 'Buyurtmangiz signalini oldi',
  trackerRoleApproaching: 'Gaz shlangi bilan kolonka tomonga kelmoqda',
  trackerRoleFueling: 'Belgilangan hajmgacha quyishni nazorat qilmoqda',
  trackerRoleCompleted: 'Avtomobil qopqog‘ini yopdi',
  trackerCarVerifyPrefix: 'Kolonkada tekshirish uchun avtomobilingiz uzatildi:',
  trackerPaymentDetailsTitle: "To'lov tafsilotlari",
  trackerDetailStation: 'Stansiya',
  trackerDetailBay: 'Kolonka',
  trackerDetailFuel: "Yoqilg'i",
  trackerDetailCard: 'Karta',
  trackerDetailCashback: 'dezagamiz keshbeki',
  trackerDetailTotal: "Jami to'landi",
  stationsTitle: 'Yaqin dezagamiz stansiyalari va marshrutlar',
  stationsSubtitle:
    "Kerakli yoqilg'i turini (masalan, propan) tanlang — ilova aniq koordinatalar bilan eng yaqin stansiyagacha yo'l ko'rsatadi.",
  allCities: 'Barcha shaharlar',
  allFuels: 'Barcha turlar',
  goToFueling: "Zapravkaga o'tish",
  chooseStation: "Yo'nalish tuzish va tanlash",
  attendantLabel: 'Operator',
  fuelFilterLabel: "Kerakli yoqilg'ini tanlang",
  useMyGps: 'Mening joylashuvim (GPS)',
  locatingGps: 'GPS aniqlanmoqda...',
  driverLocationLabel: "Boshlang'ich nuqta",
  searchOriginPlaceholder: "O'zbekistondagi ko'cha yoki tumanni kiriting...",
  nearestRouteTitle: 'Eng yaqin stansiyagacha tavsiya etilgan marshrut',
  nearestFuelBadge: 'Eng yaqin',
  coordinatesLabel: 'Aniq koordinatalar',
  routeDistanceLabel: 'Masofa',
  routeEtaLabel: "Yo'l vaqti",
  routeBuilding: "Marshrut tuzilmoqda...",
  refuelHereBtn: 'Shu yerda quyish',
  openGoogleMapsBtn: 'Google Xaritada ochish',
  routeStepsTitle: "Yo'nalish ko'rsatmalari",
  findNearestOnMapBtn: 'Xaritada eng yaqinini topish',
  nearestStationRank: 'Eng yaqin',
  gpsPermissionDenied: 'GPS ruxsati berilmadi. Tuman yoki manzilni tanlang.',
  resolvingCoords: 'Google Maps orqali aniq koordinatalar aniqlanmoqda...',
  noStationForFuel: "Tanlangan yoqilg'i turi bo'yicha stansiya topilmadi.",
  youAreHere: 'Siz shu yerdasiz',
  liveGpsOn: 'Jonli GPS (real vaqtda)',
  liveGpsActive: 'Joylashuv real vaqtda yangilanmoqda',
  stopLiveGps: "GPSni to'xtatish",
  nearbyPlacesTitle: 'Atrofdagi barcha yaqin joylar',
  nearbyPlacesLoading: 'Atrofingizdagi barcha yaqin joylar qidirilmoqda...',
  nearbyPlacesEmpty: '3 km radiusda qoʻshimcha joylar topilmadi.',
  nearbyAll: 'Barcha joylar',
  nearbyGas: 'Yoqilgʻi AYoQSh',
  nearbyFood: 'Kafe va ovqat',
  nearbyStore: "Do'konlar",
  nearbyService: 'Avtoservis',
  showRouteMapBtn: "Marshrut xaritasini ko'rsatish",
  hideRouteMapBtn: 'Xaritani yashirish',
  expandMapBtn: 'Xaritani kattalashtirish',
  collapseMapBtn: 'Oddiy oʻlcham',
  liveRouteModeTitle: 'Marshrut xaritasi va real vaqtda joylashuv',
  openPlaceOnMap: "Xaritada ko'rsatish",
  locationAccessTitle: 'Yaqin zapravkalarni qayerdan qidirish',
  locationModeMyLocation: 'Mening joylashuvim',
  locationModeCity: 'Shaharni tanlash',
  locationGrantBtn: 'Joylashuvga ruxsat berish',
  locationGrantedBadge: 'Joylashuvga ruxsat berilgan',
  locationBlockedHint:
    "Brauzerda joylashuvga ruxsat bloklangan. Sayt sozlamalaridan ruxsat bering yoki quyidan shaharni tanlang.",
  nearestStationsSectionTitle: 'Eng yaqin zapravkalar',
  nearestFromMyGps: 'Joylashuvingiz yaqinida',
  nearestInCityPrefix: 'Shahardagi eng yaqinlar',
  mapLoadFailedNotice:
    "Interaktiv xarita vaqtincha yuklanmadi (tarmoq yoki Google Maps skripti cheklangan). Eng yaqin stansiyalarni tanlash ishlayapti yoki marshrutni Google Xaritada oching.",
  retryMapBtn: 'Xaritani qayta yuklash',
  mapLayerRoadmap: 'Xarita',
  mapLayerSatellite: 'Sunʼiy yoʻldosh',
  mapSatelliteLabels: 'Yozuvlar',
  mapView360Btn: '360° Panorama',
  mapExit360Btn: 'Xaritaga qaytish',
  streetViewOpenExternal: 'Google Xaritada 360° ochish',
  streetViewDragHint: '360° koʻrish uchun ekranni suring',
  streetViewSatelliteOrbitLabel: 'Stansiyaning 360° sunʼiy yoʻldosh koʻrinishi',
  streetViewStreetModeLabel: '360° Google koʻcha panoramasi',
  streetViewUnavailableHint:
    'Bu manzilda Google koʻcha surati yoʻq — 360° sunʼiy yoʻldosh panoramasi ochildi',
  streetViewLoading: '360° panorama yuklanmoqda...',
  pegmanAriaLabel: '360° koʻrish (sariq odamchani xaritaga sudrab tashlang)',
  pegmanDragTooltip: '360° uchun xaritaga sudrang yoki bosing',
  pegmanDropAction: '360° koʻrish uchun qoʻyib yuboring',
  pegmanDroppedPointLabel: 'Xaritadagi 360° nuqta',
  gpsSignalTimeout: 'GPS signali kutilmoqda — sunʼiy yoʻldosh izlanmoqda...',
  gpsSignalUnavailable: 'GPS signali vaqtincha mavjud emas — qayta urinilmoqda...',
  mapFollowDriverBtn: 'Kuzatish',
  mapFollowingDriver: 'Jonli kuzatuv',
  liveTelemetryUpdated: 'Yangilandi',
  districtTashkentCenter: 'Toshkent · Markaz',
  districtChilonzor: 'Chilonzor',
  districtYunusobod: 'Yunusobod',
  districtSergeli: 'Sergeli',
  historyTitle: 'Zapravkalar tarixi va cheklar',
  historySubtitle:
    "Ulangan kartadan barcha to'lovlar va avtomobilingizga xizmat ko'rsatgan zapravkachilar.",
  totalOrders: 'Jami zapravkalar',
  totalMethane: 'Quyildi metan',
  totalPaid: "Jami to'landi",
  noOrdersTitle: "Hali zapravkalar bo'lmagan",
  noOrdersSubtitle:
    "Mashinadan birinchi to'lovdan so'ng bu yerda elektron chek va operator ismi paydo bo'ladi.",
  receiptTitle: 'dezagamiz elektron cheki',
  receiptBtn: 'Chek',
  historyColReceiptDate: 'Chek / Sana',
  historyColStationBay: 'Stansiya va kolonka',
  historyColFuel: "Yoqilg'i",
  historyColVolume: 'Hajm',
  historyColAmount: 'Summa',
  historyColAttendant: 'Operator',
  historyColAction: 'Amal',
  historyCloseReceiptAria: 'Chekni yopish',
  historyDetailCar: 'Avtomobil',
  historyDetailBayFuel: "Kolonka va yoqilg'i",
  historyDetailAttendant: 'Zapravkachi',
  historyDetailCardPay: "Karta orqali to'lov",
  historyDetailTotalCharged: 'Jami yechildi',
  linkedCardsTitle: 'Ulangan kartalar',
  linkedCardsSubtitle:
    "Doimiy kirish va to'lov uchun kamida bitta faol karta ulangan bo'lishi shart.",
  addCardBtn: "Karta qo'shish",
  hideForm: 'Yashirish',
  primaryCard: 'Asosiy',
  makePrimary: 'Asosiy qilish',
  saveCarData: "Avto ma'lumotlarini saqlash",
  myVehiclesTitle: 'Mening avtomobillarim',
  addNewCarBtn: "Yangi mashina qo'shish",
  newCarModelLabel: 'Yangi avto rusumi va modeli',
  newCarPlateLabel: 'Yangi davlat raqami',
  saveNewCarBtn: "Avtoni profilga qo'shish",
  activeCarBadge: 'Joriy avto',
  selectCarBtn: 'Tanlash',
  deleteCarLabel: "Avtoni o'chirish",
  carAddedSuccess: "Yangi avtomobil qo'shildi va asosiy qilib tanlandi",
  profileUpdatedSuccess: "Avtomobil va profil ma'lumotlari yangilandi",
  profileSaveBtnError: 'Saqlashda xatolik',
  profileNewCardNumberLabel: 'Yangi karta raqami',
  profileBindNewCardBtn: 'Yangi kartani ulash',
  profileExpiryPrefix: 'Muddat',
  profileDeleteCardAriaPrefix: "Kartani o'chirish",
  profileAttendantSectionEyebrow: "Zapravkachi uchun ma'lumot",
  profileDriverCarTitle: 'Haydovchi va avtomobil',
  profileAttendantCarHint: 'Stansiyadagi operator mashinangiz rusumi va davlat raqamiga qarab topadi.',
  profileAccountPhoneLabel: 'Hisob telefoni',
  profileDriverNameLabel: 'Haydovchi ismi',
  personalCardEyebrow: "Haydovchining maxsus yoqilg'i kartasi",
  personalCardTitle: 'Shaxsiy dezagamiz kartasi',
  personalCardSubtitle:
    "dezagamiz uslubida tezkor rasmiylashtirish: gaz va benzin uchun komissiyasiz to'lov va 5% gacha bonus keshbek.",
  personalCardCta: 'dezagamiz kartasini rasmiylashtirish',
  personalCardIssuing: 'Karta chiqarilmoqda...',
  personalCardTierLabel: 'Karta tarifi',
  personalCardTierStandard: 'Standart',
  personalCardTierStandardDesc: "Chiqarish 0 so'm · 3% bonus keshbek",
  personalCardTierPrime: 'Prime',
  personalCardTierPrimeDesc: "Chiqarish 0 so'm · 5% keshbek + ustuvorlik",
  personalCardStyleLabel: 'Karta dizayni',
  personalCardStyleCobalt: 'Moviy flagman',
  personalCardStyleArctic: 'Oq xrom',
  personalCardStyleNight: 'Tungi Toshkent',
  personalCardInitialTopUp: "Kartadan boshlang'ich to'ldirish",
  personalCardBalanceLabel: 'Karta balansi',
  personalCardBonusLabel: 'Keshbek bonuslari',
  personalCardCashbackLabel: 'Keshbek',
  personalCardTopUpBtn: "Balansni to'ldirish",
  personalCardTopUpConfirm: "Kartaga o'tkazish",
  personalCardFreezeBtn: 'Muzlatish',
  personalCardUnfreezeBtn: 'Faollashtirish',
  personalCardFrozenBadge: 'Muzlatilgan',
  personalCardActiveBadge: 'Faol',
  personalCardShowNumber: "Raqamni ko'rsatish",
  personalCardHideNumber: 'Raqamni yashirish',
  personalCardPayOption: 'Shaxsiy dezagamiz kartasi',
  personalCardIssuedSuccess: "Shaxsiy dezagamiz kartasi rasmiylashtirildi va to'lovga tayyor!",
  personalCardTopUpSuccess: "Shaxsiy dezagamiz kartasi balansi to'ldirildi",
  personalCardIssuePromptLink: 'Shaxsiy dezagamiz kartasini ochish (5% gacha keshbek)',
  themeLight: "Yorug'",
  themeDark: "Qorong'i",
  themeSwitchAria: "Yorug' va qorong'i mavzuni almashtirish",
  assistantTitle: 'Shaxsiy Gemini AI-yordamchi',
  assistantSubtitle: 'AGTKSh yo‘nalishlari · Yoqilg‘i hisobi · Yo‘l musiqasi',
  assistantWelcome:
    'Salom! Men dezagamiz ning Gemini asosidagi shaxsiy yordamchisiman. Eng yaqin gaz quyish shoxobchasini topaman, xarajatingizni hisoblayman yoki yo‘l uchun shaxsiy kuy yaratib beraman.',
  assistantPlaceholder: 'Zapravka, marshrut yoki shaxsiy kuy haqida yozing...',
  assistantSendBtn: 'Yuborish',
  assistantThinking: 'Gemini javob tayyorlamoqda...',
  assistantClearBtn: 'Tozalash',
  assistantActionOpenStation: 'Tanlangan stansiyaga o‘tish',
  assistantActionPlayMelody: 'Yaratilgan kuyni tinglash',
  assistantPrompt1: "Hozir qaysi metan AGTKSh bo'sh va eng yaqin?",
  assistantPrompt2: "120 000 so'mga necha m³ metan chiqishini hisobla.",
  assistantPrompt3: 'Toshkentda tungi sayohat uchun sokin kuy yaratib ber.',
  assistantPrompt4: "Yumshoq zapravka signalini o'rnatib musiqani yoq.",
  musicStudioTitle: 'Shaxsiy musiqa va kuylar',
  musicStudioSubtitle: 'Audio fayllar · Gemini kuylari · Zapravka signali',
  musicTabTracks: 'Mening treklarim',
  musicTabComposeAi: 'Gemini bilan yaratish',
  musicTabCustom: 'Fayl / Notalar',
  musicPlayBtn: 'Ijro etish',
  musicPauseBtn: 'Pauza',
  musicNextBtn: 'Keyingi',
  musicLoopLabel: 'Takror',
  musicVolumeLabel: 'Ovoz',
  musicDownloadWavBtn: 'WAV yuklab olish',
  musicChimeActiveLabel: 'Zapravka signali',
  musicSetChimeBtn: 'Signal qilish',
  musicAutoPlayFuelLabel: 'Zapravkada kuyni chalish',
  musicUploadTitle: 'Shaxsiy trek yoki kuy yuklash',
  musicUploadHint: 'MP3, WAV, OGG yoki M4A (5 MB gacha) · profilingizda saqlanadi',
  musicUploadBtn: 'Audio fayl tanlash',
  musicUploading: 'Yuklanmoqda...',
  musicComposePromptLabel: 'Kuy kayfiyati yoki uslubi',
  musicComposePromptPlaceholder: 'Masalan: Toshkent kechasi uchun sokin lo-fi kuy',
  musicComposeBpmLabel: 'Temp (BPM)',
  musicComposePresetLabel: 'Asbob',
  musicComposeBtn: 'Gemini da kuy yaratish',
  musicComposing: 'Gemini kuy yaratmoqda...',
  musicSequencerTitle: 'Shaxsiy kuy muharriri (16 qadam)',
  musicSequencerHint: 'Notalarni bosing va kuyni profilingizga saqlang',
  musicSaveCustomBtn: 'Kuyni saqlash',
  musicCustomTitlePlaceholder: 'Kuy nomi',
  musicQuickCardTitle: 'Shaxsiy musiqa va Gemini yordamchi',
  musicOpenStudioBtn: 'Yordamchi va musiqani ochish',
  musicPresetRhodes: 'Rhodes',
  musicPresetWarmPad: 'Iliq ped',
  musicPresetPluck: 'Chertma',
  musicPresetChime: 'Qo‘ng‘iroqcha',
  musicPresetBass: 'Bas-gruv',
  musicMood1: 'Tungi Toshkent · yo‘l uchun mayin lo-fi',
  musicMood2: 'Trassada tetik tonggi ritm',
  musicMood3: 'Sharqona tong · yengil cholg‘u kuyi',
  musicMood4: 'Zapravka yakunlangani haqida mayin signal',
  musicSourceGemini: 'Gemini AI',
  musicSourceFile: 'Fayl',
  musicSourceCustom: 'Shaxsiy kuy',
  musicSourcePreset: 'Preset',
  musicDeleteTrackAria: "Trekni o'chirish",
  musicComposeSuccessPrefix: '«',
  musicComposeSuccessSuffix: '» kuyi yaratildi va kutubxonaga qo‘shildi.',
  musicUploadSuccessPrefix: '«',
  musicUploadSuccessSuffix: '» treki profilingizga yuklandi.',
  musicCustomSavedPrefix: '«',
  musicCustomSavedSuffix: '» kuyi saqlandi va ijro etilmoqda.',
  musicSelectAtLeastOneNote: 'Setkada kamida bitta notani belgilang.',
  musicPreset1Title: 'Toshkent · Tungi sayohat',
  musicPreset1Sub: 'Mayin Rhodes · Yo‘l uchun lo-fi muhit',
  musicPreset2Title: 'Samarqand · Tong',
  musicPreset2Sub: 'Chertma sintez · Yengil sharqona ohang',
  musicPreset3Title: 'dezagamiz zapravka signali',
  musicPreset3Sub: 'Kolonka tayyorligi haqida toza billur qo‘ng‘iroq',
  assistantPromptGreeting: "Salom! Kerakli bo'limni tavsiya qil",
  assistantActionGoTo: "Bo'limga o'tish:",
  assistantActionThemeDark: "Qorong'i mavzu yoqildi",
  assistantActionThemeLight: "Yorug' mavzu yoqildi",
  assistantActionThemeToggled: 'Mavzu almashtirildi',
  assistantActionLangChanged: "Til o'zgartirildi",
  assistantActionGpsOn: 'Live GPS yoqildi',
  assistantActionGpsOff: "Live GPS o'chirildi",
  assistantErrReply: 'Gemini dan javob olib bo‘lmadi.',
  musicDefaultComposePrompt: 'Shahar bo‘ylab sayohat uchun sokin tungi lo-fi ritmi',
  musicDefaultCustomTitle: 'Mening yo‘l kuyim',
  musicPreviewDefaultTitle: 'Oldindan tinglash',
  musicCustomFallbackTitle: 'Mening kuyim',
  musicComposeFailedErr: 'Gemini da kuy yaratishda xatolik.',
  musicUploadFailedErr: 'Faylni yuklab bo‘lmadi.',
  musicSaveCustomFailedErr: 'Kuyni saqlab bo‘lmadi.',
  musicPlaybackAudioErr: 'Audio faylni ijro etib bo‘lmadi.',
  musicPlaybackBlockedErr: 'Brauzerda ovozni yoqish uchun Play tugmasini bosing.',
  musicFileTooLargeErr: 'Audio faylning maksimal hajmi — 5 MB.',
  musicFileReadErr: 'Faylni o‘qib bo‘lmadi',
  musicUploadTrackFallback: 'Mening trekim',
  creatorShowCodeAria: "Kodni ko'rsatish",
  creatorHideCodeAria: 'Kodni yashirish',
  sampleFullNamePlaceholder: 'Azizbek Karimov',
  sampleCardHolderPlaceholder: 'AZIZBEK KARIMOV',
  personalCardDriverFallback: 'HAYDOVCHI KARTASI',
  meterUnit: 'm',
  languageSelectorAria: 'Ilova tilini tanlash',
  creatorLoadErr: "Yaratuvchi panelini yuklab bo'lmadi",
  creatorLockErr: "Yaratuvchi bo'limini qulflab bo'lmadi",
  creatorUpdateStationErr: "Stansiyani yangilashda xatolik",
  creatorAdvanceOrderErr: "Buyurtma holatini o'zgartirib bo'lmadi",
  driverMarkerSelf: 'Men',
  closeAria: 'Yopish',
  zoomInAria: 'Yaqinlashtirish',
  zoomOutAria: 'Uzoqlashtirish',
  entryModeAria: 'Kirish rejimi',
  primaryNavAria: 'Asosiy navigatsiya',
  mobileNavAria: 'Mobil navigatsiya',
  rotateLeftAria: 'Chapga 45° burish',
  rotateRightAria: "O'ngga 45° burish",
  fuelMetan: 'Metan',
  fuelPropan: 'Propan',
  fuelAi92: 'AI-92',
  fuelAi95: 'AI-95',
  fuelMetanFull: 'Metan (CNG)',
  fuelPropanFull: 'Propan (LPG)',
  fuelAi92Full: 'Benzin AI-92',
  fuelAi95Full: 'Benzin AI-95',
  pressure200Bar: '200 bar',
  pressure16Bar: '16 bar',
  currencyUzs: "so'm",
  unitM3: 'm³',
  unitLiter: 'l',
  musicPreset4Title: 'Registon · Trassa drayvi',
  musicPreset4Sub: "Yo'l uchun boy bas va yoqimli sint-ohang",
  navShowcase: 'Taqdimot',
  navShowcaseShort: 'Taqdimot',
  openShowcaseBtn: 'Taqdimot va loyiha himoyasi',
  launchJuryDemoBtn: 'Jonli ilovani ochish (Demo)',
  showcaseBackToGate: 'Kirishga qaytish',
  showcaseTitle: 'Tanlov taqdimoti va himoyasi',
  showcaseSubtitle: "Sahna slaydlari, ota-onalar va hakamlar savollariga javoblar, tejam va oddiy daromad kalkulyatorlari",
  showcaseProjectorModeOn: 'Proyektor (shpargalkasiz)',
  showcaseSpeakerNotesOn: 'Spiker eslatmasi',
  showcaseSpeakerCueLabel: 'Tinglovchilarga ayting:',
  showcaseTimerLabel: 'Taqdimot taymeri',
  showcaseTimerStart: 'Boshlash',
  showcaseTimerPause: 'Pauza',
  showcaseTimerReset: 'Nolga',
  showcaseTarget3Min: 'Maqsad: 3:00',
  showcaseTabSlides: 'Slaydlar',
  showcaseTabSavings: 'Oila tejami',
  showcaseTabDefense: 'Savollarga himoya',
  showcaseTabMonetization: 'Pul ishlash',
  showcaseTabChecklist: 'Sahna rejasi',
  showcasePrevSlide: 'Oldingi',
  showcaseNextSlide: 'Keyingi slayd',
  showcaseShowLiveBtn: "Jonli ko'rsatish",
  showcaseQuizModeBtn: '30s mashq',
  showcaseQuizNextBtn: 'Keyingi savol',
  showcaseQuizRevealBtn: "Javobni ko'rish",
  showcaseQuizHideBtn: 'Javobni yashirish',
  showcaseQuizTimerLabel: 'Javob uchun',
  showcaseFilterAll: 'Barchasi',
  showcaseFilterParents: 'Ota-onalar',
  showcaseFilterJury: 'Hakamlar',
  showcaseFilterBusiness: 'Biznes / Pul',
  showcaseSavingsTitle: 'Oila yoqilgʻi tejami kalkulyatori',
  showcaseSavingsSubtitle: 'Metan + dezagamiz Prime 5% keshbek va AI-92 benzin xarajatlari taqqoslanishi',
  showcaseMonthlyKmLabel: 'Oylik yurish masofasi',
  showcaseConsumptionLabel: "100 km uchun o'rtacha sarf",
  showcaseOutMonthlySavings: 'Oylik tejam',
  showcaseOutYearlySavings: 'Yillik yoqilgʻi tejami',
  showcaseOutPrimeCashback: 'Yillik 5% keshbek (Prime)',
  showcaseOutTotalBenefit: 'Oila uchun yillik jami foyda',
  showcaseOutCo2Saved: 'Yillik kamaytirilgan CO₂',
  showcaseOutTimeSaved: 'Navbatsiz tejalgan vaqt',
  unitKgShort: 'kg',
  unitHourShort: 'soat',
  unitMinShort: 'daq',
  showcaseMonetizeTitle: 'Ilovadan hoziroq oddiy pul ishlash',
  showcaseMonetizeSubtitle: 'Bank litsenziyasisiz 4 ta oson yoʻl va jonli daromad hisobi',
  showcaseStationsCountLabel: 'Ulangan xususiy AGTKSh/AYoQShlar',
  showcaseCarsPerDayLabel: '1 stansiyada kuniga ilova orqali mashina',
  showcaseOutMonthlyOrders: 'Oylik buyurtmalar',
  showcaseOutSubIncome: "Obuna to'lovlari (200 ming/oy)",
  showcaseOutFeeIncome: "Hamkorlik haqi (700 so'm/chek)",
  showcaseOutAdIncome: 'Xaritadagi kafe va moyka reklamasi',
  showcaseOutMonthlyRevenue: 'Oylik daromad prognozi',
  showcaseOutYearlyRevenue: 'Yillik daromad prognozi',
  showcaseChecklistTitle: 'Sahnada ideal koʻrsatish rejasi',
  showcaseChecklistSubtitle: 'Chiqish davomida qadamlarni belgilab boring',
  showcaseChecklistProgress: 'Bajarilgan qadamlar',
  safetyMetanRule: 'Kassaga navbatsiz onlayn toʻlang. Diqqat: metan quyishda xavfsizlik qoidalariga koʻra salondan chiqish va kapotni ochish shart.',
  safetyStayInCarNote: '«Mashinadan chiqmasdan» rejimi — zapravkachini salonda kuting',
  trackerExitForMetanHint: 'AGNXS xavfsizlik qoidalariga koʻra metan quyishda salondan chiqing va kapotni oching',
  carSupportedFuelsLabel: 'Avto uchun mos yoqilgʻi',
  carFuelAutoSelected: 'Avtomobilingiz modeli uchun mos yoqilgʻi tanlandi',
  carNoGboHybridWarn: 'Ushbu model (GBOsiz gibrid/benzin) faqat AI-92 va AI-95 bilan ishlaydi. Metan va Propan qoʻllab-quvvatlanmaydi.',
  carEvOnlyWarn: 'Elektromobil tanlangan: gaz va benzin quyish mos kelmaydi. Garajdan boshqa avtomobil tanlang yoki quvvatlash stansiyasidan foydalaning.',
  bayCodeTitle: 'Boshqa kolonkaga adashib toʻlashdan himoya',
  bayCodeLabel: 'Kolonka ekranidagi tasdiqlash kodi',
  bayCodePlaceholder: 'Ekrandagi 4 ta raqam',
  bayCodeAutofillBtn: 'Demo-kodni kiritish',
  bayCodeScanQrBtn: 'Kolonkadagi QR ni skanerlash',
  bayCodeScanningQr: 'Kolonka QR kodi skanerlanmoqda...',
  bayCodeVerifiedBadge: 'Kolonka tasdiqlandi',
  bayCodeDemoHintPrefix: 'Kolonka tablosidagi kod',
  errBayCodeMismatch: 'Tanlangan kolonka ekranidagi toʻgʻri 4 xonali kodni kiriting yoki QR-kodni skanerlang',
  compactLocationTitle: 'Shahar va eng yaqin AYoQSh',
  howItWorksToggleOpen: 'Bu qanday ishlaydi?',
  howItWorksToggleClose: 'Koʻrsatmani yashirish',
  secretAdminActivatedToast: 'Maxfiy administrator kirishi faollashtirildi. Administrator kodini kiritish oynasini ochish uchun «Chiqish» tugmasini bosing.',
  secretAdminBackToDriverBtn: 'Haydovchi kirishiga qaytish',
  sortNearestLabel: 'Eng yaqin',
  sortBestNearbyLabel: 'Eng yaxshi yaqin',
  bestMatchBadge: 'Eng qulay',
  stationStatusOpen: 'Ishlamoqda',
  stationStatusBusy: 'Bandlik yuqori',
  stationStatusMaint: 'Texnik xizmat',
  queueLowLabel: 'Navbatsiz',
  queueMediumLabel: 'Oʻrtacha navbat',
  queueHighLabel: 'Katta navbat',
  geoFallbackCityNotice: 'Geolokatsiya mavjud emas — masofalar tanlangan shahar markazidan hisoblandi',
  mapFallbackActiveNote: 'Ichki interaktiv stansiyalar xaritasi faol',
  carMatchOk: 'Avtoga mos',
  carMatchNo: 'Mos yoqilgʻi yoʻq',
  showcaseBackToApp: 'Zapravkaga qaytish',
  creatorOperationalStatusLabel: 'Stansiya ish holati',
  creatorQueueLevelLabel: 'Yuklama va navbat darajasi',
  creatorFuelAvailabilityLabel: 'Yoqilgʻi turlari mavjudligi',
  creatorFuelOn: 'Yoqilgan',
  creatorFuelOff: 'Oʻchirilgan',
  creatorDemoEventsTitle: 'Hodisalar va tekshiruvlar jurnali',
  creatorDemoEventsEmpty: 'Hozircha hodisalar yoʻq — stansiya holatini oʻzgartiring yoki kolonka kodini tekshiring',
  creatorSafetySandboxTitle: 'Xavfsizlik qoidalari va kolonka kodlarini tekshirish',
  creatorSafetySandboxSub: 'Juri va ota-onalarga ilova avtomobil modeliga qarab yoqilgʻi tanlashi, metan uchun AGNXS xavfsizlik qoidasini koʻrsatishi va 4 xonali kolonka kodini tekshirishini namoyish eting',
  creatorTestCarLabel: 'Sinov avtomobil modeli',
  creatorTestFuelLabel: 'Tanlangan yoqilgʻi',
  creatorTestBayLabel: 'Sinov kolonkasi',
  creatorTestCodeInputLabel: 'Ekrandan kiritilgan kod',
  creatorRunCheckBtn: 'Himoya va xavfsizlikni tekshirish',
  creatorCheckPassed: 'Ruxsat etildi: kolonka kodi mos keldi, yoqilgʻi avtomobilga mos',
  creatorCheckBlockedCode: 'Bloklandi: kolonka kodi notoʻgʻri (boshqa kolonkaga toʻlashdan himoya)',
  creatorCheckBlockedFuel: 'Ogohlantirish: ushbu avtomobil modeli uchun bu yoqilgʻi mos emas',
};

const EN: TranslationBundle = {
  loadingTitle: 'dezagamiz',
  loadingSubtitle: 'Connecting stations and verifying access...',
  loadingReadySubtitle: 'Stations and tariffs across Uzbekistan connected · Ready to open',
  loadingWaitBtn: 'Loading app...',
  enterAppBtn: 'Go to app',
  splashFooterMeta: 'CNG & Fuel Network · Pay from your car',
  enteringApp: 'Entering dezagamiz...',
  gateBadge: 'Card registration or 3-day Guest mode',
  heroEyebrow: 'CNG & Fuel Station Network Across Uzbekistan',
  heroTitle: 'Pay for gas from your car — an attendant comes to you',
  heroSubtitle:
    'No need to step out into heat or cold or queue at a kiosk. Pick your bay at a dezagamiz station, pay with your linked card, and our attendant connects the gas nozzle in seconds.',
  heroImageAlt: 'dezagamiz refueling station in Tashkent in blue and white style',
  step1Label: 'Step 01',
  step1Title: 'Vehicle setup',
  step1Desc: 'The attendant identifies your car by its license plate',
  step2Label: 'Step 02',
  step2Title: 'Link a bank card',
  step2Desc: 'Uzcard, Humo, Visa or Mastercard for instant payment',
  step3Label: 'Step 03',
  step3Title: 'Gas refueling',
  step3Desc: 'After payment, the attendant approaches and refuels your car',
  heroCities: 'Tashkent · Samarkand · Bukhara · Fergana',
  heroPriceFrom: 'Methane from 5,700 UZS/m³',
  tabRegister: 'Register',
  tabLogin: 'Sign in',
  tabGuest: 'Guest (3d)',
  tabCreator: 'Creator',
  stage1Of2: 'Step 1 of 2',
  stage2Of2: 'Step 2 of 2',
  driverAndCar: 'Driver & Car',
  cardBinding: 'Link Card',
  fullNameLabel: 'Driver full name',
  phoneLabel: 'Phone number (Uzbekistan)',
  carModelLabel: 'Car make & model',
  plateNumberLabel: 'License plate',
  preferredFuelLabel: 'Primary fuel type',
  nextBindCard: 'Next: link bank card',
  back: 'Back',
  bindCardAndEnter: 'Link card & enter',
  checkingCard: 'Verifying card...',
  cardExpiryLabel: 'MM/YY',
  cardCvcLabel: 'CVC / Code',
  cardHolderLabel: 'Cardholder Name',
  cardPreviewLabel: 'Linked payment card',
  cardPreviewExpiryLabel: 'Expires',
  loginTitle: 'Sign in for registered drivers',
  loginSubtitle:
    'Only drivers who have registered their car and linked a bank card can sign in.',
  loginButton: 'Sign in to dezagamiz',
  checkingAccount: 'Checking account...',
  firstTimeHint: 'New here? Switch to the Register tab',
  errEnterFullName: 'Please enter your full name',
  errEnterUzPhone: 'Enter an Uzbekistan phone number in +998 XX XXX XX XX format',
  errEnterCarModel: 'Enter your car make and model (e.g. Chevrolet Cobalt)',
  errEnterUzPlate: 'Enter a valid Uzbekistan license plate (e.g. 01 A 777 AA)',
  errCheckCardNumber: 'Please check your bank card number',
  errEnterCardExpiry: 'Enter a valid card expiry date (MM/YY)',
  errEnterCardHolder: 'Enter the cardholder name',
  errEnterCardCvc: 'Enter the 3-digit CVC/CVV security code',
  errRegisterFailed: 'Could not complete registration',
  errLoginFailed: 'Could not sign in. Verify your registration and linked card.',
  errCreatorCodeInvalid: 'Invalid creator access code',
  errChooseRoleFailed: 'Could not select entry mode',
  errSelectFreeBay: 'Please select an available bay',
  errFuelNotOnBay: 'Selected fuel is unavailable on this bay',
  errMinFuelAmount: 'Minimum refueling amount is 10,000 UZS',
  errPersonalCardFrozen:
    'Your personal dezagamiz card is frozen. Unfreeze it in the Cards & Car tab.',
  errPersonalCardLowFunds:
    'Insufficient funds on your personal dezagamiz card. Top up in Cards & Car.',
  errBindCardToPay: 'Link a bank card to pay',
  errPaymentFailed: 'Payment failed',
  errSwitchCarFailed: 'Could not switch vehicle',
  errAddCarFailed: 'Could not add vehicle',
  errSwitchCarProfileFailed: 'Could not switch vehicle',
  errDeleteCarFailed: 'Could not delete vehicle',
  errAddCardFailed: 'Could not add bank card',
  errSwitchCardFailed: 'Could not switch default card',
  errDeleteLastCard: 'Cannot remove your only bank card',
  errIssueCardFailed: 'Could not issue personal card',
  errTopUpCheck: 'Please check top-up amount',
  errTopUpMin: 'Minimum top-up amount is 10,000 UZS',
  errTopUpMax: 'Maximum single top-up is 5,000,000 UZS',
  errCardDigits: 'Enter the 16-digit card number',
  errCardNetwork: 'Supported cards: Uzcard (8600), Humo (9860), Visa, and Mastercard',
  errCardLuhn: 'Invalid card check number',
  errTopUpFailed: 'Could not top up card',
  errCardDesignFailed: 'Could not update card design',
  errCardFreezeFailed: 'Could not change card status',
  guestTitle: '3-Day Guest Mode',
  guestSubtitle:
    'Try in-car fueling and live attendant tracking without binding your personal card. Guest access is strictly capped at 3 days (72 hours) — no longer than 3 days.',
  guestRuleBadge: 'Limit: strictly 3 days max',
  guestLimitItem1: 'Access all stations, real Uzbekistan fuel prices, and live orders.',
  guestLimitItem2: 'The 3-day timer is tied to your device and cannot be extended.',
  guestLimitItem3: 'After 3 days, full registration with a bank card is required.',
  guestStartButton: 'Enter as Guest (3 days)',
  guestStarting: 'Opening guest session...',
  guestExpiredNotice:
    'Your 3-day guest mode has expired. Please register and link a card to continue.',
  guestBannerLabel: 'Guest mode · remaining',
  guestUpgradeButton: 'Register & link card',
  creatorTitle: 'Creator Access',
  creatorSubtitle:
    'Enter the secret password to choose Admin mode or Regular Person mode.',
  creatorCodeLabel: 'Creator code',
  creatorCodePlaceholder: 'Enter secret code',
  verifyPassword: 'Verify password',
  verifyingPassword: 'Verifying...',
  passwordConfirmed: 'Password verified',
  chooseRoleTitle: 'Choose entry mode',
  chooseRoleSubtitle:
    'Enter as Admin to manage stations and prices, or as a Regular Person to refuel from your car.',
  roleAdminTitle: 'Admin',
  roleAdminDesc: 'Manage station prices, bays, orders, and registered drivers.',
  enterAsAdmin: 'Enter as Admin',
  roleDriverTitle: 'Regular Person',
  roleDriverDesc: 'Standard driver mode: select a bay, pay by card, and refuel.',
  enterAsDriver: 'Enter as Regular Person',
  creatorAccessBadge: 'Special Access · Code Verified',
  creatorPanelTitle: 'dezagamiz Creator Console',
  creatorPanelSubtitle:
    'Manage gas and fuel prices, CNG bays, and monitor active drivers across Uzbekistan.',
  creatorDriverModeBadge: 'Mode: Regular Person',
  creatorLockBtn: 'Lock creator console',
  creatorExitBtn: 'Exit creator console',
  creatorLoadingMetrics: 'Loading dezagamiz network metrics...',
  creatorStatDrivers: 'Drivers with card',
  creatorStatOrders: 'Orders',
  creatorStatActivePrefix: 'active',
  creatorStatMethane: 'Methane dispensed',
  creatorStatRevenue: 'Network revenue',
  creatorStationManageEyebrow: 'Station control',
  creatorStationManageTitle: 'Tariffs & bays',
  creatorSelectStationLabel: 'Select station',
  creatorPricesLabel: 'Prices (per m³ / L)',
  creatorBaysStatusLabel: 'Bay availability status',
  creatorApplyStationBtn: 'Apply station updates',
  creatorSavingStationBtn: 'Saving...',
  creatorStationUpdatedMsg: 'Tariffs and bay status updated for all drivers',
  creatorOrdersTitle: 'Refueling orders',
  creatorOrdersEmpty:
    'No orders yet. New orders appear here as soon as a driver pays from their car.',
  creatorColReceiptCar: 'Receipt / Car',
  creatorColStationBay: 'Station / Bay',
  creatorColAmount: 'Amount',
  creatorColStatus: 'Status',
  creatorColControl: 'Control',
  creatorStagePaid: 'Paid',
  creatorStageApproaching: 'Attendant walking',
  creatorStageFueling: 'Refueling',
  creatorStageCompleted: 'Completed',
  creatorNextStageBtn: 'Next stage',
  creatorDoneLabel: 'Done',
  creatorDriversTitle: 'Registered drivers',
  creatorDriversEmpty: 'No registered drivers with linked cards yet.',
  creatorColDriver: 'Driver',
  creatorColPhone: 'Phone',
  creatorColCarPlate: 'Car & plate',
  creatorColLinkedCard: 'Linked card',
  navFuel: 'Refuel',
  navStations: 'Stations',
  navAssistant: 'Assistant',
  navHistory: 'History',
  navCards: 'Cards & Car',
  navCardsShort: 'Cards',
  navCreator: 'Creator',
  navAdminPanel: 'Admin Panel',
  navAdminShort: 'Admin',
  navDriverShort: 'Driver',
  switchToDriver: 'Regular Person',
  switchToAdmin: 'Admin',
  logout: 'Sign out',
  fuelTitle: 'Refuel without leaving your car',
  fuelSubtitle:
    'Pay the desired amount from your linked card — a dezagamiz attendant walks up and fuels your car.',
  yourCar: 'Your vehicle',
  selectStationStep: '1. Station in Uzbekistan',
  selectBayStep: '2. Bay number where you stopped',
  freeBaysCount: 'Available',
  selectFuelStep: '3. Gas or fuel on bay',
  amountStep: '4. Amount',
  fullTank: 'Full tank',
  payWithCardLabel: 'Pay with linked card',
  cardsCountLabel: 'Cards',
  payFromCarBtn: 'Pay from car',
  processingPayment: 'Processing payment...',
  howItWorksTitle: 'How refueling works',
  howStep1: 'Stay inside your car with the windows closed and pay the amount.',
  howStep2Prefix: 'The attendant at bay',
  howStep3:
    'The attendant connects the gas nozzle and fills your car up to the paid volume.',
  driverProfileActive: 'Driver profile active',
  cardVerifiedText: 'Secure card payment verified',
  bayFree: 'Free',
  bayBusy: 'Busy',
  bayShortLabel: 'Bay #',
  notAtBay: 'Unavailable',
  open24h: 'Open 24/7',
  distanceKmUnit: 'km',
  trackerStage1Title: 'Payment confirmed',
  trackerStage1Sub: 'Funds authorized, order sent to the bay',
  trackerStage2Title: 'Attendant approaching',
  trackerStage2Sub: 'The attendant is walking toward your vehicle',
  trackerStage3Title: 'Fueling in progress',
  trackerStage3Sub: 'Nozzle connected, stay comfortably inside your car',
  trackerStage4Title: 'Refueling completed',
  trackerStage4Sub: 'Fuel cap closed, you are ready to drive off',
  trackerHeadlinePaid: 'Payment confirmed',
  trackerHeadlineApproaching: 'Attendant is walking to your car',
  trackerHeadlineFuelingPrefix: 'Fueling now:',
  trackerHeadlineCompleted: 'Refueling completed successfully',
  trackerDescPaid: 'Stay inside your car — an available attendant has accepted your order.',
  trackerDescApproachingSuffix: 'is walking to your',
  trackerDescFuelingMid: 'Refueling nozzle is connected to bay',
  trackerDescCompleted: 'Nozzle disconnected, valve closed. Digital receipt saved to history.',
  trackerTariffLabel: 'Rate',
  trackerVolumeFilledLabel: 'Dispensed volume',
  trackerGoalLabel: 'Target',
  trackerPaidFromCardLabel: 'Paid by card',
  trackerStatusLabel: 'Delivery status',
  trackerStatusPaid: 'Dispatching to bay',
  trackerStatusEtaPrefix: 'Arrives in ~',
  trackerStatusEtaSec: 'sec',
  trackerStatusFuelingPrefix: 'Dispensing',
  trackerStatusDone: '100% Complete',
  trackerStayInsideHint: 'No need to roll down windows — the attendant sees your car & plate',
  trackerBtnAtCar: 'Attendant is at car',
  trackerBtnStartFuel: 'Start dispensing',
  trackerBtnFinishFuel: 'Complete refueling',
  trackerRateLabel: 'Rate your attendant',
  trackerRateAriaPrefix: 'Rating',
  trackerNewOrderBtn: 'New refueling',
  trackerAttendantCardTitle: 'Your attendant on shift',
  trackerExperiencePrefix: 'Experience',
  trackerExperienceUnit: 'yrs',
  trackerUniformLabel: 'Blue dezagamiz uniform',
  trackerRolePaid: 'Received your order signal',
  trackerRoleApproaching: 'Walking toward your bay with the gas nozzle',
  trackerRoleFueling: 'Monitoring refueling to paid volume',
  trackerRoleCompleted: 'Closed your vehicle fuel cap',
  trackerCarVerifyPrefix: 'Vehicle verified at bay',
  trackerPaymentDetailsTitle: 'Payment breakdown',
  trackerDetailStation: 'Station',
  trackerDetailBay: 'Bay',
  trackerDetailFuel: 'Fuel',
  trackerDetailCard: 'Card',
  trackerDetailCashback: 'dezagamiz Cashback',
  trackerDetailTotal: 'Total paid',
  stationsTitle: 'Nearby dezagamiz Stations & Smart Route',
  stationsSubtitle:
    'Pick your fuel (e.g. Propane) and your starting location — we highlight the nearest matching station with verified coordinates and driving route.',
  allCities: 'All cities',
  allFuels: 'All fuels',
  goToFueling: 'Go to fueling',
  chooseStation: 'Route & select station',
  attendantLabel: 'Attendant',
  fuelFilterLabel: 'Select needed fuel',
  useMyGps: 'Use my GPS location',
  locatingGps: 'Locating GPS...',
  driverLocationLabel: 'Starting point',
  searchOriginPlaceholder: 'Search a street or district in Uzbekistan...',
  nearestRouteTitle: 'Recommended route to nearest matching station',
  nearestFuelBadge: 'Nearest match',
  coordinatesLabel: 'Verified coordinates',
  routeDistanceLabel: 'Route distance',
  routeEtaLabel: 'Drive time',
  routeBuilding: 'Calculating driving route...',
  refuelHereBtn: 'Refuel here',
  openGoogleMapsBtn: 'Open in Google Maps',
  routeStepsTitle: 'Turn-by-turn steps',
  findNearestOnMapBtn: 'Find nearest on map',
  nearestStationRank: 'Nearest',
  gpsPermissionDenied: 'GPS unavailable. Pick a city district or type an address.',
  resolvingCoords: 'Verifying exact coordinates via Google Maps...',
  noStationForFuel: 'No stations matching this fuel in the selected filter.',
  youAreHere: 'You are here',
  liveGpsOn: 'Live GPS (real-time)',
  liveGpsActive: 'Location updating in real time',
  stopLiveGps: 'Pause GPS',
  nearbyPlacesTitle: 'All nearby places around you',
  nearbyPlacesLoading: 'Finding nearby places around your location...',
  nearbyPlacesEmpty: 'No extra nearby places found within 3 km.',
  nearbyAll: 'All places',
  nearbyGas: 'Gas stations',
  nearbyFood: 'Cafes & Food',
  nearbyStore: 'Stores & Market',
  nearbyService: 'Auto Service',
  showRouteMapBtn: 'Show route map',
  hideRouteMapBtn: 'Hide map',
  expandMapBtn: 'Expand map',
  collapseMapBtn: 'Standard size',
  liveRouteModeTitle: 'Live route map & real-time location',
  openPlaceOnMap: 'Focus on map',
  locationAccessTitle: 'Choose location or city',
  locationModeMyLocation: 'My location',
  locationModeCity: 'Choose city',
  locationGrantBtn: 'Allow location access',
  locationGrantedBadge: 'Location access granted',
  locationBlockedHint:
    'Location access is blocked by browser settings. Enable it or select a city below.',
  nearestStationsSectionTitle: 'Nearest gas stations',
  nearestFromMyGps: 'Near your live location',
  nearestInCityPrefix: 'Nearest in',
  mapLoadFailedNotice:
    'Interactive Google Maps script could not load right now (network or blocker). Nearest stations still work below, or open directions directly in Google Maps.',
  retryMapBtn: 'Retry loading map',
  mapLayerRoadmap: 'Map',
  mapLayerSatellite: 'Satellite',
  mapSatelliteLabels: 'Labels',
  mapView360Btn: '360° View',
  mapExit360Btn: 'Back to map',
  streetViewOpenExternal: 'Open 360° in Google Maps',
  streetViewDragHint: 'Drag screen to look around 360°',
  streetViewSatelliteOrbitLabel: '360° Satellite Orbit View',
  streetViewStreetModeLabel: '360° Google Street View',
  streetViewUnavailableHint:
    'Street-level photography is unavailable here — showing 360° satellite orbit view',
  streetViewLoading: 'Loading 360° panorama...',
  pegmanAriaLabel: '360° Street View (drag Pegman onto map or click)',
  pegmanDragTooltip: 'Drag onto map or click for 360°',
  pegmanDropAction: 'Release here for 360° view',
  pegmanDroppedPointLabel: '360° Map Viewpoint',
  gpsSignalTimeout: 'GPS signal taking longer — still acquiring location...',
  gpsSignalUnavailable: 'GPS signal temporarily unavailable — retrying...',
  mapFollowDriverBtn: 'Follow me',
  mapFollowingDriver: 'Following GPS',
  liveTelemetryUpdated: 'Updated',
  districtTashkentCenter: 'Tashkent · Center',
  districtChilonzor: 'Chilonzor',
  districtYunusobod: 'Yunusobod',
  districtSergeli: 'Sergeli',
  historyTitle: 'Refueling History & Receipts',
  historySubtitle:
    'All linked-card payments and attendants who serviced your vehicle.',
  totalOrders: 'Total orders',
  totalMethane: 'Methane dispensed',
  totalPaid: 'Total spent',
  noOrdersTitle: 'No refueling orders yet',
  noOrdersSubtitle:
    'Your digital receipt and attendant details will appear here after your first in-car payment.',
  receiptTitle: 'dezagamiz Digital Receipt',
  receiptBtn: 'Receipt',
  historyColReceiptDate: 'Receipt / Date',
  historyColStationBay: 'Station & bay',
  historyColFuel: 'Fuel',
  historyColVolume: 'Volume',
  historyColAmount: 'Amount',
  historyColAttendant: 'Attendant',
  historyColAction: 'Action',
  historyCloseReceiptAria: 'Close receipt',
  historyDetailCar: 'Vehicle',
  historyDetailBayFuel: 'Bay & fuel',
  historyDetailAttendant: 'Attendant',
  historyDetailCardPay: 'Card payment',
  historyDetailTotalCharged: 'Total charged',
  linkedCardsTitle: 'Linked Bank Cards',
  linkedCardsSubtitle:
    'At least one active card is required for permanent entry and in-car payments.',
  addCardBtn: 'Add card',
  hideForm: 'Hide form',
  primaryCard: 'Default',
  makePrimary: 'Set default',
  saveCarData: 'Save vehicle info',
  myVehiclesTitle: 'My Vehicles',
  addNewCarBtn: 'Add a new car',
  newCarModelLabel: 'New car make & model',
  newCarPlateLabel: 'New license plate',
  saveNewCarBtn: 'Add car to profile',
  activeCarBadge: 'Active car',
  selectCarBtn: 'Select',
  deleteCarLabel: 'Remove car',
  carAddedSuccess: 'New vehicle added and set as active',
  profileUpdatedSuccess: 'Vehicle and profile details updated',
  profileSaveBtnError: 'Save error',
  profileNewCardNumberLabel: 'New card number',
  profileBindNewCardBtn: 'Link new card',
  profileExpiryPrefix: 'Expires',
  profileDeleteCardAriaPrefix: 'Remove card',
  profileAttendantSectionEyebrow: 'For station attendant',
  profileDriverCarTitle: 'Driver & vehicle',
  profileAttendantCarHint: 'The station attendant identifies your car by its model and license plate.',
  profileAccountPhoneLabel: 'Account phone',
  profileDriverNameLabel: 'Driver name',
  personalCardEyebrow: 'Signature driver fuel card',
  personalCardTitle: 'Personal dezagamiz Card',
  personalCardSubtitle:
    'Instant issuance in dezagamiz style: zero-fee gas & fuel payments plus up to 5% cashback bonus.',
  personalCardCta: 'Issue dezagamiz Card',
  personalCardIssuing: 'Issuing card...',
  personalCardTierLabel: 'Card tier',
  personalCardTierStandard: 'Standard',
  personalCardTierStandardDesc: '0 UZS issue · 3% cashback bonus',
  personalCardTierPrime: 'Prime',
  personalCardTierPrimeDesc: '0 UZS issue · 5% cashback + bay priority',
  personalCardStyleLabel: 'Card finish',
  personalCardStyleCobalt: 'Cobalt Flagship',
  personalCardStyleArctic: 'Arctic White',
  personalCardStyleNight: 'Tashkent Midnight',
  personalCardInitialTopUp: 'Initial top-up from linked card',
  personalCardBalanceLabel: 'Card balance',
  personalCardBonusLabel: 'Cashback bonus',
  personalCardCashbackLabel: 'Cashback',
  personalCardTopUpBtn: 'Top up balance',
  personalCardTopUpConfirm: 'Add to card',
  personalCardFreezeBtn: 'Freeze card',
  personalCardUnfreezeBtn: 'Unfreeze',
  personalCardFrozenBadge: 'Frozen',
  personalCardActiveBadge: 'Active',
  personalCardShowNumber: 'Reveal number',
  personalCardHideNumber: 'Hide number',
  personalCardPayOption: 'Personal dezagamiz Card',
  personalCardIssuedSuccess: 'Your personal dezagamiz card is issued and ready!',
  personalCardTopUpSuccess: 'Personal dezagamiz card topped up',
  personalCardIssuePromptLink: 'Issue your personal dezagamiz card (up to 5% cashback)',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSwitchAria: 'Switch between light and dark theme',
  assistantTitle: 'Personal Gemini AI Assistant',
  assistantSubtitle: 'Station Routes · Fuel Estimates · Personal Drive Music',
  assistantWelcome:
    'Hello! I am your personal dezagamiz assistant powered by Gemini. I can help find the closest station, calculate fuel costs, or compose a custom melody for your drive.',
  assistantPlaceholder: 'Ask about refueling, stations, or ask to compose a melody...',
  assistantSendBtn: 'Send',
  assistantThinking: 'Gemini is preparing a response...',
  assistantClearBtn: 'Clear',
  assistantActionOpenStation: 'Open selected station',
  assistantActionPlayMelody: 'Play composed melody',
  assistantPrompt1: 'Which nearest CNG station has free bays right now?',
  assistantPrompt2: 'Calculate how many m³ of methane 120,000 UZS buys.',
  assistantPrompt3: 'Compose a calm night melody for driving in Tashkent.',
  assistantPrompt4: 'Set a gentle fueling alert chime and start music.',
  musicStudioTitle: 'Personal Music & Melodies',
  musicStudioSubtitle: 'Your Audio Files · Gemini Melodies · Refuel Chime',
  musicTabTracks: 'My Tracks',
  musicTabComposeAi: 'Compose with Gemini',
  musicTabCustom: 'Upload / Note Pad',
  musicPlayBtn: 'Play',
  musicPauseBtn: 'Pause',
  musicNextBtn: 'Next',
  musicLoopLabel: 'Loop',
  musicVolumeLabel: 'Volume',
  musicDownloadWavBtn: 'Download WAV',
  musicChimeActiveLabel: 'Refuel chime',
  musicSetChimeBtn: 'Set as chime',
  musicAutoPlayFuelLabel: 'Play melody when fueling starts',
  musicUploadTitle: 'Upload personal track or melody',
  musicUploadHint: 'MP3, WAV, OGG or M4A up to 5 MB · saved to your profile',
  musicUploadBtn: 'Choose audio file',
  musicUploading: 'Uploading track...',
  musicComposePromptLabel: 'Melody mood or driving style',
  musicComposePromptPlaceholder: 'E.g. calm night lo-fi groove for Tashkent highway',
  musicComposeBpmLabel: 'Tempo (BPM)',
  musicComposePresetLabel: 'Instrument',
  musicComposeBtn: 'Compose melody with Gemini',
  musicComposing: 'Gemini is composing...',
  musicSequencerTitle: 'Personal Melody Sequencer (16 steps)',
  musicSequencerHint: 'Tap notes to hear them immediately, then save to your library',
  musicSaveCustomBtn: 'Save custom melody',
  musicCustomTitlePlaceholder: 'Your melody title',
  musicQuickCardTitle: 'Personal Music & Gemini Assistant',
  musicOpenStudioBtn: 'Open Assistant & Music',
  musicPresetRhodes: 'Rhodes',
  musicPresetWarmPad: 'Warm Pad',
  musicPresetPluck: 'Plucked',
  musicPresetChime: 'Chime Bell',
  musicPresetBass: 'Bass Groove',
  musicMood1: 'Night Tashkent · smooth lo-fi drive',
  musicMood2: 'Energetic morning highway beat',
  musicMood3: 'Eastern sunrise · gentle instrumental motif',
  musicMood4: 'Crisp soft chime for refueling completion',
  musicSourceGemini: 'Gemini AI',
  musicSourceFile: 'Audio file',
  musicSourceCustom: 'Custom melody',
  musicSourcePreset: 'Preset',
  musicDeleteTrackAria: 'Delete track',
  musicComposeSuccessPrefix: 'Melody “',
  musicComposeSuccessSuffix: '” created and added to your library.',
  musicUploadSuccessPrefix: 'Track “',
  musicUploadSuccessSuffix: '” uploaded to your profile.',
  musicCustomSavedPrefix: 'Melody “',
  musicCustomSavedSuffix: '” saved and playing.',
  musicSelectAtLeastOneNote: 'Please tap at least one note on the grid.',
  musicPreset1Title: 'Tashkent · Night Cruise',
  musicPreset1Sub: 'Soft Rhodes · Lo-fi vibe for the road',
  musicPreset2Title: 'Samarkand · Sunrise',
  musicPreset2Sub: 'Plucked synth · Light eastern scale',
  musicPreset3Title: 'dezagamiz Refuel Chime',
  musicPreset3Sub: 'Clean crystal chime for bay readiness',
  assistantPromptGreeting: 'Hello! Guide me to the right section',
  assistantActionGoTo: 'Open section:',
  assistantActionThemeDark: 'Dark mode enabled',
  assistantActionThemeLight: 'Light mode enabled',
  assistantActionThemeToggled: 'Theme switched',
  assistantActionLangChanged: 'Language updated',
  assistantActionGpsOn: 'Live GPS enabled',
  assistantActionGpsOff: 'Live GPS paused',
  assistantErrReply: 'Could not get a response from Gemini.',
  musicDefaultComposePrompt: 'Calm night lo-fi groove for driving around the city',
  musicDefaultCustomTitle: 'My Road Melody',
  musicPreviewDefaultTitle: 'Preview',
  musicCustomFallbackTitle: 'My Melody',
  musicComposeFailedErr: 'Could not compose melody with Gemini.',
  musicUploadFailedErr: 'Could not upload audio file.',
  musicSaveCustomFailedErr: 'Could not save custom melody.',
  musicPlaybackAudioErr: 'Could not play the audio file.',
  musicPlaybackBlockedErr: 'Tap Play to start audio playback in your browser.',
  musicFileTooLargeErr: 'Maximum audio file size is 5 MB.',
  musicFileReadErr: 'Could not read audio file',
  musicUploadTrackFallback: 'My Track',
  creatorShowCodeAria: 'Show code',
  creatorHideCodeAria: 'Hide code',
  sampleFullNamePlaceholder: 'Azizbek Karimov',
  sampleCardHolderPlaceholder: 'AZIZBEK KARIMOV',
  personalCardDriverFallback: 'DRIVER CARD',
  meterUnit: 'm',
  languageSelectorAria: 'Select application language',
  creatorLoadErr: 'Could not load creator console',
  creatorLockErr: 'Could not lock creator console',
  creatorUpdateStationErr: 'Error updating station settings',
  creatorAdvanceOrderErr: 'Could not update order status',
  driverMarkerSelf: 'Me',
  closeAria: 'Close',
  zoomInAria: 'Zoom in',
  zoomOutAria: 'Zoom out',
  entryModeAria: 'Entry mode',
  primaryNavAria: 'Primary navigation',
  mobileNavAria: 'Mobile navigation',
  rotateLeftAria: 'Rotate left 45°',
  rotateRightAria: 'Rotate right 45°',
  fuelMetan: 'Methane',
  fuelPropan: 'Propane',
  fuelAi92: 'AI-92',
  fuelAi95: 'AI-95',
  fuelMetanFull: 'Methane (CNG)',
  fuelPropanFull: 'Propane (LPG)',
  fuelAi92Full: 'Petrol AI-92',
  fuelAi95Full: 'Petrol AI-95',
  pressure200Bar: '200 bar',
  pressure16Bar: '16 bar',
  currencyUzs: 'UZS',
  unitM3: 'm³',
  unitLiter: 'L',
  musicPreset4Title: 'Registan · Highway Drive',
  musicPreset4Sub: 'Upbeat warm synth groove with deep bass for the road',
  navShowcase: 'Pitch',
  navShowcaseShort: 'Pitch',
  openShowcaseBtn: 'Presentation & Defense',
  launchJuryDemoBtn: 'Launch Live App (Demo)',
  showcaseBackToGate: 'Back to Sign In',
  showcaseTitle: 'Competition Pitch & Defense Hub',
  showcaseSubtitle: 'Stage slides, tough Q&A defense trainer, family savings & simple monetization calculators',
  showcaseProjectorModeOn: 'Projector (Clean)',
  showcaseSpeakerNotesOn: 'Speaker Cue',
  showcaseSpeakerCueLabel: 'Say to audience:',
  showcaseTimerLabel: 'Stage Stopwatch',
  showcaseTimerStart: 'Start',
  showcaseTimerPause: 'Pause',
  showcaseTimerReset: 'Reset',
  showcaseTarget3Min: 'Target: 3:00',
  showcaseTabSlides: 'Pitch Slides',
  showcaseTabSavings: 'Family Savings',
  showcaseTabDefense: 'Q&A Defense',
  showcaseTabMonetization: 'Monetization',
  showcaseTabChecklist: 'Stage Checklist',
  showcasePrevSlide: 'Previous',
  showcaseNextSlide: 'Next Slide',
  showcaseShowLiveBtn: 'Show Live in App',
  showcaseQuizModeBtn: '30s Quiz Drill',
  showcaseQuizNextBtn: 'Next Question',
  showcaseQuizRevealBtn: 'Reveal Answer',
  showcaseQuizHideBtn: 'Hide Answer',
  showcaseQuizTimerLabel: 'Answer timer',
  showcaseFilterAll: 'All Questions',
  showcaseFilterParents: 'Parents',
  showcaseFilterJury: 'Judges',
  showcaseFilterBusiness: 'Business',
  showcaseSavingsTitle: 'Family Methane Fuel Savings Calculator',
  showcaseSavingsSubtitle: 'Monthly & annual comparison: CNG Methane + 5% dezagamiz Prime cashback vs Petrol AI-92',
  showcaseMonthlyKmLabel: 'Monthly driving distance',
  showcaseConsumptionLabel: 'Average fuel per 100 km',
  showcaseOutMonthlySavings: 'Monthly savings',
  showcaseOutYearlySavings: 'Yearly fuel savings',
  showcaseOutPrimeCashback: 'Yearly 5% Prime cashback',
  showcaseOutTotalBenefit: 'Total annual family benefit',
  showcaseOutCo2Saved: 'Annual CO₂ avoided',
  showcaseOutTimeSaved: 'Queue time saved/year',
  unitKgShort: 'kg',
  unitHourShort: 'h',
  unitMinShort: 'min',
  showcaseMonetizeTitle: 'How to Monetize This App Right Now',
  showcaseMonetizeSubtitle: '4 simple paths without banking licenses + live revenue projection',
  showcaseStationsCountLabel: 'Partner private stations',
  showcaseCarsPerDayLabel: 'App orders per station / day',
  showcaseOutMonthlyOrders: 'Monthly orders',
  showcaseOutSubIncome: 'Station SaaS (200k/mo)',
  showcaseOutFeeIncome: 'Partner fee (700 UZS/order)',
  showcaseOutAdIncome: 'Map cafe & wash ads',
  showcaseOutMonthlyRevenue: 'Projected monthly revenue',
  showcaseOutYearlyRevenue: 'Projected annual revenue',
  showcaseChecklistTitle: 'Fail-Safe Live Stage Demo Checklist',
  showcaseChecklistSubtitle: 'Check off each key proof point live in front of parents and judges',
  showcaseChecklistProgress: 'Steps completed',
  safetyMetanRule: 'Pay online and skip the cashier queue. Safety Notice (Uzbekistan CNG rules): you must exit the cabin and open the hood when refueling methane.',
  safetyStayInCarNote: 'Stay-in-car mode — remain comfortably inside while the attendant refuels',
  trackerExitForMetanHint: 'Per CNG safety rules, exit the cabin and keep the hood open during methane refueling',
  carSupportedFuelsLabel: 'Supported for vehicle',
  carFuelAutoSelected: 'Compatible fuel automatically selected for your car model',
  carNoGboHybridWarn: 'This model (hybrid/petrol without CNG/LPG kit) only supports AI-92 and AI-95. Methane and Propane are not supported.',
  carEvOnlyWarn: 'Electric vehicle selected: gas and petrol refueling are not compatible. Switch vehicle in Garage or use an EV charger.',
  bayCodeTitle: 'Wrong-Pump Payment Protection',
  bayCodeLabel: 'Confirmation code from pump display',
  bayCodePlaceholder: '4 digits on screen',
  bayCodeAutofillBtn: 'Fill demo code',
  bayCodeScanQrBtn: 'Scan QR on pump',
  bayCodeScanningQr: 'Scanning pump QR code...',
  bayCodeVerifiedBadge: 'Pump bay verified',
  bayCodeDemoHintPrefix: 'Current pump display code',
  errBayCodeMismatch: 'Enter the matching 4-digit code from the selected pump display or scan its QR code',
  compactLocationTitle: 'City & Nearest Station',
  howItWorksToggleOpen: 'How does it work?',
  howItWorksToggleClose: 'Hide guide',
  secretAdminActivatedToast: 'Secret admin access armed. Click "Sign out" to open the administrator code screen.',
  secretAdminBackToDriverBtn: 'Back to driver sign-in',
  sortNearestLabel: 'Nearest',
  sortBestNearbyLabel: 'Best nearby',
  bestMatchBadge: 'Best pick',
  stationStatusOpen: 'Open',
  stationStatusBusy: 'High load',
  stationStatusMaint: 'Maintenance',
  queueLowLabel: 'No queue',
  queueMediumLabel: 'Moderate queue',
  queueHighLabel: 'Long queue',
  geoFallbackCityNotice: 'Location unavailable — distances calculated from the selected city center',
  mapFallbackActiveNote: 'Built-in interactive station map active',
  carMatchOk: 'Fits vehicle',
  carMatchNo: 'No matching fuel',
  showcaseBackToApp: 'Back to fueling',
  creatorOperationalStatusLabel: 'Station operational status',
  creatorQueueLevelLabel: 'Queue & congestion level',
  creatorFuelAvailabilityLabel: 'Fuel type availability',
  creatorFuelOn: 'On',
  creatorFuelOff: 'Off',
  creatorDemoEventsTitle: 'Live events & security audit',
  creatorDemoEventsEmpty: 'No events yet — update a station or run a safety/code check',
  creatorSafetySandboxTitle: 'Safety Rules & Pump Code Verifier',
  creatorSafetySandboxSub: 'Demonstrate vehicle fuel compatibility, Uzbekistan CNG safety rules, and 4-digit pump code validation live',
  creatorTestCarLabel: 'Test vehicle model',
  creatorTestFuelLabel: 'Selected fuel to test',
  creatorTestBayLabel: 'Test pump bay',
  creatorTestCodeInputLabel: 'Entered display code',
  creatorRunCheckBtn: 'Run security & safety check',
  creatorCheckPassed: 'Approved: pump display code matches & fuel fits vehicle',
  creatorCheckBlockedCode: 'Blocked: wrong pump code (wrong-pump protection active)',
  creatorCheckBlockedFuel: 'Warning: fuel not supported by selected vehicle model',
};

const KK: TranslationBundle = {
  loadingTitle: 'dezagamiz',
  loadingSubtitle: 'Станцияларға қосылу және қолжетімділікті тексеру...',
  loadingReadySubtitle: 'Өзбекстан станциялары мен тарифтері қосылды · Ашуға дайын',
  loadingWaitBtn: 'Қосымша жүктелуде...',
  enterAppBtn: 'Қосымшаға өту',
  splashFooterMeta: 'АГНҚС және ЖҚС · Көліктен шықпай төлеу',
  enteringApp: 'dezagamiz қосымшасына кіру...',
  gateBadge: 'Картамен тіркелу немесе 3 күндік қонақ режимі',
  heroEyebrow: 'Өзбекстан бойынша АГНҚС және ЖҚС желісі',
  heroTitle: 'Газ ақысын көліктен шықпай төлеңіз — құюшы өзі келеді',
  heroSubtitle:
    'Ыстықта немесе суықта сыртқа шығудың, касса кезегінде тұрудың қажеті жоқ. dezagamiz бекетінде колонканы таңдап, картамен төлеңіз — операторымыз санаулы секундта газ құяды.',
  heroImageAlt: 'Ташкенттегі көк-ақ стильдегі dezagamiz газ құю бекеті',
  step1Label: '01-қадам',
  step1Title: 'Көлікті тіркеу',
  step1Desc: 'Оператор көлігіңізді мемлекеттік нөмірі бойынша таниды',
  step2Label: '02-қадам',
  step2Title: 'Карта байлау',
  step2Desc: 'Төлем үшін Uzcard, Humo, Visa немесе Mastercard',
  step3Label: '03-қадам',
  step3Title: 'Газ құю',
  step3Desc: 'Төлемнен кейін құюшы өзі келіп көлікке газ құяды',
  heroCities: 'Ташкент · Самарқанд · Бұхара · Ферғана',
  heroPriceFrom: 'Метан 5 700 сум/м³ бастап',
  tabRegister: 'Тіркелу',
  tabLogin: 'Кіру',
  tabGuest: 'Қонақ (3 күн)',
  tabCreator: 'Жасаушы',
  stage1Of2: '1-кезең / 2',
  stage2Of2: '2-кезең / 2',
  driverAndCar: 'Жүргізуші мен көлік',
  cardBinding: 'Карта байлау',
  fullNameLabel: 'Жүргізушінің аты-жөні',
  phoneLabel: 'Телефон нөмірі (Өзбекстан)',
  carModelLabel: 'Көлік маркасы мен моделі',
  plateNumberLabel: 'Мемлекеттік нөмір',
  preferredFuelLabel: 'Негізгі отын түрі',
  nextBindCard: 'Келесі: картаны байлау',
  back: 'Артқа',
  bindCardAndEnter: 'Картаны байлап кіру',
  checkingCard: 'Карта тексерілуде...',
  cardExpiryLabel: 'АА/ЖЖ',
  cardCvcLabel: 'CVC / Код',
  cardHolderLabel: 'Карта иесінің аты',
  cardPreviewLabel: 'Байланған төлем картасы',
  cardPreviewExpiryLabel: 'Мерзімі',
  loginTitle: 'Тіркелген жүргізушілер үшін кіру',
  loginSubtitle:
    'Көлігін тіркеп, банк картасын байлаған жүргізушілер кіре алады.',
  loginButton: 'dezagamiz-ге кіру',
  checkingAccount: 'Тіркелгі тексерілуде...',
  firstTimeHint: 'Алғаш рет кіріп тұрсыз ба? «Тіркелу» қойындысына өтіңіз',
  errEnterFullName: 'Аты-жөніңізді енгізіңіз',
  errEnterUzPhone: 'Өзбекстан телефон нөмірін +998 XX XXX XX XX пішімінде енгізіңіз',
  errEnterCarModel: 'Көлік маркасы мен моделін енгізіңіз (мысалы, Chevrolet Cobalt)',
  errEnterUzPlate: 'Дұрыс мемлекеттік нөмірді енгізіңіз (мысалы, 01 A 777 AA)',
  errCheckCardNumber: 'Банк картасының нөмірін тексеріңіз',
  errEnterCardExpiry: 'Картаның жарамды мерзімін енгізіңіз (АА/ЖЖ)',
  errEnterCardHolder: 'Карта иесінің атын енгізіңіз',
  errEnterCardCvc: '3 таңбалы CVC/CVV кодын енгізіңіз',
  errRegisterFailed: 'Тіркелуді аяқтау мүмкін болмады',
  errLoginFailed: 'Кіру сәтсіз. Тіркелуді және картаны тексеріңіз.',
  errCreatorCodeInvalid: 'Жасаушы коды қате',
  errChooseRoleFailed: 'Кіру режимін таңдау мүмкін болмады',
  errSelectFreeBay: 'Бос колонканы таңдаңыз',
  errFuelNotOnBay: 'Таңдалған отын түрі бұл колонкада жоқ',
  errMinFuelAmount: 'Ең аз құю сомасы — 10 000 сум',
  errPersonalCardFrozen:
    'Жеке dezagamiz картасы бұғатталған. «Карта және көлік» бөлімінде белсендіріңіз.',
  errPersonalCardLowFunds:
    'Жеке dezagamiz картасында қаражат жеткіліксіз. «Карта және көлік» бөлімінде толықтырыңыз.',
  errBindCardToPay: 'Төлеу үшін банк картасын байлаңыз',
  errPaymentFailed: 'Төлем жүргізу мүмкін болмады',
  errSwitchCarFailed: 'Көлікті ауыстыру мүмкін болмады',
  errAddCarFailed: 'Көлікті қосу мүмкін болмады',
  errSwitchCarProfileFailed: 'Көлікті ауыстыру мүмкін болмады',
  errDeleteCarFailed: 'Көлікті өшіру мүмкін болмады',
  errAddCardFailed: 'Картаны қосу мүмкін болмады',
  errSwitchCardFailed: 'Картаны ауыстыру мүмкін болмады',
  errDeleteLastCard: 'Жалғыз картаны өшіруге болмайды',
  errIssueCardFailed: 'Картаны рәсімдеу мүмкін болмады',
  errTopUpCheck: 'Толықтыру сомасын тексеріңіз',
  errTopUpMin: 'Ең төменгі толықтыру сомасы — 10 000 сум',
  errTopUpMax: 'Бір реттік ең жоғары толықтыру — 5 000 000 сум',
  errCardDigits: 'Карта нөмірінің 16 цифрын енгізіңіз',
  errCardNetwork: 'Uzcard (8600), Humo (9860), Visa және Mastercard карталары қолданады',
  errCardLuhn: 'Картаның бақылау нөмірі қате',
  errTopUpFailed: 'Картаны толықтыру мүмкін болмады',
  errCardDesignFailed: 'Карта дизайнын жаңарту мүмкін болмады',
  errCardFreezeFailed: 'Карта мәртебесін өзгерту мүмкін болмады',
  guestTitle: '3 күндік қонақ режимі',
  guestSubtitle:
    'Жеке картаңызды байламай-ақ қолданып көріңіз. Қонақ режимі нақты 3 күн (72 сағат) жұмыс істейді, одан ұзақ қолдануға болмайды.',
  guestRuleBadge: 'Шектеу: ең көбі 3 күн',
  guestLimitItem1: 'Барлық бекеттер, Өзбекстанның нақты бағалары және салоннан тапсырыс ашық.',
  guestLimitItem2: '3 күндік таймер құрылғыға бекітіледі және ұзартылмайды.',
  guestLimitItem3: '3 күннен кейін жалғастыру үшін картамен тіркелу қажет.',
  guestStartButton: 'Қонақ ретінде 3 күнге кіру',
  guestStarting: 'Қонақ кіруі ашылуда...',
  guestExpiredNotice:
    '3 күндік қонақ режимінің мерзімі аяқталды. Жалғастыру үшін тіркеліп карта байлаңыз.',
  guestBannerLabel: 'Қонақ режимі · қалды',
  guestUpgradeButton: 'Тіркелу және карта байлау',
  creatorTitle: 'Жасаушы бөліміне кіру',
  creatorSubtitle:
    'Админ немесе қарапайым адам режимін таңдау үшін құпия құпиясөзді енгізіңіз.',
  creatorCodeLabel: 'Жасаушы коды',
  creatorCodePlaceholder: 'Құпия кодты енгізіңіз',
  verifyPassword: 'Құпиясөзді тексеру',
  verifyingPassword: 'Тексерілуде...',
  passwordConfirmed: 'Құпиясөз расталды',
  chooseRoleTitle: 'Кіру режимін таңдаңыз',
  chooseRoleSubtitle:
    'Бекеттер мен бағаларды басқару үшін Админ ретінде, немесе көлікке газ құю үшін Қарапайым адам ретінде кіріңіз.',
  roleAdminTitle: 'Админ',
  roleAdminDesc: 'Бекет бағаларын, колонкаларды, тапсырыстар мен жүргізушілерді басқару.',
  enterAsAdmin: 'Админ ретінде кіру',
  roleDriverTitle: 'Қарапайым адам',
  roleDriverDesc: 'Қалыпты жүргізуші режимі: колонка таңдау, картамен төлеу және құю.',
  enterAsDriver: 'Қарапайым адам ретінде кіру',
  creatorAccessBadge: 'Арнайы рұқсат · Код расталды',
  creatorPanelTitle: 'dezagamiz Жасаушы кабинеті',
  creatorPanelSubtitle:
    'Өзбекстан бойынша газ бен отын бағаларын, АГНҚС колонкаларын және жүргізушілерді басқару.',
  creatorDriverModeBadge: 'Режим: Қарапайым адам',
  creatorLockBtn: 'Жасаушы бөлімін бұғаттау',
  creatorExitBtn: 'Жасаушы кабинетінен шығу',
  creatorLoadingMetrics: 'dezagamiz желісінің көрсеткіштері жүктелуде...',
  creatorStatDrivers: 'Карталы жүргізушілер',
  creatorStatOrders: 'Тапсырыстар',
  creatorStatActivePrefix: 'белсенді',
  creatorStatMethane: 'Берілген метан',
  creatorStatRevenue: 'Желі айналымы',
  creatorStationManageEyebrow: 'Бекетті басқару',
  creatorStationManageTitle: 'Тарифтер мен колонкалар',
  creatorSelectStationLabel: 'Бекетті таңдаңыз',
  creatorPricesLabel: 'Бағалар (м³ / л үшін)',
  creatorBaysStatusLabel: 'Бекеттегі колонкалар күйі',
  creatorApplyStationBtn: 'Бекет өзгерістерін сақтау',
  creatorSavingStationBtn: 'Сақталуда...',
  creatorStationUpdatedMsg: 'Тарифтер мен колонкалар күйі барлық жүргізушілер үшін жаңартылды',
  creatorOrdersTitle: 'Құю тапсырыстары',
  creatorOrdersEmpty:
    'Әзірге тапсырыстар жоқ. Жүргізуші салоннан төлеген бойда тапсырыс осында шығады.',
  creatorColReceiptCar: 'Чек / Көлік',
  creatorColStationBay: 'Бекет / Кол.',
  creatorColAmount: 'Сома',
  creatorColStatus: 'Мәртебе',
  creatorColControl: 'Басқару',
  creatorStagePaid: 'Төленді',
  creatorStageApproaching: 'Құюшы келе жатыр',
  creatorStageFueling: 'Құйылуда',
  creatorStageCompleted: 'Аяқталды',
  creatorNextStageBtn: 'Келесі кезең',
  creatorDoneLabel: 'Дайын',
  creatorDriversTitle: 'Тіркелген жүргізушілер',
  creatorDriversEmpty: 'Әзірге карта байлаған тіркелген жүргізушілер жоқ.',
  creatorColDriver: 'Жүргізуші',
  creatorColPhone: 'Телефон',
  creatorColCarPlate: 'Көлік және нөмірі',
  creatorColLinkedCard: 'Байланған карта',
  navFuel: 'Құю',
  navStations: 'Станциялар',
  navAssistant: 'Көмекші',
  navHistory: 'Тарих',
  navCards: 'Карта және көлік',
  navCardsShort: 'Карта',
  navCreator: 'Жасаушы',
  navAdminPanel: 'Админ панелі',
  navAdminShort: 'Админ',
  navDriverShort: 'Жүргізуші',
  switchToDriver: 'Қарапайым адам',
  switchToAdmin: 'Админ',
  logout: 'Шығу',
  fuelTitle: 'Көліктен шықпай газ құю',
  fuelSubtitle:
    'Байланған картадан қажетті көлемді төлеңіз — dezagamiz операторы колонкаға өзі келіп құяды.',
  yourCar: 'Сіздің көлігіңіз',
  selectStationStep: '1. Өзбекстандағы құю бекеті',
  selectBayStep: '2. Сіз тоқтаған колонка нөмірі',
  freeBaysCount: 'Бос',
  selectFuelStep: '3. Колонкадағы газ немесе отын түрі',
  amountStep: '4. Төлем сомасы',
  fullTank: 'Толық баллон',
  payWithCardLabel: 'Байланған картамен төлеу',
  cardsCountLabel: 'Карталар',
  payFromCarBtn: 'Көліктен төлеу',
  processingPayment: 'Төлем жүргізілуде...',
  howItWorksTitle: 'Құю қалай өтеді',
  howStep1: 'Сіз терезелерді жауып салон ішінде қаласыз және қажетті соманы төлейсіз.',
  howStep2Prefix: 'Колонкадағы кезекші құюшы',
  howStep3: 'Оператор келіп, газ түтігін қосады және белгіленген көлемге дейін құяды.',
  driverProfileActive: 'Жүргізуші профилі белсенді',
  cardVerifiedText: 'Картамен қауіпсіз төлем расталған',
  bayFree: 'Бос',
  bayBusy: 'Бос емес',
  bayShortLabel: 'Колонка №',
  notAtBay: 'ТРК-да жоқ',
  open24h: 'Тәулік бойы 24/7',
  distanceKmUnit: 'км',
  trackerStage1Title: 'Төлем өтті',
  trackerStage1Sub: 'Қаражат алынды, тапсырыс колонкаға берілді',
  trackerStage2Title: 'Құюшы келе жатыр',
  trackerStage2Sub: 'Оператор көлігіңізге қарай бет алды',
  trackerStage3Title: 'Газ құйылуда',
  trackerStage3Sub: 'Түтік қосылды, салон ішінде болыңыз',
  trackerStage4Title: 'Құю аяқталды',
  trackerStage4Sub: 'Қақпақ жабылды, жолыңыз болсын',
  trackerHeadlinePaid: 'Төлем расталды',
  trackerHeadlineApproaching: 'Құюшы көлігіңізге жақындап келеді',
  trackerHeadlineFuelingPrefix: 'Құйылуда:',
  trackerHeadlineCompleted: 'Құю сәтті аяқталды',
  trackerDescPaid: 'Көліктен шықпаңыз — бос құюшы тапсырысыңызды қабылдады.',
  trackerDescApproachingSuffix: 'сіздің көлігіңізге келе жатыр:',
  trackerDescFuelingMid: 'Құю түтігі колонкаға қосылды',
  trackerDescCompleted: 'Түтік ажыратылды, клапан жабылды. Электрондық чек тарихта сақталды.',
  trackerTariffLabel: 'Тариф',
  trackerVolumeFilledLabel: 'Құйылған көлем',
  trackerGoalLabel: 'Мақсат',
  trackerPaidFromCardLabel: 'Картадан төленді',
  trackerStatusLabel: 'Беру күйі',
  trackerStatusPaid: 'Постқа берілуде',
  trackerStatusEtaPrefix: 'Шамамен ~',
  trackerStatusEtaSec: 'сек келеді',
  trackerStatusFuelingPrefix: 'Газ беру',
  trackerStatusDone: 'Құю 100%',
  trackerStayInsideHint: 'Терезені ашудың қажеті жоқ — оператор көлік маркасы мен нөмірін көреді',
  trackerBtnAtCar: 'Оператор көлік жанында',
  trackerBtnStartFuel: 'Газ беруді бастау',
  trackerBtnFinishFuel: 'Құюды аяқтау',
  trackerRateLabel: 'Құюшының жұмысын бағалаңыз',
  trackerRateAriaPrefix: 'Баға',
  trackerNewOrderBtn: 'Жаңа құю',
  trackerAttendantCardTitle: 'Ауысымдағы құюшыңыз',
  trackerExperiencePrefix: 'Өтілі',
  trackerExperienceUnit: 'жыл',
  trackerUniformLabel: 'Көк dezagamiz формасы',
  trackerRolePaid: 'Тапсырыс сигналын алды',
  trackerRoleApproaching: 'Газ түтігімен колонкаға келе жатыр',
  trackerRoleFueling: 'Белгіленген көлемге дейін құюды бақылайды',
  trackerRoleCompleted: 'Көліктің құю қақпағын жапты',
  trackerCarVerifyPrefix: 'Колонкада салыстыру үшін көлігіңіз жіберілді:',
  trackerPaymentDetailsTitle: 'Төлем мәліметтері',
  trackerDetailStation: 'Бекет',
  trackerDetailBay: 'Колонка',
  trackerDetailFuel: 'Отын',
  trackerDetailCard: 'Карта',
  trackerDetailCashback: 'dezagamiz кэшбэгі',
  trackerDetailTotal: 'Жалпы төленді',
  stationsTitle: 'Өзбекстандағы жақын dezagamiz станциялары мен бағыт',
  stationsSubtitle:
    'Қажетті отын түрін (мысалы, пропан) таңдаңыз — қосымша нақты координаттармен ең жақын бекетке бағыт салады.',
  allCities: 'Барлық қалалар',
  allFuels: 'Барлық отын',
  goToFueling: 'Құюға өту',
  chooseStation: 'Бағыт салу және таңдау',
  attendantLabel: 'Оператор',
  fuelFilterLabel: 'Қажетті отын түрін таңдаңыз',
  useMyGps: 'Менің орным (GPS)',
  locatingGps: 'GPS анықталуда...',
  driverLocationLabel: 'Бастау нүктесі',
  searchOriginPlaceholder: 'Өзбекстандағы көшені немесе ауданды енгізіңіз...',
  nearestRouteTitle: 'Ең жақын бекетке ұсынылған бағыт',
  nearestFuelBadge: 'Ең жақын',
  coordinatesLabel: 'Нақты координаттар',
  routeDistanceLabel: 'Бағыт бойынша',
  routeEtaLabel: 'Жол уақыты',
  routeBuilding: 'Бағыт салынуда...',
  refuelHereBtn: 'Осы жерде құю',
  openGoogleMapsBtn: 'Google Картада ашу',
  routeStepsTitle: 'Бағыт нұсқаулары',
  findNearestOnMapBtn: 'Картадан ең жақынын табу',
  nearestStationRank: 'Ең жақын',
  gpsPermissionDenied: 'GPS қолжетімсіз. Қала ауданын таңдаңыз немесе мекенжай жазыңыз.',
  resolvingCoords: 'Google Maps арқылы нақты координаттар анықталуда...',
  noStationForFuel: 'Бұл сүзгіде таңдалған отын түрі бар бекет табылмады.',
  youAreHere: 'Сіз осындасыз',
  liveGpsOn: 'Live GPS (нақты уақытта)',
  liveGpsActive: 'Орналасу нақты уақытта жаңартылуда',
  stopLiveGps: 'GPS кідірту',
  nearbyPlacesTitle: 'Жақын маңдағы барлық орындар',
  nearbyPlacesLoading: 'Айналаңыздағы жақын орындар ізделуде...',
  nearbyPlacesEmpty: '3 км радиуста қосымша орындар табылмады.',
  nearbyAll: 'Барлық орындар',
  nearbyGas: 'Жақын АЗС',
  nearbyFood: 'Кафе және ас',
  nearbyStore: 'Дүкендер',
  nearbyService: 'Автосервис',
  showRouteMapBtn: 'Бағыт картасын көрсету',
  hideRouteMapBtn: 'Картаны жасыру',
  expandMapBtn: 'Картаны үлкейту',
  collapseMapBtn: 'Қалыпты өлшем',
  liveRouteModeTitle: 'Бағыт картасы және нақты уақыттағы орналасу',
  openPlaceOnMap: 'Картада көрсету',
  locationAccessTitle: 'Жақын станцияларды іздеу орны',
  locationModeMyLocation: 'Менің орналасуым',
  locationModeCity: 'Қаланы таңдау',
  locationGrantBtn: 'Геолокацияға рұқсат беру',
  locationGrantedBadge: 'Геолокация рұқсат етілген',
  locationBlockedHint:
    'Браузерде геолокация бұғатталған. Сайт баптауларынан рұқсат беріңіз немесе қаланы таңдаңыз.',
  nearestStationsSectionTitle: 'Ең жақын бекеттер',
  nearestFromMyGps: 'Сіздің орналасуыңызға жақын',
  nearestInCityPrefix: 'Қаладағы ең жақындары',
  mapLoadFailedNotice:
    'Интерактивті карта уақытша жүктелмеді (желі немесе Google Maps скрипті бұғатталған). Жақын бекеттер төменде қолжетімді.',
  retryMapBtn: 'Картаны қайта жүктеу',
  mapLayerRoadmap: 'Карта',
  mapLayerSatellite: 'Спутник',
  mapSatelliteLabels: 'Жазулар',
  mapView360Btn: '360° Панорама',
  mapExit360Btn: 'Картаға оралу',
  streetViewOpenExternal: 'Google Картада 360° ашу',
  streetViewDragHint: '360° шолу үшін экранды сырғытыңыз',
  streetViewSatelliteOrbitLabel: 'Бекеттің 360° спутниктік шолуы',
  streetViewStreetModeLabel: '360° Google көше панорамасы',
  streetViewUnavailableHint:
    'Бұл жерде көше түсірілімі жоқ — 360° спутниктік шолу ашылды',
  streetViewLoading: '360° панорама жүктелуде...',
  pegmanAriaLabel: '360° шолу (сары адамшаны картаға сүйреп апарыңыз)',
  pegmanDragTooltip: '360° үшін картаға сүйреңіз немесе басыңыз',
  pegmanDropAction: '360° көру үшін жіберіңіз',
  pegmanDroppedPointLabel: 'Картадағы 360° нүктесі',
  gpsSignalTimeout: 'GPS сигналы күтілуде — спутниктер ізделуде...',
  gpsSignalUnavailable: 'GPS сигналы уақытша қолжетімсіз — қайта тексерілуде...',
  mapFollowDriverBtn: 'Бақылау',
  mapFollowingDriver: 'GPS бақылауы',
  liveTelemetryUpdated: 'Жаңартылды',
  districtTashkentCenter: 'Ташкент · Орталық',
  districtChilonzor: 'Чиланзар',
  districtYunusobod: 'Юнусабад',
  districtSergeli: 'Сергели',
  historyTitle: 'Құю тарихы мен чектер',
  historySubtitle:
    'Байланған картадан жасалған барлық төлемдер және көлігіңізге қызмет көрсеткен құюшылар.',
  totalOrders: 'Барлық құюлар',
  totalMethane: 'Құйылған метан',
  totalPaid: 'Жалпы төленді',
  noOrdersTitle: 'Әзірге құюлар болған жоқ',
  noOrdersSubtitle:
    'Көліктен алғашқы төлемнен кейін мұнда газ көлемі мен құюшының аты жазылған цифрлық чек шығады.',
  receiptTitle: 'dezagamiz электрондық чегі',
  receiptBtn: 'Чек',
  historyColReceiptDate: 'Чек / Күні',
  historyColStationBay: 'Бекет және колонка',
  historyColFuel: 'Отын',
  historyColVolume: 'Көлем',
  historyColAmount: 'Сома',
  historyColAttendant: 'Оператор',
  historyColAction: 'Әрекет',
  historyCloseReceiptAria: 'Чекті жабу',
  historyDetailCar: 'Автокөлік',
  historyDetailBayFuel: 'Колонка және отын',
  historyDetailAttendant: 'Құюшы',
  historyDetailCardPay: 'Картамен төлем',
  historyDetailTotalCharged: 'Жалпы алынды',
  linkedCardsTitle: 'Байланған карталар',
  linkedCardsSubtitle:
    'Тұрақты кіру және салоннан төлеу үшін кемінде бір белсенді карта болуы шарт.',
  addCardBtn: 'Карта қосу',
  hideForm: 'Пішінді жасыру',
  primaryCard: 'Негізгі',
  makePrimary: 'Негізгі ету',
  saveCarData: 'Көлік деректерін сақтау',
  myVehiclesTitle: 'Менің көліктерім',
  addNewCarBtn: 'Жаңа көлік қосу',
  newCarModelLabel: 'Жаңа көлік маркасы мен моделі',
  newCarPlateLabel: 'Жаңа мемлекеттік нөмір',
  saveNewCarBtn: 'Көлікті қосу',
  activeCarBadge: 'Негізгі көлік',
  selectCarBtn: 'Таңдау',
  deleteCarLabel: 'Көлікті өшіру',
  carAddedSuccess: 'Жаңа көлік қосылды және негізгі ретінде таңдалды',
  profileUpdatedSuccess: 'Көлік және профиль деректері жаңартылды',
  profileSaveBtnError: 'Сақтау қатесі',
  profileNewCardNumberLabel: 'Жаңа карта нөмірі',
  profileBindNewCardBtn: 'Жаңа карта байлау',
  profileExpiryPrefix: 'Мерзімі',
  profileDeleteCardAriaPrefix: 'Картаны өшіру',
  profileAttendantSectionEyebrow: 'Құюшыға арналған деректер',
  profileDriverCarTitle: 'Жүргізуші және көлік',
  profileAttendantCarHint: 'Бекет операторы көлігіңіздің моделі мен нөміріне қарап таниды.',
  profileAccountPhoneLabel: 'Аккаунт телефоны',
  profileDriverNameLabel: 'Жүргізуші аты',
  personalCardEyebrow: 'Жүргізушінің арнайы отын картасы',
  personalCardTitle: 'Жеке dezagamiz картасы',
  personalCardSubtitle:
    'dezagamiz стилінде лезде шығару: комиссиясыз газ бен бензин төлемі және шотқа 5% дейін кэшбэк бонустары.',
  personalCardCta: 'dezagamiz картасын рәсімдеу',
  personalCardIssuing: 'Карта шығарылуда...',
  personalCardTierLabel: 'Карта тарифі',
  personalCardTierStandard: 'Стандарт',
  personalCardTierStandardDesc: 'Шығару 0 сум · 3% бонустық кэшбэк',
  personalCardTierPrime: 'Prime',
  personalCardTierPrimeDesc: 'Шығару 0 сум · 5% кэшбэк + басымдық',
  personalCardStyleLabel: 'Карта дизайны',
  personalCardStyleCobalt: 'Көк флагман',
  personalCardStyleArctic: 'Ақ хром',
  personalCardStyleNight: 'Түнгі Ташкент',
  personalCardInitialTopUp: 'Картадан бастапқы толықтыру',
  personalCardBalanceLabel: 'Карта балансы',
  personalCardBonusLabel: 'Кэшбэк бонустары',
  personalCardCashbackLabel: 'Кэшбэк',
  personalCardTopUpBtn: 'Балансты толтыру',
  personalCardTopUpConfirm: 'Картаға аудару',
  personalCardFreezeBtn: 'Мұздату',
  personalCardUnfreezeBtn: 'Белсендіру',
  personalCardFrozenBadge: 'Мұздатылған',
  personalCardActiveBadge: 'Белсенді',
  personalCardShowNumber: 'Нөмірді көрсету',
  personalCardHideNumber: 'Нөмірді жасыру',
  personalCardPayOption: 'Жеке dezagamiz картасы',
  personalCardIssuedSuccess: 'Жеке dezagamiz картасы рәсімделді және төлемге дайын!',
  personalCardTopUpSuccess: 'Жеке dezagamiz картасының балансы толықтырылды',
  personalCardIssuePromptLink: 'Жеке dezagamiz картасын ашу (5% дейін кэшбэк)',
  themeLight: 'Жарық',
  themeDark: 'Қараңғы',
  themeSwitchAria: 'Жарық және қараңғы тақырыпты ауыстыру',
  assistantTitle: 'Жеке Gemini ЖИ-көмекші',
  assistantSubtitle: 'АГНҚС бағыттары · Отын есебі · Жолға арналған музыка',
  assistantWelcome:
    'Сәлем! Мен Gemini негізіндегі dezagamiz жеке көмекшіңізбін. Ең жақын бекетті табамын, отын көлемін есептеймін немесе жолға арнап жеке әуен жазып беремін.',
  assistantPlaceholder: 'Құю, бағыт немесе жеке әуен жазу туралы сұраңыз...',
  assistantSendBtn: 'Жіберу',
  assistantThinking: 'Gemini жауап дайындауда...',
  assistantClearBtn: 'Тазарту',
  assistantActionOpenStation: 'Таңдалған бекетке өту',
  assistantActionPlayMelody: 'Жасалған әуенді қосу',
  assistantPrompt1: 'Қазір қай метан бекеті бос әрі ең жақын?',
  assistantPrompt2: '120 000 сумға неше м³ метан келетінін есептеп бер.',
  assistantPrompt3: 'Ташкентте түнгі сапарға арналған баяу әуен жазып бер.',
  assistantPrompt4: 'Құю сигналына жұмсақ дыбыс қойып, музыканы қос.',
  musicStudioTitle: 'Жеке музыка және әуендер',
  musicStudioSubtitle: 'Өз аудиофайлдарыңыз · Gemini әуендері · Құю сигналы',
  musicTabTracks: 'Менің тректерім',
  musicTabComposeAi: 'Gemini-де жасау',
  musicTabCustom: 'Өз файлым / Ноталар',
  musicPlayBtn: 'Ойнату',
  musicPauseBtn: 'Кідірту',
  musicNextBtn: 'Келесі',
  musicLoopLabel: 'Қайталау',
  musicVolumeLabel: 'Дыбыс',
  musicDownloadWavBtn: 'WAV жүктеу',
  musicChimeActiveLabel: 'Құю сигналы',
  musicSetChimeBtn: 'Сигнал ету',
  musicAutoPlayFuelLabel: 'Құю кезінде әуен ойнату',
  musicUploadTitle: 'Өз трегіңізді немесе әуеніңізді жүктеу',
  musicUploadHint: 'MP3, WAV, OGG немесе M4A (5 МБ дейін) · профиліңізде сақталады',
  musicUploadBtn: 'Аудиофайл таңдау',
  musicUploading: 'Жүктелуде...',
  musicComposePromptLabel: 'Әуен көңіл-күйі немесе стилі',
  musicComposePromptPlaceholder: 'Мысалы: Ташкент түніне арналған жылы ло-фай әуені',
  musicComposeBpmLabel: 'Темп (BPM)',
  musicComposePresetLabel: 'Аспап',
  musicComposeBtn: 'Gemini-де әуен жазу',
  musicComposing: 'Gemini әуен жазуда...',
  musicSequencerTitle: 'Жеке әуен редакторы (16 қадам)',
  musicSequencerHint: 'Ноталарды басып тыңдаңыз, содан кейін сақтаңыз',
  musicSaveCustomBtn: 'Өз әуенімді сақтау',
  musicCustomTitlePlaceholder: 'Әуен атауы',
  musicQuickCardTitle: 'Жеке музыка және Gemini көмекші',
  musicOpenStudioBtn: 'Көмекші мен музыканы ашу',
  musicPresetRhodes: 'Rhodes',
  musicPresetWarmPad: 'Жылы пэд',
  musicPresetPluck: 'Шертпе',
  musicPresetChime: 'Қоңырауша',
  musicPresetBass: 'Бас-грув',
  musicMood1: 'Түнгі Ташкент · жолға арналған баяу ло-фай',
  musicMood2: 'Тасжолдағы сергек таңғы ырғақ',
  musicMood3: 'Шығыс таңы · жеңіл аспаптық әуен',
  musicMood4: 'Құю аяқталғандағы таза жұмсақ белгі',
  musicSourceGemini: 'Gemini AI',
  musicSourceFile: 'Файл',
  musicSourceCustom: 'Жеке әуен',
  musicSourcePreset: 'Пресет',
  musicDeleteTrackAria: 'Тректі өшіру',
  musicComposeSuccessPrefix: '«',
  musicComposeSuccessSuffix: '» әуені жасалып, кітапханаға қосылды.',
  musicUploadSuccessPrefix: '«',
  musicUploadSuccessSuffix: '» трегі профиліңізге жүктелді.',
  musicCustomSavedPrefix: '«',
  musicCustomSavedSuffix: '» әуені сақталып, қосылды.',
  musicSelectAtLeastOneNote: 'Торда кемінде бір нотаны белгілеңіз.',
  musicPreset1Title: 'Ташкент · Түнгі сапар',
  musicPreset1Sub: 'Жұмсақ Rhodes · Жолға арналған ло-фай атмосфера',
  musicPreset2Title: 'Самарқанд · Таңсәрі',
  musicPreset2Sub: 'Шертпе синтез · Жеңіл шығыс сазы',
  musicPreset3Title: 'dezagamiz құю сигналы',
  musicPreset3Sub: 'Колонка дайындығының таза хрусталь қоңырауы',
  assistantPromptGreeting: 'Сәлем! Қажетті бөлімді көрсетші',
  assistantActionGoTo: 'Бөлімді ашу:',
  assistantActionThemeDark: 'Қараңғы тақырып қосылды',
  assistantActionThemeLight: 'Жарық тақырып қосылды',
  assistantActionThemeToggled: 'Тақырып ауыстырылды',
  assistantActionLangChanged: 'Тіл өзгертілді',
  assistantActionGpsOn: 'Live GPS қосылды',
  assistantActionGpsOff: 'Live GPS өшірілді',
  assistantErrReply: 'Gemini-ден жауап алу мүмкін болмады.',
  musicDefaultComposePrompt: 'Қала бойынша түнгі сапарға арналған баяу ло-фай ырғағы',
  musicDefaultCustomTitle: 'Менің жол әуенім',
  musicPreviewDefaultTitle: 'Алдын ала тыңдау',
  musicCustomFallbackTitle: 'Менің әуенім',
  musicComposeFailedErr: 'Gemini-де әуен жазу қатесі.',
  musicUploadFailedErr: 'Файлды жүктеу мүмкін болмады.',
  musicSaveCustomFailedErr: 'Әуенді сақтау мүмкін болмады.',
  musicPlaybackAudioErr: 'Аудиофайлды ойнату мүмкін болмады.',
  musicPlaybackBlockedErr: 'Браузерде дыбысты қосу үшін Play батырмасын басыңыз.',
  musicFileTooLargeErr: 'Аудиофайлдың ең үлкен өлшемі — 5 МБ.',
  musicFileReadErr: 'Файлды оқу мүмкін болмады',
  musicUploadTrackFallback: 'Менің трегім',
  creatorShowCodeAria: 'Кодты көрсету',
  creatorHideCodeAria: 'Кодты жасыру',
  sampleFullNamePlaceholder: 'Әзізбек Кәрімов',
  sampleCardHolderPlaceholder: 'ӘЗІЗБЕК КӘРІМОВ',
  personalCardDriverFallback: 'ЖҮРГІЗУШІ КАРТАСЫ',
  meterUnit: 'м',
  languageSelectorAria: 'Қосымша тілін таңдау',
  creatorLoadErr: 'Жасаушы панелін жүктеу мүмкін болмады',
  creatorLockErr: 'Жасаушы бөлімін құлыптау мүмкін болмады',
  creatorUpdateStationErr: 'Станцияны жаңарту қатесі',
  creatorAdvanceOrderErr: 'Тапсырыс мәртебесін өзгерту мүмкін болмады',
  driverMarkerSelf: 'Мен',
  closeAria: 'Жабу',
  zoomInAria: 'Жақындату',
  zoomOutAria: 'Алыстату',
  entryModeAria: 'Кіру режимі',
  primaryNavAria: 'Негізгі навигация',
  mobileNavAria: 'Мобильді навигация',
  rotateLeftAria: 'Солға 45° бұру',
  rotateRightAria: 'Оңға 45° бұру',
  fuelMetan: 'Метан',
  fuelPropan: 'Пропан',
  fuelAi92: 'АИ-92',
  fuelAi95: 'АИ-95',
  fuelMetanFull: 'Метан (CNG)',
  fuelPropanFull: 'Пропан (LPG)',
  fuelAi92Full: 'Бензин АИ-92',
  fuelAi95Full: 'Бензин АИ-95',
  pressure200Bar: '200 бар',
  pressure16Bar: '16 бар',
  currencyUzs: 'сум',
  unitM3: 'м³',
  unitLiter: 'л',
  musicPreset4Title: 'Регистан · Жол драйвы',
  musicPreset4Sub: 'Жолға арналған сергек синт-грув пен терең бас',
  navShowcase: 'Қорғау',
  navShowcaseShort: 'Қорғау',
  openShowcaseBtn: 'Презентация және жобаны қорғау',
  launchJuryDemoBtn: 'Тікелей қосымшаны ашу (Демо)',
  showcaseBackToGate: 'Кіруге оралу',
  showcaseTitle: 'Байқау презентациясы және қорғау',
  showcaseSubtitle: 'Сахна слайдтары, қазылар мен ата-аналар сұрақтарына жауаптар, үнем мен табыс калькуляторлары',
  showcaseProjectorModeOn: 'Проектор (таза)',
  showcaseSpeakerNotesOn: 'Спикер кеңесі',
  showcaseSpeakerCueLabel: 'Залға айтыңыз:',
  showcaseTimerLabel: 'Сахна таймері',
  showcaseTimerStart: 'Бастау',
  showcaseTimerPause: 'Кідірту',
  showcaseTimerReset: 'Қалпына',
  showcaseTarget3Min: 'Мақсат: 3:00',
  showcaseTabSlides: 'Слайдтар',
  showcaseTabSavings: 'Отбасы үнемі',
  showcaseTabDefense: 'Сұрақтардан қорғау',
  showcaseTabMonetization: 'Табыс табу',
  showcaseTabChecklist: 'Сахна жоспары',
  showcasePrevSlide: 'Артқа',
  showcaseNextSlide: 'Келесі слайд',
  showcaseShowLiveBtn: 'Тікелей көрсету',
  showcaseQuizModeBtn: '30с жаттығу',
  showcaseQuizNextBtn: 'Келесі сұрақ',
  showcaseQuizRevealBtn: 'Жауапты көрсету',
  showcaseQuizHideBtn: 'Жауапты жасыру',
  showcaseQuizTimerLabel: 'Жауап уақыты',
  showcaseFilterAll: 'Барлық сұрақтар',
  showcaseFilterParents: 'Ата-аналардан',
  showcaseFilterJury: 'Қазылардан',
  showcaseFilterBusiness: 'Табыс туралы',
  showcaseSavingsTitle: 'Метанмен отбасылық үнем калькуляторы',
  showcaseSavingsSubtitle: 'Айлық және жылдық салыстыру: Метан + 5% кэшбэк пен АИ-92 бензині',
  showcaseMonthlyKmLabel: 'Айлық жүріс',
  showcaseConsumptionLabel: '100 км-ге орташа шығын',
  showcaseOutMonthlySavings: 'Айлық үнем',
  showcaseOutYearlySavings: 'Жылдық отын үнемі',
  showcaseOutPrimeCashback: 'Жылдық 5% кэшбэк (Prime)',
  showcaseOutTotalBenefit: 'Отбасының жылдық жалпы пайдасы',
  showcaseOutCo2Saved: 'Жылдық CO₂ азаюы',
  showcaseOutTimeSaved: 'Кезексіз үнемделген уақыт',
  unitKgShort: 'кг',
  unitHourShort: 'сағ',
  unitMinShort: 'мин',
  showcaseMonetizeTitle: 'Қосымшадан қазір қалай ақша табуға болады',
  showcaseMonetizeSubtitle: 'Банк лицензиясынсыз 4 оңай жол және табыс есебі',
  showcaseStationsCountLabel: 'Қосылған жеке бекеттер саны',
  showcaseCarsPerDayLabel: '1 бекетте күніне тапсырыс саны',
  showcaseOutMonthlyOrders: 'Айлық тапсырыс',
  showcaseOutSubIncome: 'Бекет жазылымы (200 мың/ай)',
  showcaseOutFeeIncome: 'Серіктестік ақы (700 сум/чек)',
  showcaseOutAdIncome: 'Картадағы кафе/мойка жарнамасы',
  showcaseOutMonthlyRevenue: 'Айлық табыс болжамы',
  showcaseOutYearlyRevenue: 'Жылдық табыс болжамы',
  showcaseChecklistTitle: 'Сахнада мінсіз көрсету тізімі',
  showcaseChecklistSubtitle: 'Көрсетілім кезінде қадамдарды белгілеп отырыңыз',
  showcaseChecklistProgress: 'Орындалған қадам',
  safetyMetanRule: 'Кассаға кезексіз онлайн төлеңіз. Назар аударыңыз: метан құю кезінде қауіпсіздік ережесі бойынша салоннан шығып, капотты ашу қажет.',
  safetyStayInCarNote: '«Көліктен шықпай» режимі — құюшыны салон ішінде күтіңіз',
  trackerExitForMetanHint: 'АГНҚС қауіпсіздік ережесі бойынша метан құю кезінде салоннан шығып, капотты ашыңыз',
  carSupportedFuelsLabel: 'Көлікке үйлесімді отын',
  carFuelAutoSelected: 'Көлік үлгіңізге сәйкес отын түрі автоматты таңдалды',
  carNoGboHybridWarn: 'Бұл үлгі (ГБЖ-сыз гибрид/бензин) тек АИ-92 және АИ-95 қолдайды. Метан мен Пропан жарамайды.',
  carEvOnlyWarn: 'Электромобиль таңдалған: газ және бензин құю жарамайды. Гараждан басқа көлік таңдаңыз немесе ЭЗС қолданыңыз.',
  bayCodeTitle: 'Бөтен бағанға қате төлемнен қорғау',
  bayCodeLabel: 'Баған экранындағы растау коды',
  bayCodePlaceholder: 'Экрандағы 4 сан',
  bayCodeAutofillBtn: 'Демо-кодты қою',
  bayCodeScanQrBtn: 'Бағандағы QR кодты сканерлеу',
  bayCodeScanningQr: 'Баған QR коды сканерленуде...',
  bayCodeVerifiedBadge: 'Баған расталды',
  bayCodeDemoHintPrefix: 'Баған таблосындағы код',
  errBayCodeMismatch: 'Таңдалған баған экранындағы 4 таңбалы кодты енгізіңіз немесе QR-кодты сканерлеңіз',
  compactLocationTitle: 'Қала және ең жақын бекет',
  howItWorksToggleOpen: 'Бұл қалай жұмыс істейді?',
  howItWorksToggleClose: 'Нұсқаулықты жасыру',
  secretAdminActivatedToast: 'Құпия әкімші кіруі іске қосылды. Әкімші кодын енгізу терезесін ашу үшін «Шығу» түймесін басыңыз.',
  secretAdminBackToDriverBtn: 'Жүргізуші кіруіне оралу',
  sortNearestLabel: 'Ең жақын',
  sortBestNearbyLabel: 'Жақындағы үздік',
  bestMatchBadge: 'Үздік таңдау',
  stationStatusOpen: 'Ашық',
  stationStatusBusy: 'Жүктеме жоғары',
  stationStatusMaint: 'Техникалық қызмет',
  queueLowLabel: 'Кезексіз',
  queueMediumLabel: 'Орташа кезек',
  queueHighLabel: 'Ұзын кезек',
  geoFallbackCityNotice: 'Геолокация қолжетімсіз — қашықтық таңдалған қала орталығынан есептелді',
  mapFallbackActiveNote: 'Кіріктірілген интерактивті бекет картасы белсенді',
  carMatchOk: 'Көлікке сай',
  carMatchNo: 'Сәйкес отын жоқ',
  showcaseBackToApp: 'Құюға оралу',
  creatorOperationalStatusLabel: 'Бекеттің жұмыс мәртебесі',
  creatorQueueLevelLabel: 'Жүктеме және кезек деңгейі',
  creatorFuelAvailabilityLabel: 'Отын түрлерінің қолжетімділігі',
  creatorFuelOn: 'Қосулы',
  creatorFuelOff: 'Өшірулі',
  creatorDemoEventsTitle: 'Оқиғалар мен тексерістер журналы',
  creatorDemoEventsEmpty: 'Оқиғалар жоқ — бекет күйін өзгертіңіз немесе баған кодын тексеріңіз',
  creatorSafetySandboxTitle: 'Қауіпсіздік ережелері мен баған кодтарын тексеру',
  creatorSafetySandboxSub: 'Қазылар мен ата-аналарға көлік үлгісіне сай отын таңдауды, метанға арналған АГНҚС қауіпсіздік ережесін және 4 таңбалы кодты тексеруді көрсетіңіз',
  creatorTestCarLabel: 'Сынақ көлік үлгісі',
  creatorTestFuelLabel: 'Сыналатын отын түрі',
  creatorTestBayLabel: 'Сынақ бағаны',
  creatorTestCodeInputLabel: 'Енгізілген код',
  creatorRunCheckBtn: 'Қорғаныс пен ҚЕ тексеру',
  creatorCheckPassed: 'Рұқсат етілді: баған коды сәйкес, отын көлікке сай',
  creatorCheckBlockedCode: 'Бұғатталды: баған коды қате (бөтен бағаннан қорғау)',
  creatorCheckBlockedFuel: 'Ескерту: бұл отын таңдалған көлік үлгісіне жарамайды',
};

const TR: TranslationBundle = {
  loadingTitle: 'dezagamiz',
  loadingSubtitle: 'İstasyonlara bağlanılıyor ve erişim doğrulanıyor...',
  loadingReadySubtitle: 'Özbekistan istasyonları ve tarifeleri bağlandı · Açılmaya hazır',
  loadingWaitBtn: 'Uygulama yükleniyor...',
  enterAppBtn: 'Uygulamaya geç',
  splashFooterMeta: 'CNG ve Yakıt Ağı · Araçtan çıkmadan ödeme',
  enteringApp: 'dezagamiz uygulamasına giriliyor...',
  gateBadge: 'Kart kaydı veya 3 günlük Misafir modu',
  heroEyebrow: 'Özbekistan Genelinde CNG ve Yakıt Ağı',
  heroTitle: 'Aracınızdan inmeden ödeyin — görevli yanınıza gelsin',
  heroSubtitle:
    'Sıcakta veya soğukta dışarı çıkmanıza ya da kasada sıra beklemenize gerek yok. dezagamiz istasyonunda peronu seçin, kayıtlı kartınızla ödeyin — görevlimiz saniyeler içinde dolum yapsın.',
  heroImageAlt: 'Taşkent mavi-beyaz tarzda dezagamiz yakıt istasyonu',
  step1Label: 'Adım 01',
  step1Title: 'Araç kaydı',
  step1Desc: 'Görevli aracınızı perondaki plakadan tanır',
  step2Label: 'Adım 02',
  step2Title: 'Kart bağlama',
  step2Desc: 'Anında ödeme için Uzcard, Humo, Visa veya Mastercard',
  step3Label: 'Adım 03',
  step3Title: 'Gaz dolumu',
  step3Desc: 'Ödemeden sonra görevli gelip aracınızı doldurur',
  heroCities: 'Taşkent · Semerkant · Buhara · Fergana',
  heroPriceFrom: 'Metan 5.700 som/m³ başlangıç',
  tabRegister: 'Kayıt Ol',
  tabLogin: 'Giriş',
  tabGuest: 'Misafir (3g)',
  tabCreator: 'Kurucu',
  stage1Of2: 'Adım 1 / 2',
  stage2Of2: 'Adım 2 / 2',
  driverAndCar: 'Sürücü ve Araç',
  cardBinding: 'Kart Bağla',
  fullNameLabel: 'Sürücü ad soyadı',
  phoneLabel: 'Telefon numarası (Özbekistan)',
  carModelLabel: 'Araç marka ve modeli',
  plateNumberLabel: 'Plaka numarası',
  preferredFuelLabel: 'Ana yakıt türü',
  nextBindCard: 'İleri: kart bağla',
  back: 'Geri',
  bindCardAndEnter: 'Kartı bağla ve gir',
  checkingCard: 'Kart doğrulanıyor...',
  cardExpiryLabel: 'AA/YY',
  cardCvcLabel: 'CVC / Kod',
  cardHolderLabel: 'Kart Sahibinin Adı',
  cardPreviewLabel: 'Bağlı ödeme kartı',
  cardPreviewExpiryLabel: 'Son Kullanma',
  loginTitle: 'Kayıtlı sürücüler için giriş',
  loginSubtitle:
    'Sadece aracını kaydedip banka kartı bağlamış sürücüler giriş yapabilir.',
  loginButton: 'dezagamiz’e giriş yap',
  checkingAccount: 'Hesap kontrol ediliyor...',
  firstTimeHint: 'İlk kez mi geliyorsunuz? Kayıt Ol sekmesine geçin',
  errEnterFullName: 'Lütfen adınızı ve soyadınızı girin',
  errEnterUzPhone: 'Özbekistan telefon numarasını +998 XX XXX XX XX biçiminde girin',
  errEnterCarModel: 'Araç marka ve modelini girin (örn. Chevrolet Cobalt)',
  errEnterUzPlate: 'Geçerli bir Özbekistan plakası girin (örn. 01 A 777 AA)',
  errCheckCardNumber: 'Banka kartı numaranızı kontrol edin',
  errEnterCardExpiry: 'Geçerli son kullanma tarihini girin (AA/YY)',
  errEnterCardHolder: 'Kart sahibinin adını girin',
  errEnterCardCvc: '3 haneli CVC/CVV kodunu girin',
  errRegisterFailed: 'Kayıt tamamlanamadı',
  errLoginFailed: 'Giriş yapılamadı. Kaydınızı ve bağlı kartınızı kontrol edin.',
  errCreatorCodeInvalid: 'Kurucu kodu geçersiz',
  errChooseRoleFailed: 'Giriş modu seçilemedi',
  errSelectFreeBay: 'Lütfen müsait bir peron seçin',
  errFuelNotOnBay: 'Seçilen yakıt bu peronda mevcut değil',
  errMinFuelAmount: 'Minimum dolum tutarı 10.000 somdur',
  errPersonalCardFrozen:
    'Kişisel dezagamiz kartınız dondurulmuş. Kart & Araç sekmesinden etkinleştirin.',
  errPersonalCardLowFunds:
    'Kişisel dezagamiz kartınızda bakiye yetersiz. Kart & Araç sekmesinden bakiye yükleyin.',
  errBindCardToPay: 'Ödeme yapmak için banka kartı bağlayın',
  errPaymentFailed: 'Ödeme gerçekleştirilemedi',
  errSwitchCarFailed: 'Araç değiştirilemedi',
  errAddCarFailed: 'Araç eklenemedi',
  errSwitchCarProfileFailed: 'Araç değiştirilemedi',
  errDeleteCarFailed: 'Araç silinemedi',
  errAddCardFailed: 'Kart eklenemedi',
  errSwitchCardFailed: 'Kart değiştirilemedi',
  errDeleteLastCard: 'Tek kayıtlı kart silinemez',
  errIssueCardFailed: 'Kart oluşturulamadı',
  errTopUpCheck: 'Yükleme tutarını kontrol edin',
  errTopUpMin: 'Minimum yükleme tutarı 10.000 som',
  errTopUpMax: 'Tek seferlik maksimum yükleme 5.000.000 som',
  errCardDigits: '16 haneli kart numarasını girin',
  errCardNetwork: 'Desteklenen kartlar: Uzcard (8600), Humo (9860), Visa ve Mastercard',
  errCardLuhn: 'Geçersiz kart kontrol numarası',
  errTopUpFailed: 'Kart bakiyesi yüklenemedi',
  errCardDesignFailed: 'Kart tasarımı güncellenemedi',
  errCardFreezeFailed: 'Kart durumu değiştirilemedi',
  guestTitle: '3 Günlük Misafir Modu',
  guestSubtitle:
    'Kartınızı bağlamadan uygulama içi dolumu ve canlı takibi deneyin. Misafir erişimi kesin olarak 3 gün (72 saat) ile sınırlıdır.',
  guestRuleBadge: 'Sınır: en fazla 3 gün',
  guestLimitItem1: 'Tüm istasyonlar, gerçek Özbekistan fiyatları ve araç içi sipariş açık.',
  guestLimitItem2: '3 günlük sayaç cihazınıza bağlıdır ve uzatılamaz.',
  guestLimitItem3: '3 günden sonra devam etmek için kartla kayıt gerekir.',
  guestStartButton: '3 Günlük Misafir Olarak Gir',
  guestStarting: 'Misafir oturumu açılıyor...',
  guestExpiredNotice:
    '3 günlük misafir süreniz doldu. Devam etmek için kayıt olup kart bağlayın.',
  guestBannerLabel: 'Misafir modu · kalan',
  guestUpgradeButton: 'Kayıt ol ve kart bağla',
  creatorTitle: 'Kurucu Erişimi',
  creatorSubtitle:
    'Yönetici veya Normal Kullanıcı modunu seçmek için gizli parolayı girin.',
  creatorCodeLabel: 'Kurucu kodu',
  creatorCodePlaceholder: 'Gizli kodu girin',
  verifyPassword: 'Parolayı doğrula',
  verifyingPassword: 'Doğrulanıyor...',
  passwordConfirmed: 'Parola doğrulandı',
  chooseRoleTitle: 'Giriş modunu seçin',
  chooseRoleSubtitle:
    'İstasyonları ve fiyatları yönetmek için Yönetici olarak veya dolum için Normal Kullanıcı olarak girin.',
  roleAdminTitle: 'Yönetici',
  roleAdminDesc: 'İstasyon fiyatlarını, peronları, siparişleri ve sürücüleri yönetin.',
  enterAsAdmin: 'Yönetici olarak gir',
  roleDriverTitle: 'Normal Kullanıcı',
  roleDriverDesc: 'Standart sürücü modu: peron seçin, kartla ödeyin ve dolum yapın.',
  enterAsDriver: 'Normal kullanıcı olarak gir',
  creatorAccessBadge: 'Özel Erişim · Kod Doğrulandı',
  creatorPanelTitle: 'dezagamiz Kurucu Paneli',
  creatorPanelSubtitle:
    'Özbekistan genelindeki gaz ve yakıt fiyatlarını, peronları ve sürücüleri yönetin.',
  creatorDriverModeBadge: 'Mod: Normal Kullanıcı',
  creatorLockBtn: 'Kurucu panelini kilitle',
  creatorExitBtn: 'Kurucu panelinden çık',
  creatorLoadingMetrics: 'dezagamiz ağ verileri yükleniyor...',
  creatorStatDrivers: 'Kartlı sürücüler',
  creatorStatOrders: 'Siparişler',
  creatorStatActivePrefix: 'aktif',
  creatorStatMethane: 'Verilen metan',
  creatorStatRevenue: 'Ağ cirosu',
  creatorStationManageEyebrow: 'İstasyon yönetimi',
  creatorStationManageTitle: 'Tarifeler ve peronlar',
  creatorSelectStationLabel: 'İstasyon seçin',
  creatorPricesLabel: 'Fiyatlar (m³ / L başına)',
  creatorBaysStatusLabel: 'İstasyon peron durumu',
  creatorApplyStationBtn: 'İstasyon değişikliklerini uygula',
  creatorSavingStationBtn: 'Kaydediliyor...',
  creatorStationUpdatedMsg: 'Tarifeler ve peron durumu tüm sürücüler için güncellendi',
  creatorOrdersTitle: 'Dolum siparişleri',
  creatorOrdersEmpty:
    'Henüz sipariş yok. Sürücü aracından ödeme yaptığında sipariş burada görünür.',
  creatorColReceiptCar: 'Fiş / Araç',
  creatorColStationBay: 'İstasyon / Peron',
  creatorColAmount: 'Tutar',
  creatorColStatus: 'Durum',
  creatorColControl: 'Kontrol',
  creatorStagePaid: 'Ödendi',
  creatorStageApproaching: 'Görevli yaklaşıyor',
  creatorStageFueling: 'Dolum yapılıyor',
  creatorStageCompleted: 'Tamamlandı',
  creatorNextStageBtn: 'Sonraki aşama',
  creatorDoneLabel: 'Tamam',
  creatorDriversTitle: 'Kayıtlı sürücüler',
  creatorDriversEmpty: 'Henüz bağlı kartı olan kayıtlı sürücü yok.',
  creatorColDriver: 'Sürücü',
  creatorColPhone: 'Telefon',
  creatorColCarPlate: 'Araç ve plaka',
  creatorColLinkedCard: 'Bağlı kart',
  navFuel: 'Dolum',
  navStations: 'İstasyonlar',
  navAssistant: 'Asistan',
  navHistory: 'Geçmiş',
  navCards: 'Kart & Araç',
  navCardsShort: 'Kart',
  navCreator: 'Kurucu',
  navAdminPanel: 'Yönetici Paneli',
  navAdminShort: 'Yönetici',
  navDriverShort: 'Sürücü',
  switchToDriver: 'Normal Kullanıcı',
  switchToAdmin: 'Yönetici',
  logout: 'Çıkış',
  fuelTitle: 'Araçtan inmeden yakıt dolumu',
  fuelSubtitle:
    'Bağlı kartınızdan istediğiniz tutarı ödeyin — dezagamiz görevlisi yanınıza gelip dolum yapsın.',
  yourCar: 'Aracınız',
  selectStationStep: '1. Özbekistan’daki istasyon',
  selectBayStep: '2. Durduğunuz peron numarası',
  freeBaysCount: 'Müsait',
  selectFuelStep: '3. Perondaki gaz veya yakıt türü',
  amountStep: '4. Dolum tutarı',
  fullTank: 'Tam depo',
  payWithCardLabel: 'Bağlı kartla ödeme',
  cardsCountLabel: 'Kartlar',
  payFromCarBtn: 'Araçtan öde',
  processingPayment: 'Ödeme işleniyor...',
  howItWorksTitle: 'Dolum nasıl yapılır?',
  howStep1: 'Camları kapalı tutarak aracınızda kalın ve istediğiniz tutarı ödeyin.',
  howStep2Prefix: 'Perondaki nöbetçi görevli',
  howStep3: 'Görevli gaz tabancasını bağlar ve ödenen miktara kadar dolumu yapar.',
  driverProfileActive: 'Sürücü profili aktif',
  cardVerifiedText: 'Kartla güvenli ödeme doğrulandı',
  bayFree: 'Müsait',
  bayBusy: 'Dolu',
  bayShortLabel: 'Peron №',
  notAtBay: 'Mevcut değil',
  open24h: '7/24 Açık',
  distanceKmUnit: 'km',
  trackerStage1Title: 'Ödeme onaylandı',
  trackerStage1Sub: 'Tutar çekildi, sipariş perona iletildi',
  trackerStage2Title: 'Görevli yaklaşıyor',
  trackerStage2Sub: 'Operatör aracınıza doğru yürüyor',
  trackerStage3Title: 'Gaz dolumu yapılıyor',
  trackerStage3Sub: 'Tabanca bağlı, aracınızın içinde kalın',
  trackerStage4Title: 'Dolum tamamlandı',
  trackerStage4Sub: 'Yakıt kapağı kapatıldı, güvenle ayrılabilirsiniz',
  trackerHeadlinePaid: 'Ödeme onaylandı',
  trackerHeadlineApproaching: 'Görevli aracınıza doğru geliyor',
  trackerHeadlineFuelingPrefix: 'Dolum yapılıyor:',
  trackerHeadlineCompleted: 'Dolum başarıyla tamamlandı',
  trackerDescPaid: 'Araçtan inmeyin — müsait görevli siparişinizi aldı.',
  trackerDescApproachingSuffix: 'aracınıza geliyor:',
  trackerDescFuelingMid: 'Dolum tabancası perona bağlandı',
  trackerDescCompleted: 'Tabanca ayrıldı, valf kapatıldı. Dijital fiş geçmişe kaydedildi.',
  trackerTariffLabel: 'Tarife',
  trackerVolumeFilledLabel: 'Doldurulan miktar',
  trackerGoalLabel: 'Hedef',
  trackerPaidFromCardLabel: 'Karttan ödendi',
  trackerStatusLabel: 'Dolum durumu',
  trackerStatusPaid: 'Perona aktarılıyor',
  trackerStatusEtaPrefix: 'Yaklaşık ~',
  trackerStatusEtaSec: 'sn içinde',
  trackerStatusFuelingPrefix: 'Gaz akışı',
  trackerStatusDone: '%100 Tamamlandı',
  trackerStayInsideHint: 'Camı açmanıza gerek yok — görevli aracınızı ve plakanızı görür',
  trackerBtnAtCar: 'Görevli aracın yanında',
  trackerBtnStartFuel: 'Dolumu başlat',
  trackerBtnFinishFuel: 'Dolumu bitir',
  trackerRateLabel: 'Görevliyi puanlayın',
  trackerRateAriaPrefix: 'Puan',
  trackerNewOrderBtn: 'Yeni dolum',
  trackerAttendantCardTitle: 'Vardiyadaki görevliniz',
  trackerExperiencePrefix: 'Deneyim',
  trackerExperienceUnit: 'yıl',
  trackerUniformLabel: 'Mavi dezagamiz üniforması',
  trackerRolePaid: 'Sipariş sinyalinizi aldı',
  trackerRoleApproaching: 'Gaz tabancasıyla perona doğru geliyor',
  trackerRoleFueling: 'Ödenen miktara kadar dolumu kontrol ediyor',
  trackerRoleCompleted: 'Aracın dolum kapağını kapattı',
  trackerCarVerifyPrefix: 'Peronda doğrulama için aracınız iletildi:',
  trackerPaymentDetailsTitle: 'Ödeme ayrıntıları',
  trackerDetailStation: 'İstasyon',
  trackerDetailBay: 'Peron',
  trackerDetailFuel: 'Yakıt',
  trackerDetailCard: 'Kart',
  trackerDetailCashback: 'dezagamiz Cashback',
  trackerDetailTotal: 'Toplam ödenen',
  stationsTitle: 'Yakın dezagamiz İstasyonları ve Rota',
  stationsSubtitle:
    'İstediğiniz yakıtı (ör. Propan) seçin — uygulama doğrulanan koordinatlarla en yakın istasyona rota çizer.',
  allCities: 'Tüm şehirler',
  allFuels: 'Tüm yakıtlar',
  goToFueling: 'Doluma geç',
  chooseStation: 'Rota oluştur ve seç',
  attendantLabel: 'Görevli',
  fuelFilterLabel: 'İhtiyacınız olan yakıtı seçin',
  useMyGps: 'GPS konumumu kullan',
  locatingGps: 'GPS bulunuyor...',
  driverLocationLabel: 'Başlangıç noktası',
  searchOriginPlaceholder: 'Özbekistan’da sokak veya semt arayın...',
  nearestRouteTitle: 'En yakın uygun istasyona önerilen rota',
  nearestFuelBadge: 'En yakın',
  coordinatesLabel: 'Doğrulanmış koordinatlar',
  routeDistanceLabel: 'Rota mesafesi',
  routeEtaLabel: 'Sürüş süresi',
  routeBuilding: 'Rota hesaplanıyor...',
  refuelHereBtn: 'Burada dolum yap',
  openGoogleMapsBtn: "Google Haritalar'da aç",
  routeStepsTitle: 'Adım adım yönlendirme',
  findNearestOnMapBtn: 'Haritada en yakını bul',
  nearestStationRank: 'En yakın',
  gpsPermissionDenied: 'GPS erişimi yok. Bir ilçe seçin veya adres yazın.',
  resolvingCoords: 'Google Haritalar üzerinden koordinatlar doğrulanıyor...',
  noStationForFuel: 'Bu filtrede seçilen yakıta uygun istasyon bulunamadı.',
  youAreHere: 'Buradasınız',
  liveGpsOn: 'Canlı GPS (gerçek zamanlı)',
  liveGpsActive: 'Konum gerçek zamanlı güncelleniyor',
  stopLiveGps: 'GPS duraklat',
  nearbyPlacesTitle: 'Yakındaki tüm yerler',
  nearbyPlacesLoading: 'Konumunuzun çevresindeki yerler aranıyor...',
  nearbyPlacesEmpty: '3 km yarıçap içinde ek yer bulunamadı.',
  nearbyAll: 'Tüm yerler',
  nearbyGas: 'Yakıt istasyonları',
  nearbyFood: 'Kafe ve yemek',
  nearbyStore: 'Mağazalar',
  nearbyService: 'Oto servis',
  showRouteMapBtn: 'Rota haritasını göster',
  hideRouteMapBtn: 'Haritayı gizle',
  expandMapBtn: 'Haritayı büyüt',
  collapseMapBtn: 'Normal boyut',
  liveRouteModeTitle: 'Canlı rota haritası ve gerçek zamanlı konum',
  openPlaceOnMap: 'Haritada göster',
  locationAccessTitle: 'Konum izni veya şehir seçimi',
  locationModeMyLocation: 'Benim konumum',
  locationModeCity: 'Şehir seç',
  locationGrantBtn: 'Konum erişimine izin ver',
  locationGrantedBadge: 'Konum erişimi aktif',
  locationBlockedHint:
    'Tarayıcı ayarlarında konum erişimi engellendi. İzin verin veya aşağıdan şehir seçin.',
  nearestStationsSectionTitle: 'En yakın istasyonlar',
  nearestFromMyGps: 'Konumunuza en yakın',
  nearestInCityPrefix: 'Şehirdeki en yakınlar',
  mapLoadFailedNotice:
    'Etkileşimli Google Haritalar yüklenemedi (ağ veya engelleyici). En yakın istasyonlar aşağıda çalışmaya devam ediyor.',
  retryMapBtn: 'Haritayı yeniden dene',
  mapLayerRoadmap: 'Harita',
  mapLayerSatellite: 'Uydu',
  mapSatelliteLabels: 'Etiketler',
  mapView360Btn: '360° Görünüm',
  mapExit360Btn: 'Haritaya dön',
  streetViewOpenExternal: "Google Haritalar'da 360° aç",
  streetViewDragHint: '360° bakmak için ekranı sürükleyin',
  streetViewSatelliteOrbitLabel: '360° Uydu Yörünge Görünümü',
  streetViewStreetModeLabel: '360° Google Sokak Görünümü',
  streetViewUnavailableHint:
    'Burada sokak görüntüsü yok — 360° uydu panoraması gösteriliyor',
  streetViewLoading: '360° panorama yükleniyor...',
  pegmanAriaLabel: '360° Görünüm (sarı adamı haritaya sürükleyin veya tıklayın)',
  pegmanDragTooltip: '360° için haritaya sürükleyin veya tıklayın',
  pegmanDropAction: '360° için buraya bırakın',
  pegmanDroppedPointLabel: 'Haritada 360° Noktası',
  gpsSignalTimeout: 'GPS sinyali bekleniyor — konum aranmaya devam ediyor...',
  gpsSignalUnavailable: 'GPS sinyali geçici olarak kullanılamıyor — yeniden deneniyor...',
  mapFollowDriverBtn: 'Takip et',
  mapFollowingDriver: 'GPS takibi',
  liveTelemetryUpdated: 'Güncellendi',
  districtTashkentCenter: 'Taşkent · Merkez',
  districtChilonzor: 'Çilonzar',
  districtYunusobod: 'Yunusabad',
  districtSergeli: 'Sergeli',
  historyTitle: 'Dolum Geçmişi ve Fişler',
  historySubtitle:
    'Bağlı kartla yapılan tüm ödemeler ve aracınıza hizmet veren görevliler.',
  totalOrders: 'Toplam dolum',
  totalMethane: 'Verilen metan',
  totalPaid: 'Toplam harcanan',
  noOrdersTitle: 'Henüz dolum yapılmadı',
  noOrdersSubtitle:
    'Araçtan ilk ödemenizden sonra gaz miktarı ve görevli adı içeren dijital fiş burada görünür.',
  receiptTitle: 'dezagamiz Dijital Fişi',
  receiptBtn: 'Fiş',
  historyColReceiptDate: 'Fiş / Tarih',
  historyColStationBay: 'İstasyon ve peron',
  historyColFuel: 'Yakıt',
  historyColVolume: 'Hacim',
  historyColAmount: 'Tutar',
  historyColAttendant: 'Görevli',
  historyColAction: 'İşlem',
  historyCloseReceiptAria: 'Fişi kapat',
  historyDetailCar: 'Araç',
  historyDetailBayFuel: 'Peron ve yakıt',
  historyDetailAttendant: 'Görevli',
  historyDetailCardPay: 'Kart ile ödeme',
  historyDetailTotalCharged: 'Toplam çekilen',
  linkedCardsTitle: 'Bağlı Kartlar',
  linkedCardsSubtitle:
    'Kalıcı giriş ve araç içi ödeme için en az bir aktif kart zorunludur.',
  addCardBtn: 'Kart ekle',
  hideForm: 'Formu gizle',
  primaryCard: 'Varsayılan',
  makePrimary: 'Varsayılan yap',
  saveCarData: 'Araç bilgilerini kaydet',
  myVehiclesTitle: 'Araçlarım',
  addNewCarBtn: 'Yeni araç ekle',
  newCarModelLabel: 'Yeni araç marka ve modeli',
  newCarPlateLabel: 'Yeni plaka numarası',
  saveNewCarBtn: 'Aracı profile ekle',
  activeCarBadge: 'Aktif araç',
  selectCarBtn: 'Seç',
  deleteCarLabel: 'Aracı kaldır',
  carAddedSuccess: 'Yeni araç eklendi ve aktif olarak seçildi',
  profileUpdatedSuccess: 'Araç ve profil bilgileri güncellendi',
  profileSaveBtnError: 'Kaydetme hatası',
  profileNewCardNumberLabel: 'Yeni kart numarası',
  profileBindNewCardBtn: 'Yeni kartı bağla',
  profileExpiryPrefix: 'Son kullanma',
  profileDeleteCardAriaPrefix: 'Kartı kaldır',
  profileAttendantSectionEyebrow: 'Görevli için bilgiler',
  profileDriverCarTitle: 'Sürücü ve araç',
  profileAttendantCarHint: 'İstasyondaki görevli aracınızı model ve plakadan tanır.',
  profileAccountPhoneLabel: 'Hesap telefonu',
  profileDriverNameLabel: 'Sürücü adı',
  personalCardEyebrow: 'Özel sürücü yakıt kartı',
  personalCardTitle: 'Kişisel dezagamiz Kartı',
  personalCardSubtitle:
    'dezagamiz tarzında anında kart: komisyonsuz gaz ve yakıt ödemesi, %5’e varan bonus cashback.',
  personalCardCta: 'dezagamiz kartını çıkar',
  personalCardIssuing: 'Kart hazırlanıyor...',
  personalCardTierLabel: 'Kart tarifesi',
  personalCardTierStandard: 'Standart',
  personalCardTierStandardDesc: 'Çıkarma 0 som · %3 cashback bonus',
  personalCardTierPrime: 'Prime',
  personalCardTierPrimeDesc: 'Çıkarma 0 som · %5 cashback + öncelik',
  personalCardStyleLabel: 'Kart tasarımı',
  personalCardStyleCobalt: 'Mavi Amiral',
  personalCardStyleArctic: 'Beyaz Krom',
  personalCardStyleNight: 'Gece Taşkent',
  personalCardInitialTopUp: 'Karttan başlangıç yüklemesi',
  personalCardBalanceLabel: 'Kart bakiyesi',
  personalCardBonusLabel: 'Cashback bonusları',
  personalCardCashbackLabel: 'Cashback',
  personalCardTopUpBtn: 'Bakiye yükle',
  personalCardTopUpConfirm: 'Karta aktar',
  personalCardFreezeBtn: 'Dondur',
  personalCardUnfreezeBtn: 'Etkinleştir',
  personalCardFrozenBadge: 'Donduruldu',
  personalCardActiveBadge: 'Aktif',
  personalCardShowNumber: 'Numarayı göster',
  personalCardHideNumber: 'Numarayı gizle',
  personalCardPayOption: 'Kişisel dezagamiz Kartı',
  personalCardIssuedSuccess: 'Kişisel dezagamiz kartınız hazırlandı ve ödemeye hazır!',
  personalCardTopUpSuccess: 'Kişisel dezagamiz kartına bakiye yüklendi',
  personalCardIssuePromptLink: 'Kişisel dezagamiz kartı çıkar (%5’e kadar cashback)',
  themeLight: 'Açık',
  themeDark: 'Koyu',
  themeSwitchAria: 'Açık ve koyu tema arasında geçiş yap',
  assistantTitle: 'Kişisel Gemini Yapay Zeka Asistanı',
  assistantSubtitle: 'İstasyon Rotaları · Yakıt Hesabı · Yol Müziği',
  assistantWelcome:
    'Merhaba! Gemini destekli kişisel dezagamiz asistanınızım. En yakın istasyonu bulabilir, yakıt tutarını hesaplayabilir veya sürüşünüz için özel bir melodi besteleyebilirim.',
  assistantPlaceholder: 'Dolum, rota veya özel melodi besteleme hakkında sorun...',
  assistantSendBtn: 'Gönder',
  assistantThinking: 'Gemini yanıt hazırlıyor...',
  assistantClearBtn: 'Temizle',
  assistantActionOpenStation: 'Seçilen istasyona git',
  assistantActionPlayMelody: 'Bestelenen melodiyi çal',
  assistantPrompt1: 'Şu anda en yakın boş metan istasyonu hangisi?',
  assistantPrompt2: '120.000 som ile kaç m³ metan alınacağını hesapla.',
  assistantPrompt3: 'Taşkent gece sürüşü için sakin bir melodi bestele.',
  assistantPrompt4: 'Yumuşak bir dolum uyarı sesi seç ve müziği başlat.',
  musicStudioTitle: 'Kişisel Müzik ve Melodiler',
  musicStudioSubtitle: 'Ses Dosyalarınız · Gemini Melodileri · Dolum Sinyali',
  musicTabTracks: 'Parçalarım',
  musicTabComposeAi: 'Gemini ile Bestele',
  musicTabCustom: 'Dosya / Notalar',
  musicPlayBtn: 'Çal',
  musicPauseBtn: 'Duraklat',
  musicNextBtn: 'Sonraki',
  musicLoopLabel: 'Tekrarla',
  musicVolumeLabel: 'Ses',
  musicDownloadWavBtn: 'WAV İndir',
  musicChimeActiveLabel: 'Dolum sinyali',
  musicSetChimeBtn: 'Sinyal yap',
  musicAutoPlayFuelLabel: 'Dolum başladığında melodiyi çal',
  musicUploadTitle: 'Kişisel parça veya melodi yükle',
  musicUploadHint: 'MP3, WAV, OGG veya M4A (maks. 5 MB) · profilinizde saklanır',
  musicUploadBtn: 'Ses dosyası seç',
  musicUploading: 'Yükleniyor...',
  musicComposePromptLabel: 'Melodi ruh hali veya stili',
  musicComposePromptPlaceholder: 'Örn. Taşkent otoyolu için sakin gece lo-fi ritmi',
  musicComposeBpmLabel: 'Tempo (BPM)',
  musicComposePresetLabel: 'Enstrüman',
  musicComposeBtn: 'Gemini ile melodi bestele',
  musicComposing: 'Gemini besteliyor...',
  musicSequencerTitle: 'Kişisel Melodi Editörü (16 adım)',
  musicSequencerHint: 'Anında duymak için notalara dokunun, sonra kaydedin',
  musicSaveCustomBtn: 'Özel melodiyi kaydet',
  musicCustomTitlePlaceholder: 'Melodinizin adı',
  musicQuickCardTitle: 'Kişisel Müzik ve Gemini Asistan',
  musicOpenStudioBtn: 'Asistanı ve Müziği Aç',
  musicPresetRhodes: 'Rhodes',
  musicPresetWarmPad: 'Sıcak Ped',
  musicPresetPluck: 'Telli',
  musicPresetChime: 'Zil',
  musicPresetBass: 'Bas Groove',
  musicMood1: 'Gece Taşkent · yumuşak yol lo-fi ritmi',
  musicMood2: 'Otoyolda enerjik sabah ritmi',
  musicMood3: 'Doğu şafağı · hafif enstrümantal melodi',
  musicMood4: 'Dolum bitimi için temiz yumuşak sinyal',
  musicSourceGemini: 'Gemini AI',
  musicSourceFile: 'Dosya',
  musicSourceCustom: 'Özel melodi',
  musicSourcePreset: 'Ön ayar',
  musicDeleteTrackAria: 'Parçayı sil',
  musicComposeSuccessPrefix: '“',
  musicComposeSuccessSuffix: '” melodisi oluşturuldu ve kitaplığa eklendi.',
  musicUploadSuccessPrefix: '“',
  musicUploadSuccessSuffix: '” parçası profilinize yüklendi.',
  musicCustomSavedPrefix: '“',
  musicCustomSavedSuffix: '” melodisi kaydedildi ve çalınıyor.',
  musicSelectAtLeastOneNote: 'Lütfen ızgarada en az bir nota seçin.',
  musicPreset1Title: 'Taşkent · Gece Sürüşü',
  musicPreset1Sub: 'Yumuşak Rhodes · Yol için lo-fi atmosfer',
  musicPreset2Title: 'Semerkant · Şafak',
  musicPreset2Sub: 'Telli sentez · Hafif doğu makamı',
  musicPreset3Title: 'dezagamiz Dolum Sinyali',
  musicPreset3Sub: 'Peron hazır olduğunda kristal zil sesi',
  assistantPromptGreeting: 'Merhaba! Beni doğru bölüme yönlendir',
  assistantActionGoTo: 'Bölümü aç:',
  assistantActionThemeDark: 'Koyu tema açıldı',
  assistantActionThemeLight: 'Açık tema açıldı',
  assistantActionThemeToggled: 'Tema değiştirildi',
  assistantActionLangChanged: 'Dil güncellendi',
  assistantActionGpsOn: 'Canlı GPS açıldı',
  assistantActionGpsOff: 'Canlı GPS duraklatıldı',
  assistantErrReply: 'Gemini’den yanıt alınamadı.',
  musicDefaultComposePrompt: 'Şehir içi gece sürüşü için sakin lo-fi ritmi',
  musicDefaultCustomTitle: 'Yol Melodim',
  musicPreviewDefaultTitle: 'Ön izleme',
  musicCustomFallbackTitle: 'Melodim',
  musicComposeFailedErr: 'Gemini ile melodi oluşturma hatası.',
  musicUploadFailedErr: 'Ses dosyası yüklenemedi.',
  musicSaveCustomFailedErr: 'Melodi kaydedilemedi.',
  musicPlaybackAudioErr: 'Ses dosyası oynatılamadı.',
  musicPlaybackBlockedErr: 'Tarayıcıda sesi başlatmak için Oynat düğmesine basın.',
  musicFileTooLargeErr: 'Maksimum ses dosyası boyutu 5 MB.',
  musicFileReadErr: 'Dosya okunamadı',
  musicUploadTrackFallback: 'Parçam',
  creatorShowCodeAria: 'Kodu göster',
  creatorHideCodeAria: 'Kodu gizle',
  sampleFullNamePlaceholder: 'Azizbek Karimov',
  sampleCardHolderPlaceholder: 'AZİZBEK KERİMOV',
  personalCardDriverFallback: 'SÜRÜCÜ KARTI',
  meterUnit: 'm',
  languageSelectorAria: 'Uygulama dilini seçin',
  creatorLoadErr: 'Kurucu paneli yüklenemedi',
  creatorLockErr: 'Kurucu paneli kilitlenemedi',
  creatorUpdateStationErr: 'İstasyon güncellenirken hata oluştu',
  creatorAdvanceOrderErr: 'Sipariş durumu güncellenemedi',
  driverMarkerSelf: 'Ben',
  closeAria: 'Kapat',
  zoomInAria: 'Yakınlaştır',
  zoomOutAria: 'Uzaklaştır',
  entryModeAria: 'Giriş modu',
  primaryNavAria: 'Ana gezinme',
  mobileNavAria: 'Mobil gezinme',
  rotateLeftAria: 'Sola 45° döndür',
  rotateRightAria: 'Sağa 45° döndür',
  fuelMetan: 'Metan',
  fuelPropan: 'Propan',
  fuelAi92: 'AI-92',
  fuelAi95: 'AI-95',
  fuelMetanFull: 'Metan (CNG)',
  fuelPropanFull: 'Propan (LPG)',
  fuelAi92Full: 'Benzin AI-92',
  fuelAi95Full: 'Benzin AI-95',
  pressure200Bar: '200 bar',
  pressure16Bar: '16 bar',
  currencyUzs: 'som',
  unitM3: 'm³',
  unitLiter: 'L',
  musicPreset4Title: 'Registan · Otoyol Sürüşü',
  musicPreset4Sub: 'Yol için sıcak bas ve enerjik synth melodisi',
  navShowcase: 'Sunum',
  navShowcaseShort: 'Sunum',
  openShowcaseBtn: 'Sunum ve Proje Savunması',
  launchJuryDemoBtn: 'Canlı Uygulamayı Aç (Demo)',
  showcaseBackToGate: 'Girişe Dön',
  showcaseTitle: 'Yarışma Sunumu ve Savunma Merkezi',
  showcaseSubtitle: 'Sahne slaytları, veli ve jüri soru-cevap provası, tasarruf ve basit gelir hesaplayıcıları',
  showcaseProjectorModeOn: 'Projektör (Temiz)',
  showcaseSpeakerNotesOn: 'Konuşmacı Notu',
  showcaseSpeakerCueLabel: 'Salona söyleyin:',
  showcaseTimerLabel: 'Sahne Sayacı',
  showcaseTimerStart: 'Başlat',
  showcaseTimerPause: 'Duraklat',
  showcaseTimerReset: 'Sıfırla',
  showcaseTarget3Min: 'Hedef: 3:00',
  showcaseTabSlides: 'Slaytlar',
  showcaseTabSavings: 'Aile Tasarrufu',
  showcaseTabDefense: 'Soru Savunması',
  showcaseTabMonetization: 'Gelir Modeli',
  showcaseTabChecklist: 'Sahne Planı',
  showcasePrevSlide: 'Önceki',
  showcaseNextSlide: 'Sonraki Slayt',
  showcaseShowLiveBtn: 'Canlı Göster',
  showcaseQuizModeBtn: '30sn Sınav Modu',
  showcaseQuizNextBtn: 'Sonraki Soru',
  showcaseQuizRevealBtn: 'Cevabı Göster',
  showcaseQuizHideBtn: 'Cevabı Gizle',
  showcaseQuizTimerLabel: 'Cevap süresi',
  showcaseFilterAll: 'Tümü',
  showcaseFilterParents: 'Veliler',
  showcaseFilterJury: 'Jüri',
  showcaseFilterBusiness: 'Gelir / İş',
  showcaseSavingsTitle: 'Aile Metan Yakıt Tasarrufu Hesaplayıcı',
  showcaseSavingsSubtitle: 'Aylık ve yıllık karşılaştırma: Metan + %5 dezagamiz Prime iade ve AI-92 Benzin',
  showcaseMonthlyKmLabel: 'Aylık sürüş mesafesi',
  showcaseConsumptionLabel: '100 km ortalama tüketim',
  showcaseOutMonthlySavings: 'Aylık tasarruf',
  showcaseOutYearlySavings: 'Yıllık yakıt tasarrufu',
  showcaseOutPrimeCashback: 'Yıllık %5 Prime nakit iade',
  showcaseOutTotalBenefit: 'Yıllık toplam aile kazancı',
  showcaseOutCo2Saved: 'Azaltılan yıllık CO₂',
  showcaseOutTimeSaved: 'Sıra beklemeden kazanılan süre',
  unitKgShort: 'kg',
  unitHourShort: 'sa',
  unitMinShort: 'dk',
  showcaseMonetizeTitle: 'Bu Uygulamadan Şu An Nasıl Para Kazanılır',
  showcaseMonetizeSubtitle: 'Banka lisansı gerektirmeyen 4 basit yol ve canlı gelir tahmini',
  showcaseStationsCountLabel: 'Anlaşmalı özel istasyon sayısı',
  showcaseCarsPerDayLabel: 'İstasyon başı günlük sipariş',
  showcaseOutMonthlyOrders: 'Aylık sipariş',
  showcaseOutSubIncome: 'İstasyon aboneliği (200b/ay)',
  showcaseOutFeeIncome: 'İş ortağı payı (700 som/fiş)',
  showcaseOutAdIncome: 'Harita kafe ve yıkama reklamı',
  showcaseOutMonthlyRevenue: 'Aylık gelir tahmini',
  showcaseOutYearlyRevenue: 'Yıllık gelir tahmini',
  showcaseChecklistTitle: 'Kusursuz Sahne Gösterim Listesi',
  showcaseChecklistSubtitle: 'Veliler ve jüri önünde tüm önemli kanıtları sırayla işaretleyin',
  showcaseChecklistProgress: 'Tamamlanan adım',
  safetyMetanRule: 'Kasada sıra beklemeden çevrimiçi ödeyin. Güvenlik Uyarısı (CNG kuralları): metan dolumunda kabinden çıkmanız ve kaputu açmanız gerekir.',
  safetyStayInCarNote: '«Araçtan çıkmadan» modu — görevliyi kabin içinde bekleyebilirsiniz',
  trackerExitForMetanHint: 'CNG güvenlik kuralları gereği metan dolumunda kabinden çıkın ve kaputu açık tutun',
  carSupportedFuelsLabel: 'Araçla uyumlu yakıt',
  carFuelAutoSelected: 'Aracınızın modeli için uygun yakıt otomatik seçildi',
  carNoGboHybridWarn: 'Bu model (LPG/CNG kiti olmayan hibrit/benzin) yalnızca AI-92 ve AI-95 destekler. Metan ve Propan uygun değildir.',
  carEvOnlyWarn: 'Elektrikli araç seçili: gaz ve benzin dolumu uygun değil. Garajdan başka araç seçin veya şarj istasyonu kullanın.',
  bayCodeTitle: 'Yanlış Pompaya Ödeme Koruması',
  bayCodeLabel: 'Pompa ekranındaki onay kodu',
  bayCodePlaceholder: 'Ekrandaki 4 hane',
  bayCodeAutofillBtn: 'Demo kodu doldur',
  bayCodeScanQrBtn: "Pompadaki QR'ı tara",
  bayCodeScanningQr: 'Pompa QR kodu taranıyor...',
  bayCodeVerifiedBadge: 'Pompa doğrulandı',
  bayCodeDemoHintPrefix: 'Pompa ekranındaki kod',
  errBayCodeMismatch: 'Seçili pompa ekranındaki 4 haneli kodu girin veya pompadaki QR kodu tarayın',
  compactLocationTitle: 'Şehir ve En Yakın İstasyon',
  howItWorksToggleOpen: 'Nasıl çalışır?',
  howItWorksToggleClose: 'Rehberi gizle',
  secretAdminActivatedToast: 'Gizli yönetici erişimi etkinleştirildi. Yönetici kodu ekranını açmak için «Çıkış» düğmesine basın.',
  secretAdminBackToDriverBtn: 'Sürücü girişine dön',
  sortNearestLabel: 'En Yakın',
  sortBestNearbyLabel: 'Yakındaki En İyiler',
  bestMatchBadge: 'En İyi Seçim',
  stationStatusOpen: 'Açık',
  stationStatusBusy: 'Yoğun',
  stationStatusMaint: 'Bakımda',
  queueLowLabel: 'Sıra yok',
  queueMediumLabel: 'Orta sıra',
  queueHighLabel: 'Uzun sıra',
  geoFallbackCityNotice: 'Konum kullanılamıyor — mesafeler seçili şehir merkezinden hesaplandı',
  mapFallbackActiveNote: 'Dahili etkileşimli istasyon haritası etkin',
  carMatchOk: 'Araca uygun',
  carMatchNo: 'Uygun yakıt yok',
  showcaseBackToApp: 'Doluma dön',
  creatorOperationalStatusLabel: 'İstasyon çalışma durumu',
  creatorQueueLevelLabel: 'Yoğunluk ve sıra durumu',
  creatorFuelAvailabilityLabel: 'Yakıt türü erişilebilirliği',
  creatorFuelOn: 'Açık',
  creatorFuelOff: 'Kapalı',
  creatorDemoEventsTitle: 'Canlı olaylar ve güvenlik günlüğü',
  creatorDemoEventsEmpty: 'Henüz olay yok — bir istasyonu güncelleyin veya pompa kodu testi yapın',
  creatorSafetySandboxTitle: 'Güvenlik Kuralları ve Pompa Kodu Doğrulayıcı',
  creatorSafetySandboxSub: 'Jüri ve velilere araç yakıt uyumu, CNG güvenlik kuralı tetikleyicisi ve 4 haneli pompa kodu doğrulamasını canlı gösterin',
  creatorTestCarLabel: 'Test araç modeli',
  creatorTestFuelLabel: 'Test edilecek yakıt',
  creatorTestBayLabel: 'Test pompası',
  creatorTestCodeInputLabel: 'Girilen ekran kodu',
  creatorRunCheckBtn: 'Güvenlik ve kural kontrolünü çalıştır',
  creatorCheckPassed: 'Onaylandı: pompa kodu eşleşti ve yakıt araca uygun',
  creatorCheckBlockedCode: 'Engellendi: yanlış pompa kodu (yanlış pompaya ödeme koruması)',
  creatorCheckBlockedFuel: 'Uyarı: bu yakıt seçili araç modeli tarafından desteklenmiyor',
};

export const TRANSLATIONS: Record<AppLanguage, TranslationBundle> = {
  ru: RU,
  uz: UZ,
  en: EN,
  kk: KK,
  tr: TR,
};

const CITY_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'Ташкент': {
    ru: 'Ташкент',
    uz: 'Toshkent',
    en: 'Tashkent',
    kk: 'Ташкент',
    tr: 'Taşkent',
  },
  'Самарканд': {
    ru: 'Самарканд',
    uz: 'Samarqand',
    en: 'Samarkand',
    kk: 'Самарқанд',
    tr: 'Semerkant',
  },
  'Бухара': {
    ru: 'Бухара',
    uz: 'Buxoro',
    en: 'Bukhara',
    kk: 'Бұхара',
    tr: 'Buhara',
  },
  'Фергана': {
    ru: 'Фергана',
    uz: "Farg'ona",
    en: 'Fergana',
    kk: 'Ферғана',
    tr: 'Fergana',
  },
  'Ташкент · Центр': {
    ru: 'Ташкент · Центр',
    uz: 'Toshkent · Markaz',
    en: 'Tashkent · Center',
    kk: 'Ташкент · Орталық',
    tr: 'Taşkent · Merkez',
  },
  'Чиланзар': {
    ru: 'Чиланзар',
    uz: 'Chilonzor',
    en: 'Chilonzor',
    kk: 'Чиланзар',
    tr: 'Chilonzor',
  },
  'Юнусабад': {
    ru: 'Юнусабад',
    uz: 'Yunusobod',
    en: 'Yunusabad',
    kk: 'Юнусабад',
    tr: 'Yunusabad',
  },
  'Сергели': {
    ru: 'Сергели',
    uz: 'Sergeli',
    en: 'Sergeli',
    kk: 'Сергели',
    tr: 'Sergeli',
  },
};

export function translateCityName(city: string, lang: AppLanguage): string {
  const entry = CITY_TRANSLATIONS[city];
  if (entry) return entry[lang];
  return city;
}

const STATION_NAME_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'st-tashkent-chilonzor': {
    ru: 'dezagamiz АГНКС Чиланзар-14',
    uz: 'dezagamiz AGTKSH Chilonzor-14',
    en: 'dezagamiz CNG Chilonzor-14',
    kk: 'dezagamiz АГТКС Чиланзар-14',
    tr: 'dezagamiz CNG Çilonzor-14',
  },
  'st-tashkent-yunusobod': {
    ru: 'dezagamiz АГНКС Юнусабад-8',
    uz: 'dezagamiz AGTKSH Yunusobod-8',
    en: 'dezagamiz CNG Yunusobod-8',
    kk: 'dezagamiz АГТКС Юнусабад-8',
    tr: 'dezagamiz CNG Yunusabad-8',
  },
  'st-tashkent-sergeli': {
    ru: 'dezagamiz Сергели-Авто',
    uz: 'dezagamiz Sergeli-Avto',
    en: 'dezagamiz Sergeli-Auto',
    kk: 'dezagamiz Сергели-Авто',
    tr: 'dezagamiz Sergeli-Oto',
  },
  'st-samarkand-m39': {
    ru: 'dezagamiz Самарканд М-39',
    uz: 'dezagamiz Samarqand M-39',
    en: 'dezagamiz Samarkand M-39',
    kk: 'dezagamiz Самарқанд М-39',
    tr: 'dezagamiz Semerkant M-39',
  },
  'st-bukhara-center': {
    ru: 'dezagamiz Бухара Гиждуван',
    uz: "dezagamiz Buxoro G'ijduvon",
    en: 'dezagamiz Bukhara Gijduvan',
    kk: 'dezagamiz Бұхара Ғиждуван',
    tr: 'dezagamiz Buhara Gijduvan',
  },
  'st-fergana-ring': {
    ru: 'dezagamiz Фергана Кольцо',
    uz: "dezagamiz Farg'ona Halqa",
    en: 'dezagamiz Fergana Ring',
    kk: 'dezagamiz Ферғана Сақина',
    tr: 'dezagamiz Fergana Çevre',
  },
};

const STATION_ADDRESS_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'st-tashkent-chilonzor': {
    ru: 'ул. Бунёдкор, 42, Чиланзарский р-н',
    uz: "Bunyodkor ko'chasi, 42, Chilonzor tumani",
    en: '42 Bunyodkor St., Chilonzor District',
    kk: 'Бунёдкор к-сі, 42, Чиланзар ауданы',
    tr: 'Bunyodkor Cad. No: 42, Çilonzor İlçesi',
  },
  'st-tashkent-yunusobod': {
    ru: 'пр. Амира Темура, 118, Юнусабадский р-н',
    uz: "Amir Temur shoh ko'chasi, 118, Yunusobod tumani",
    en: '118 Amir Temur Ave., Yunusobod District',
    kk: 'Әмір Темір даңғ., 118, Юнусабад ауданы',
    tr: 'Emir Timur Blv. No: 118, Yunusabad İlçesi',
  },
  'st-tashkent-sergeli': {
    ru: 'ул. Янги Сергели, 19, Сергелийский р-н',
    uz: "Yangi Sergeli ko'chasi, 19, Sergeli tumani",
    en: '19 Yangi Sergeli St., Sergeli District',
    kk: 'Жаңа Сергели к-сі, 19, Сергели ауданы',
    tr: 'Yangi Sergeli Cad. No: 19, Sergeli İlçesi',
  },
  'st-samarkand-m39': {
    ru: 'Трасса М-39, км 1082, въезд в Самарканд',
    uz: 'M-39 trassasi, 1082-km, Samarqandga kirish',
    en: 'M-39 Highway, km 1082, Samarkand Entrance',
    kk: 'М-39 тас жолы, 1082-шқ, Самарқандқа кіреберіс',
    tr: 'M-39 Otoyolu, 1082. km, Semerkant Girişi',
  },
  'st-bukhara-center': {
    ru: 'ул. Гиждуванская, 74, Бухара',
    uz: "G'ijduvon ko'chasi, 74, Buxoro",
    en: '74 Gijduvan St., Bukhara',
    kk: 'Ғиждуван к-сі, 74, Бұхара',
    tr: 'Gijduvan Cad. No: 74, Buhara',
  },
  'st-fergana-ring': {
    ru: 'Малая кольцевая дорога, 12, Фергана',
    uz: "Kichik halqa yo'li, 12, Farg'ona",
    en: '12 Small Ring Road, Fergana',
    kk: 'Кіші айналма жолы, 12, Ферғана',
    tr: 'Küçük Çevre Yolu No: 12, Fergana',
  },
};

const ATTENDANT_NAME_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'att-1': {
    ru: 'Шерзод Рахмонов',
    uz: 'Sherzod Rahmonov',
    en: 'Sherzod Rakhmonov',
    kk: 'Шерзод Рахмонов',
    tr: 'Şerzod Rahmanov',
  },
  'att-2': {
    ru: 'Джамшид Усманов',
    uz: 'Jamshid Usmonov',
    en: 'Jamshid Usmanov',
    kk: 'Жамшид Усманов',
    tr: 'Cemşid Usmanov',
  },
  'att-3': {
    ru: 'Бобур Хакимов',
    uz: 'Bobur Hakimov',
    en: 'Bobur Khakimov',
    kk: 'Бобур Хакимов',
    tr: 'Babur Hakimov',
  },
  'att-4': {
    ru: 'Сардор Мирзаев',
    uz: 'Sardor Mirzayev',
    en: 'Sardor Mirzaev',
    kk: 'Сардор Мирзаев',
    tr: 'Sardor Mirzayev',
  },
  'att-5': {
    ru: 'Улугбек Назаров',
    uz: "Ulug'bek Nazarov",
    en: 'Ulugbek Nazarov',
    kk: 'Ұлықбек Назаров',
    tr: 'Uluğbek Nazarov',
  },
  'att-6': {
    ru: 'Фаррух Турсунов',
    uz: 'Farrux Tursunov',
    en: 'Farrukh Tursunov',
    kk: 'Фаррух Тұрсынов',
    tr: 'Ferruh Tursunov',
  },
  'att-7': {
    ru: 'Нодирбек Саидов',
    uz: 'Nodirbek Saidov',
    en: 'Nodirbek Saidov',
    kk: 'Нодирбек Саидов',
    tr: 'Nadirbek Saidov',
  },
  'att-8': {
    ru: 'Исломжон Юлдашев',
    uz: "Islomjon Yo'ldoshev",
    en: 'Islomjon Yuldashev',
    kk: 'Исломжон Юлдашев',
    tr: 'İslamcan Yoldaşev',
  },
};

const SHIFT_BADGE_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'att-1': {
    ru: 'Смена А · Метан-эксперт',
    uz: 'A smena · Metan eksperti',
    en: 'Shift A · CNG Expert',
    kk: 'А ауысымы · Метан сарапшысы',
    tr: 'A Vardiyası · Metan Uzmanı',
  },
  'att-2': {
    ru: 'Смена А · Старший оператор',
    uz: 'A smena · Katta operator',
    en: 'Shift A · Senior Operator',
    kk: 'А ауысымы · Аға оператор',
    tr: 'A Vardiyası · Kıdemli Operatör',
  },
  'att-3': {
    ru: 'Смена Б · Оператор ТРК',
    uz: 'B smena · Kolonka operatori',
    en: 'Shift B · Dispenser Operator',
    kk: 'Б ауысымы · ТРК операторы',
    tr: 'B Vardiyası · Pompa Operatörü',
  },
  'att-4': {
    ru: 'Смена Б · Метан-эксперт',
    uz: 'B smena · Metan eksperti',
    en: 'Shift B · CNG Expert',
    kk: 'Б ауысымы · Метан сарапшысы',
    tr: 'B Vardiyası · Metan Uzmanı',
  },
  'att-5': {
    ru: 'Смена В · Ведущий заправщик',
    uz: 'V smena · Yetakchi operator',
    en: 'Shift C · Lead Attendant',
    kk: 'В ауысымы · Жетекші оператор',
    tr: 'C Vardiyası · Baş Görevli',
  },
  'att-6': {
    ru: 'Смена А · Трассовый пост',
    uz: 'A smena · Trassa posti',
    en: 'Shift A · Highway Post',
    kk: 'А ауысымы · Трасса бекеті',
    tr: 'A Vardiyası · Otoyol İstasyonu',
  },
  'att-7': {
    ru: 'Смена А · Оператор газа',
    uz: 'A smena · Gaz operatori',
    en: 'Shift A · Gas Operator',
    kk: 'А ауысымы · Газ операторы',
    tr: 'A Vardiyası · Gaz Operatörü',
  },
  'att-8': {
    ru: 'Смена А · Оператор АГНКС',
    uz: 'A smena · AGTKSH operatori',
    en: 'Shift A · CNG Operator',
    kk: 'А ауысымы · АГТКС операторы',
    tr: 'A Vardiyası · CNG Operatörü',
  },
};

const KNOWN_PERSON_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'Гость dezagamiz': {
    ru: 'Гость dezagamiz',
    uz: 'dezagamiz mehmoni',
    en: 'dezagamiz Guest',
    kk: 'dezagamiz қонағы',
    tr: 'dezagamiz Misafiri',
  },
  'Азизбек Каримов': {
    ru: 'Азизбек Каримов',
    uz: 'Azizbek Karimov',
    en: 'Azizbek Karimov',
    kk: 'Әзізбек Кәрімов',
    tr: 'Azizbek Kerimov',
  },
  'АЗИЗБЕК КАРИМОВ': {
    ru: 'АЗИЗБЕК КАРИМОВ',
    uz: 'AZIZBEK KARIMOV',
    en: 'AZIZBEK KARIMOV',
    kk: 'ӘЗІЗБЕК КӘРІМОВ',
    tr: 'AZİZBEK KERİMOV',
  },
  'AZIZBEK KARIMOV': {
    ru: 'АЗИЗБЕК КАРИМОВ',
    uz: 'AZIZBEK KARIMOV',
    en: 'AZIZBEK KARIMOV',
    kk: 'ӘЗІЗБЕК КӘРІМОВ',
    tr: 'AZİZBEK KERİMOV',
  },
};

const CYR_TO_LAT: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'J', З: 'Z',
  И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
  С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch',
  Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya', Ў: "O'", Қ: 'Q', Ғ: "G'", Ҳ: 'H',
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h',
};

function transliterateCyrillicToLatin(input: string): string {
  return Array.from(input)
    .map((ch) => (ch in CYR_TO_LAT ? CYR_TO_LAT[ch] : ch))
    .join('');
}

export function translateStationName(
  stationIdOrName: string,
  lang: AppLanguage,
  fallback?: string,
): string {
  const byId = STATION_NAME_TRANSLATIONS[stationIdOrName];
  if (byId) return byId[lang];
  for (const map of Object.values(STATION_NAME_TRANSLATIONS)) {
    if (map.ru === stationIdOrName || (fallback && map.ru === fallback)) {
      return map[lang];
    }
  }
  return fallback || stationIdOrName;
}

export function translateStationAddress(
  stationIdOrAddress: string,
  lang: AppLanguage,
  fallback?: string,
): string {
  const byId = STATION_ADDRESS_TRANSLATIONS[stationIdOrAddress];
  if (byId) return byId[lang];
  for (const map of Object.values(STATION_ADDRESS_TRANSLATIONS)) {
    if (map.ru === stationIdOrAddress || (fallback && map.ru === fallback)) {
      return map[lang];
    }
  }
  return fallback || stationIdOrAddress;
}

export function translateAttendantName(
  attendantIdOrName: string,
  lang: AppLanguage,
  fallback?: string,
): string {
  const byId = ATTENDANT_NAME_TRANSLATIONS[attendantIdOrName];
  if (byId) return byId[lang];
  for (const map of Object.values(ATTENDANT_NAME_TRANSLATIONS)) {
    if (map.ru === attendantIdOrName || (fallback && map.ru === fallback)) {
      return map[lang];
    }
  }
  const raw = fallback || attendantIdOrName;
  if ((lang === 'en' || lang === 'uz' || lang === 'tr') && /[А-Яа-яЁё]/.test(raw)) {
    return transliterateCyrillicToLatin(raw);
  }
  return raw;
}

export function translateShiftBadge(
  attendantIdOrBadge: string,
  lang: AppLanguage,
  fallback?: string,
): string {
  const byId = SHIFT_BADGE_TRANSLATIONS[attendantIdOrBadge];
  if (byId) return byId[lang];
  for (const map of Object.values(SHIFT_BADGE_TRANSLATIONS)) {
    if (map.ru === attendantIdOrBadge || (fallback && map.ru === fallback)) {
      return map[lang];
    }
  }
  return fallback || attendantIdOrBadge;
}

export function translatePersonName(name: string, lang: AppLanguage): string {
  const trimmed = name.trim();
  if (!trimmed) return name;
  const known = KNOWN_PERSON_TRANSLATIONS[trimmed];
  if (known) return known[lang];
  if ((lang === 'en' || lang === 'uz' || lang === 'tr') && /[А-Яа-яЁё]/.test(trimmed)) {
    return transliterateCyrillicToLatin(trimmed);
  }
  return name;
}

export function translateCarModel(carModel: string, lang: AppLanguage): string {
  const guestTag: Record<AppLanguage, string> = {
    ru: '(Гость)',
    uz: '(Mehmon)',
    en: '(Guest)',
    kk: '(Қонақ)',
    tr: '(Misafir)',
  };
  return carModel.replace(/\((?:Гость|Guest|Mehmon|Қонақ|Misafir)\)/g, guestTag[lang]);
}

export function formatLocalizedCurrency(amount: number, lang: AppLanguage): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${TRANSLATIONS[lang].currencyUzs}`;
}

export function formatLocalizedDistance(km: number, lang: AppLanguage): string {
  return `${km} ${TRANSLATIONS[lang].distanceKmUnit}`;
}

export function localizePresetTrackText(
  track: PersonalTrack,
  lang: AppLanguage,
): { title: string; subtitle: string } {
  const t = TRANSLATIONS[lang];
  if (track.id === 'preset-tashkent-night') {
    return { title: t.musicPreset1Title, subtitle: t.musicPreset1Sub };
  }
  if (track.id === 'preset-samarkand-dawn') {
    return { title: t.musicPreset2Title, subtitle: t.musicPreset2Sub };
  }
  if (track.id === 'preset-dezagamiz-chime') {
    return { title: t.musicPreset3Title, subtitle: t.musicPreset3Sub };
  }
  if (track.id === 'preset-silk-road-drive') {
    return { title: t.musicPreset4Title, subtitle: t.musicPreset4Sub };
  }
  return { title: track.title, subtitle: track.subtitle };
}

const LANG_STORAGE_KEY = 'dz_lang';

interface I18nContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: TranslationBundle;
  fuelShortLabel: (code: FuelCode) => string;
  fuelFullLabel: (code: FuelCode) => string;
  fuelUnit: (code: FuelCode) => string;
  fuelPressure: (code: FuelCode) => string | undefined;
  formatMoney: (amount: number) => string;
  formatDistanceKm: (km: number) => string;
  localizeCity: (city: string) => string;
  localizeStationName: (stationIdOrName: string, fallback?: string) => string;
  localizeStationAddress: (stationIdOrAddress: string, fallback?: string) => string;
  localizeAttendantName: (attendantIdOrName: string, fallback?: string) => string;
  localizeShiftBadge: (attendantIdOrBadge: string, fallback?: string) => string;
  localizePersonName: (name: string) => string;
  localizeCarModel: (carModel: string) => string;
  localizeCardError: (error?: string) => string;
  localizeTopUpError: (error?: string) => string;
  localizeTrack: (track: PersonalTrack) => { title: string; subtitle: string };
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'ru',
  setLang: () => {},
  t: RU,
  fuelShortLabel: (code) => code,
  fuelFullLabel: (code) => code,
  fuelUnit: (code) => (code === 'metan' ? 'м³' : 'л'),
  fuelPressure: () => undefined,
  formatMoney: (amount) => formatLocalizedCurrency(amount, 'ru'),
  formatDistanceKm: (km) => formatLocalizedDistance(km, 'ru'),
  localizeCity: (city) => city,
  localizeStationName: (id, fallback) => fallback || id,
  localizeStationAddress: (id, fallback) => fallback || id,
  localizeAttendantName: (id, fallback) => fallback || id,
  localizeShiftBadge: (id, fallback) => fallback || id,
  localizePersonName: (name) => name,
  localizeCarModel: (car) => car,
  localizeCardError: () => RU.errCheckCardNumber,
  localizeTopUpError: () => RU.errTopUpCheck,
  localizeTrack: (track) => ({ title: track.title, subtitle: track.subtitle }),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (
        saved === 'ru' ||
        saved === 'uz' ||
        saved === 'en' ||
        saved === 'kk' ||
        saved === 'tr'
      ) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'ru';
  });

  function setLang(next: AppLanguage) {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = TRANSLATIONS[lang];

  function fuelShortLabel(code: FuelCode): string {
    if (code === 'metan') return t.fuelMetan;
    if (code === 'propan') return t.fuelPropan;
    if (code === 'ai92') return t.fuelAi92;
    return t.fuelAi95;
  }

  function fuelFullLabel(code: FuelCode): string {
    if (code === 'metan') return t.fuelMetanFull;
    if (code === 'propan') return t.fuelPropanFull;
    if (code === 'ai92') return t.fuelAi92Full;
    return t.fuelAi95Full;
  }

  function fuelUnit(code: FuelCode): string {
    return code === 'metan' ? t.unitM3 : t.unitLiter;
  }

  function fuelPressure(code: FuelCode): string | undefined {
    if (code === 'metan') return t.pressure200Bar;
    if (code === 'propan') return t.pressure16Bar;
    return undefined;
  }

  function formatMoney(amount: number): string {
    return formatLocalizedCurrency(amount, lang);
  }

  function formatDistanceKm(km: number): string {
    return formatLocalizedDistance(km, lang);
  }

  function localizeCity(city: string): string {
    return translateCityName(city, lang);
  }

  function localizeStationName(stationIdOrName: string, fallback?: string): string {
    return translateStationName(stationIdOrName, lang, fallback);
  }

  function localizeStationAddress(stationIdOrAddress: string, fallback?: string): string {
    return translateStationAddress(stationIdOrAddress, lang, fallback);
  }

  function localizeAttendantName(attendantIdOrName: string, fallback?: string): string {
    return translateAttendantName(attendantIdOrName, lang, fallback);
  }

  function localizeShiftBadge(attendantIdOrBadge: string, fallback?: string): string {
    return translateShiftBadge(attendantIdOrBadge, lang, fallback);
  }

  function localizePersonName(name: string): string {
    return translatePersonName(name, lang);
  }

  function localizeCarModel(carModel: string): string {
    return translateCarModel(carModel, lang);
  }

  function localizeCardError(error?: string): string {
    if (error?.includes('16')) return t.errCardDigits;
    if (error?.includes('8600') || error?.includes('Uzcard')) return t.errCardNetwork;
    if (error?.includes('контрольный')) return t.errCardLuhn;
    return t.errCheckCardNumber;
  }

  function localizeTopUpError(error?: string): string {
    if (error?.includes('10 000')) return t.errTopUpMin;
    if (error?.includes('5 000 000')) return t.errTopUpMax;
    return t.errTopUpCheck;
  }

  function localizeTrack(track: PersonalTrack): { title: string; subtitle: string } {
    return localizePresetTrackText(track, lang);
  }

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        fuelShortLabel,
        fuelFullLabel,
        fuelUnit,
        fuelPressure,
        formatMoney,
        formatDistanceKm,
        localizeCity,
        localizeStationName,
        localizeStationAddress,
        localizeAttendantName,
        localizeShiftBadge,
        localizePersonName,
        localizeCarModel,
        localizeCardError,
        localizeTopUpError,
        localizeTrack,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

