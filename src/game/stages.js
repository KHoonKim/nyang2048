// Cat breed mappings for all stages

export const COMMON_CATS = {
  2: 'korean',
  4: 'russian',
};

const STAGE1_CATS = {
  8: 'ragdoll',
  16: 'burmese',
  32: 'selkirk-rex',
  64: 'turkish-angora',
  128: 'himalayan',
};

const STAGE2_CATS = {
  8: 'munchkin',
  16: 'bombay',
  32: 'somali',
  64: 'toyger',
  128: 'birman',
  256: 'american-curl',
  512: 'oriental-sh',
};

const STAGE3_CATS = {
  8: 'egyptian-mau',
  16: 'abyssinian',
  32: 'japanese-bt',
  64: 'sphynx',
  128: 'exotic-sh',
  256: 'balinese',
  512: 'devon-rex',
  1024: 'manx',
};

const STAGE4_CATS = {
  8: 'chartreux',
  16: 'havana-brown',
  32: 'scottish',
  64: 'siamese',
  128: 'savannah',
  256: 'american-sh',
  512: 'norwegian',
  1024: 'british',
  2048: 'persian',
};

const STAGE5_CATS = {
  8: 'singapura',
  16: 'bengal',
  32: 'turkish-van',
  64: 'ocicat',
  128: 'mainecoon',
  256: 'korat',
  512: 'cornish-rex',
  1024: 'pixiebob',
  2048: 'tonkinese',
};

export const INFINITE_CATS = {
  4096: 'cheese',
  8192: 'nebelung',
};

export const CAT_NAMES = {
  korean: '코리안숏헤어',
  russian: '러시안블루',
  ragdoll: '렉돌',
  burmese: '버미즈',
  'selkirk-rex': '셀커크렉스',
  'turkish-angora': '터키시앙고라',
  himalayan: '히말라얀',
  munchkin: '먼치킨',
  bombay: '봄베이',
  somali: '소말리',
  toyger: '토이거',
  birman: '버만',
  'american-curl': '아메리칸컬',
  'oriental-sh': '오리엔탈숏헤어',
  'egyptian-mau': '이집션마우',
  abyssinian: '아비시니안',
  'japanese-bt': '재패니즈밥테일',
  sphynx: '스핑크스',
  'exotic-sh': '엑조틱숏헤어',
  balinese: '발리니즈',
  'devon-rex': '데본렉스',
  manx: '맹크스',
  chartreux: '샤르트뢰',
  'havana-brown': '하바나브라운',
  scottish: '스코티시폴드',
  siamese: '샴',
  savannah: '사바나',
  'american-sh': '아메리칸숏헤어',
  norwegian: '노르웨이숲',
  british: '브리티시숏헤어',
  persian: '페르시안',
  singapura: '싱가퓨라',
  bengal: '벵갈',
  'turkish-van': '터키시반',
  ocicat: '옥시캣',
  mainecoon: '메인쿤',
  korat: '코랏',
  'cornish-rex': '코니시렉스',
  pixiebob: '픽시밥',
  tonkinese: '통키니즈',
  cheese: '치즈태비',
  nebelung: '네벨룽',
};

export const STAGES = {
  1: { id: 1, size: 3, goal: 128, initialTiles: 2, cats: STAGE1_CATS, label: 'Stage 1', boardLabel: '3×3' },
  2: { id: 2, size: 4, goal: 512, initialTiles: 2, cats: STAGE2_CATS, label: 'Stage 2', boardLabel: '4×4' },
  3: { id: 3, size: 5, goal: 1024, initialTiles: 3, cats: STAGE3_CATS, label: 'Stage 3', boardLabel: '5×5' },
  4: { id: 4, size: 6, goal: 2048, initialTiles: 3, cats: STAGE4_CATS, label: 'Stage 4', boardLabel: '6×6' },
  5: { id: 5, size: 8, goal: 2048, initialTiles: 4, cats: STAGE5_CATS, label: 'Stage 5', boardLabel: '8×8' },
  infinite: { id: 'infinite', size: null, goal: null, initialTiles: 2, cats: STAGE5_CATS, label: '무한모드', boardLabel: '∞' },
};

export function getCatForValue(stageId, value) {
  if (COMMON_CATS[value]) return COMMON_CATS[value];
  if (stageId === 'infinite') {
    if (INFINITE_CATS[value]) return INFINITE_CATS[value];
    return STAGE5_CATS[value] || null;
  }
  const stage = STAGES[stageId];
  if (!stage) return null;
  return stage.cats[value] || null;
}

export function getCatImage(catId) {
  return `cats/${catId}-loaf.webp`;
}

export function getAllCatsForStage(stageId) {
  const result = { ...COMMON_CATS };
  if (stageId === 'infinite') {
    Object.assign(result, STAGE5_CATS, INFINITE_CATS);
  } else {
    const stage = STAGES[stageId];
    if (stage) Object.assign(result, stage.cats);
  }
  return result;
}

// All 42 cats in display order for collection
export const ALL_CATS_ORDERED = [
  // Common
  { id: 'korean', value: 2, stage: 'common' },
  { id: 'russian', value: 4, stage: 'common' },
  // S1
  { id: 'ragdoll', value: 8, stage: 1 },
  { id: 'burmese', value: 16, stage: 1 },
  { id: 'selkirk-rex', value: 32, stage: 1 },
  { id: 'turkish-angora', value: 64, stage: 1 },
  { id: 'himalayan', value: 128, stage: 1 },
  // S2
  { id: 'munchkin', value: 8, stage: 2 },
  { id: 'bombay', value: 16, stage: 2 },
  { id: 'somali', value: 32, stage: 2 },
  { id: 'toyger', value: 64, stage: 2 },
  { id: 'birman', value: 128, stage: 2 },
  { id: 'american-curl', value: 256, stage: 2 },
  { id: 'oriental-sh', value: 512, stage: 2 },
  // S3
  { id: 'egyptian-mau', value: 8, stage: 3 },
  { id: 'abyssinian', value: 16, stage: 3 },
  { id: 'japanese-bt', value: 32, stage: 3 },
  { id: 'sphynx', value: 64, stage: 3 },
  { id: 'exotic-sh', value: 128, stage: 3 },
  { id: 'balinese', value: 256, stage: 3 },
  { id: 'devon-rex', value: 512, stage: 3 },
  { id: 'manx', value: 1024, stage: 3 },
  // S4
  { id: 'chartreux', value: 8, stage: 4 },
  { id: 'havana-brown', value: 16, stage: 4 },
  { id: 'scottish', value: 32, stage: 4 },
  { id: 'siamese', value: 64, stage: 4 },
  { id: 'savannah', value: 128, stage: 4 },
  { id: 'american-sh', value: 256, stage: 4 },
  { id: 'norwegian', value: 512, stage: 4 },
  { id: 'british', value: 1024, stage: 4 },
  { id: 'persian', value: 2048, stage: 4 },
  // S5
  { id: 'singapura', value: 8, stage: 5 },
  { id: 'bengal', value: 16, stage: 5 },
  { id: 'turkish-van', value: 32, stage: 5 },
  { id: 'ocicat', value: 64, stage: 5 },
  { id: 'mainecoon', value: 128, stage: 5 },
  { id: 'korat', value: 256, stage: 5 },
  { id: 'cornish-rex', value: 512, stage: 5 },
  { id: 'pixiebob', value: 1024, stage: 5 },
  { id: 'tonkinese', value: 2048, stage: 5 },
  // Infinite
  { id: 'cheese', value: 4096, stage: 'infinite' },
  { id: 'nebelung', value: 8192, stage: 'infinite' },
];
