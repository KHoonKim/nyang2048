// Cat breed mappings for all stages

export const COMMON_CATS = {
  2: 'korean',
  4: 'russian',
  8: 'bombay',
  16: 'bengal',
  32: 'ragdoll',
};

// Stage cat maps: value → catId (2 cats per stage)
// Arranged by popularity/familiarity: well-known breeds early, rare/exotic breeds late
const S1  = { 64: 'scottish' }; // 스코티시폴드 (봄베이/벵갈/렉돌은 공통)
const S2  = { 64: 'persian',       128: 'munchkin' };       // 페르시안, 먼치킨
const S3  = { 256: 'british' };                              // 브리티시숏헤어 (128은 filler 페르시안)
const S4  = { 128: 'american-sh' };                          // 아메리칸숏헤어 (64는 filler 스코티시폴드)
const S5  = { 128: 'siamese',      256: 'norwegian' };      // 샴, 노르웨이숲
const S6  = { 256: 'burmese',      512: 'exotic-sh' };      // 버미즈, 엑조틱숏헤어
const S7  = { 256: 'turkish-angora', 512: 'abyssinian' };   // 터키시앙고라, 아비시니안
const S8  = { 512: 'himalayan',   1024: 'havana-brown' };   // 히말라얀(컬러포인트), 하바나브라운(초콜릿 솔리드)
const S9  = { 512: 'somali',      1024: 'balinese' };       // 소말리, 발리니즈 — 완충 구간
const S10 = { 128: 'mainecoon',    256: 'oriental-sh' };    // 메인쿤, 오리엔탈숏헤어 — 4×3 첫 등장
const S11 = { 1024: 'egyptian-mau', 2048: 'japanese-bt' };  // 이집션마우, 재패니즈밥테일
const S12 = { 256: 'devon-rex',    512: 'chartreux' };      // 데본렉스(얇고 주름), 샤르트뢰(블루그레이)
const S13 = { 1024: 'cornish-rex', 2048: 'savannah' };      // 코니시렉스(곱슬), 사바나
const S14 = { 512: 'manx',        1024: 'american-curl' };  // 맹크스, 아메리칸컬
const S15 = { 1024: 'toyger',     2048: 'turkish-van' };    // 토이거(오렌지 호랑이), 터키시반(흰색)
const S16 = { 2048: 'ocicat',     4096: 'singapura' };      // 옥시캣, 싱가퓨라 — 희소 품종
const S17 = { 64: 'sphynx',       128: 'selkirk-rex' };     // 스핑크스, 셀커크렉스 — 극한 외모
const S18 = { 128: 'korat',       256: 'birman' };          // 코랏(블루그레이), 버만(컬러포인트+흰발 — 색 대비)
const S19 = { 2048: 'pixiebob',   4096: 'tonkinese' };      // 픽시밥, 통키니즈 — 장기전
const S20 = { 8192: 'nebelung' };                            // 네벨룽 — 최종 보스 (4096은 filler 치즈태비)

export const INFINITE_CATS = {
  4096: 'tonkinese',
  8192: 'nebelung',
};

// Filler cats for intermediate values — ensures all tiles show cat images
// Each value maps to a breed from another stage, reused across stages
const FILLER_CATS = {
  64: 'scottish',
  128: 'munchkin',
  256: 'british',
  512: 'exotic-sh',
  1024: 'havana-brown',
  2048: 'savannah',
  4096: 'tonkinese',
  8192: 'nebelung',
};

// Per-stage overrides when default filler conflicts with stage's collectible breed
const FILLER_OVERRIDES = {
  3: { 128: 'persian' },  // S3: 페르시안 filler (기본 munchkin 대신)
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
  nebelung: '네벨룽',
};

// 타일 값 기준 희귀도: Common(2-32), Rare(64-256), Epic(512-2048), Legendary(4096+)
export const CAT_RARITY = {
  // Common (타일 2-32)
  korean: 'common', russian: 'common', bombay: 'common', bengal: 'common', ragdoll: 'common',
  // Rare (타일 64-256)
  scottish: 'rare', persian: 'rare', munchkin: 'rare', british: 'rare',
  'american-sh': 'rare', siamese: 'rare', norwegian: 'rare', burmese: 'rare',
  'turkish-angora': 'rare', mainecoon: 'rare', 'oriental-sh': 'rare',
  'devon-rex': 'rare', birman: 'rare', korat: 'rare', sphynx: 'rare',
  'selkirk-rex': 'rare',
  // Epic (타일 512-2048)
  'exotic-sh': 'epic', abyssinian: 'epic', himalayan: 'epic', 'havana-brown': 'epic',
  somali: 'epic', balinese: 'epic', 'egyptian-mau': 'epic', 'japanese-bt': 'epic',
  chartreux: 'epic', 'cornish-rex': 'epic', savannah: 'epic', manx: 'epic',
  'american-curl': 'epic', toyger: 'epic', 'turkish-van': 'epic', ocicat: 'epic',
  pixiebob: 'epic',
  // Legendary (타일 4096+)
  singapura: 'legendary', tonkinese: 'legendary', nebelung: 'legendary',
};

export const CAT_TRAITS = {
  korean: '한국 대표 고양이, 건강하고 적응력이 뛰어나요',
  russian: '은빛 블루 피모에 초록 눈이 매력적',
  ragdoll: '안기면 인형처럼 축 늘어지는 순둥이',
  scottish: '접힌 귀가 귀여운 동글동글 고양이',
  persian: '납작한 얼굴에 풍성한 장모가 매력',
  munchkin: '짧은 다리로 뒤뚱뒤뚱 걷는 모습이 사랑스러워요',
  siamese: '수다쟁이! 높은 목소리로 대화해요',
  british: '통통하고 동글동글한 영국 신사',
  bombay: '미니 흑표범, 금빛 눈이 인상적',
  'american-sh': '튼튼하고 독립적인 미국 대표 품종',
  mainecoon: '대형 고양이의 왕, 젠틀 자이언트',
  bengal: '야생 표범 무늬의 활동적인 고양이',
  norwegian: '숲의 요정, 풍성한 털과 큰 체구',
  burmese: '근육질 몸에 벨벳 같은 짧은 털',
  'exotic-sh': '페르시안의 얼굴에 짧은 털, 관리가 편해요',
  'turkish-angora': '우아한 실크 같은 하얀 장모',
  abyssinian: '날씬하고 호기심 많은 활동파',
  himalayan: '페르시안+샴의 매력을 모두 가진 품종',
  'havana-brown': '초콜릿빛 피모가 독특해요',
  somali: '긴 꼬리의 여우 같은 고양이',
  balinese: '샴의 장모 버전, 우아하고 영리해요',
  'oriental-sh': '큰 귀에 날씬한 몸매, 호기심 대장',
  'egyptian-mau': '자연 점박이 무늬의 빠른 달리기 선수',
  'japanese-bt': '짧은 꼬리의 일본 행운 고양이',
  'devon-rex': '큰 귀에 곱슬 털, 장난꾸러기 요정',
  'turkish-van': '수영을 좋아하는 흰 고양이',
  toyger: '호랑이 줄무늬의 소형 맹수',
  savannah: '야생 서벌과의 교배종, 큰 체구',
  manx: '꼬리가 없거나 아주 짧은 품종',
  'american-curl': '뒤로 말린 귀가 독특한 매력',
  chartreux: '프랑스의 미소 짓는 블루 고양이',
  'cornish-rex': '곱슬곱슬 파마 털의 날씬한 고양이',
  ocicat: '오셀롯 무늬지만 순한 가정 고양이',
  singapura: '세계에서 가장 작은 품종',
  sphynx: '털 없는 외계인 고양이, 체온이 높아요',
  'selkirk-rex': '복슬복슬 곱슬 털이 귀여운 곰돌이',
  korat: '태국의 행운 고양이, 하트형 얼굴',
  birman: '하얀 발에 사파이어 눈의 신비로운 품종',
  pixiebob: '살쾡이를 닮은 야생적 외모',
  tonkinese: '버미즈+샴의 장점만 모은 사교적 고양이',
  nebelung: '은빛 안개처럼 신비로운 장모 블루',
};

export const STAGES = {
  1:  { id: 1,  rows: 5, cols: 5, size: 5, goal: 64,   initialTiles: 3, cats: S1,  boardLabel: '5×5', difficulty: 1 },
  2:  { id: 2,  rows: 5, cols: 5, size: 5, goal: 128,  initialTiles: 3, cats: S2,  boardLabel: '5×5', difficulty: 1 },
  3:  { id: 3,  rows: 5, cols: 5, size: 5, goal: 256,  initialTiles: 3, cats: S3,  boardLabel: '5×5', difficulty: 2 },
  4:  { id: 4,  rows: 4, cols: 4, size: 4, goal: 128,  initialTiles: 2, cats: S4,  boardLabel: '4×4', difficulty: 2 },
  5:  { id: 5,  rows: 4, cols: 4, size: 4, goal: 256,  initialTiles: 2, cats: S5,  boardLabel: '4×4', difficulty: 2 },
  6:  { id: 6,  rows: 5, cols: 5, size: 5, goal: 512,  initialTiles: 3, cats: S6,  boardLabel: '5×5', difficulty: 2 },
  7:  { id: 7,  rows: 4, cols: 4, size: 4, goal: 512,  initialTiles: 2, cats: S7,  boardLabel: '4×4', difficulty: 3 },
  8:  { id: 8,  rows: 4, cols: 4, size: 4, goal: 1024, initialTiles: 2, cats: S8,  boardLabel: '4×4', difficulty: 3 },
  9:  { id: 9,  rows: 5, cols: 5, size: 5, goal: 1024, initialTiles: 3, cats: S9,  boardLabel: '5×5', difficulty: 3 },
  10: { id: 10, rows: 3, cols: 4, size: 3, goal: 256,  initialTiles: 2, cats: S10, boardLabel: '4×3', difficulty: 3 },
  11: { id: 11, rows: 4, cols: 4, size: 4, goal: 2048, initialTiles: 2, cats: S11, boardLabel: '4×4', difficulty: 4 },
  12: { id: 12, rows: 3, cols: 4, size: 3, goal: 512,  initialTiles: 2, cats: S12, boardLabel: '4×3', difficulty: 4 },
  13: { id: 13, rows: 5, cols: 5, size: 5, goal: 2048, initialTiles: 3, cats: S13, boardLabel: '5×5', difficulty: 4 },
  14: { id: 14, rows: 3, cols: 4, size: 3, goal: 1024, initialTiles: 2, cats: S14, boardLabel: '4×3', difficulty: 4 },
  15: { id: 15, rows: 6, cols: 6, size: 6, goal: 2048, initialTiles: 3, cats: S15, boardLabel: '6×6', difficulty: 4 },
  16: { id: 16, rows: 6, cols: 6, size: 6, goal: 4096, initialTiles: 3, cats: S16, boardLabel: '6×6', difficulty: 5 },
  17: { id: 17, rows: 3, cols: 3, size: 3, goal: 128,  initialTiles: 2, cats: S17, boardLabel: '3×3', difficulty: 5 },
  18: { id: 18, rows: 3, cols: 3, size: 3, goal: 256,  initialTiles: 2, cats: S18, boardLabel: '3×3', difficulty: 5 },
  19: { id: 19, rows: 7, cols: 7, size: 7, goal: 4096, initialTiles: 4, cats: S19, boardLabel: '7×7', difficulty: 5 },
  20: { id: 20, rows: 8, cols: 8, size: 8, goal: 8192, initialTiles: 4, cats: S20, boardLabel: '8×8', difficulty: 5 },
  infinite: { id: 'infinite', rows: null, cols: null, size: null, goal: null, initialTiles: 2, cats: S20, boardLabel: '∞', difficulty: 0 },
};

// Medal score thresholds per stage
// Bronze: stage clear (any score)
// Silver: clear + score >= silver
// Gold:   clear + score >= gold
export const STAGE_MEDAL_TARGETS = {
  1:  { silver:  2000, gold:   5000 },  // 5×5, goal 64
  2:  { silver:  3000, gold:   8000 },  // 5×5, goal 128
  3:  { silver:  6000, gold:  15000 },  // 5×5, goal 256
  4:  { silver:  4000, gold:  10000 },  // 4×4, goal 128
  5:  { silver:  8000, gold:  20000 },  // 4×4, goal 256
  6:  { silver: 15000, gold:  35000 },  // 5×5, goal 512
  7:  { silver: 12000, gold:  30000 },  // 4×4, goal 512
  8:  { silver: 25000, gold:  60000 },  // 4×4, goal 1024
  9:  { silver: 30000, gold:  70000 },  // 5×5, goal 1024
  10: { silver:  6000, gold:  15000 },  // 4×3, goal 256
  11: { silver: 50000, gold: 120000 },  // 4×4, goal 2048
  12: { silver: 12000, gold:  28000 },  // 4×3, goal 512
  13: { silver: 60000, gold: 150000 },  // 5×5, goal 2048
  14: { silver: 20000, gold:  50000 },  // 4×3, goal 1024
  15: { silver: 70000, gold: 180000 },  // 6×6, goal 2048
  16: { silver: 100000, gold: 250000 }, // 6×6, goal 4096
  17: { silver:  1500, gold:   4000 },  // 3×3, goal 128
  18: { silver:  3000, gold:   8000 },  // 3×3, goal 256
  19: { silver: 120000, gold: 300000 }, // 7×7, goal 4096
  20: { silver: 200000, gold: 500000 }, // 8×8, goal 8192
};

// Ordered list of all cats with their stage context
export const ALL_CATS_ORDERED = [
  ...Object.values(COMMON_CATS).map(id => ({ id, stage: 'common' })),
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].flatMap(n =>
    Object.values(STAGES[n].cats).map(id => ({ id, stage: n }))
  ),
];

export function getCatForValue(stageId, value) {
  if (COMMON_CATS[value]) return COMMON_CATS[value];
  if (stageId === 'infinite') {
    if (INFINITE_CATS[value]) return INFINITE_CATS[value];
    return FILLER_CATS[value] || null;
  }
  const stage = STAGES[stageId];
  if (!stage) return FILLER_CATS[value] || null;
  // Stage collectible cats first
  if (stage.cats[value]) return stage.cats[value];
  // Per-stage filler override (when default filler conflicts with collectible)
  if (FILLER_OVERRIDES[stageId]?.[value]) return FILLER_OVERRIDES[stageId][value];
  // Default filler
  return FILLER_CATS[value] || null;
}

export function getCatImage(catId) {
  return `cats/${catId}-loaf.webp`;
}

// Get ordered list of all cats that appear in a stage (value ascending)
export function getStageCatLineup(stageId) {
  const allCats = getAllCatsForStage(stageId);
  const stage = STAGES[stageId];
  const goal = stage ? stage.goal : null;
  return Object.entries(allCats)
    .map(([val, catId]) => ({ value: parseInt(val), catId }))
    .filter(({ value }) => goal ? value <= goal : true)
    .sort((a, b) => a.value - b.value);
}

export function getAllCatsForStage(stageId) {
  const result = { ...COMMON_CATS, ...FILLER_CATS };
  if (stageId === 'infinite') {
    Object.assign(result, INFINITE_CATS);
  } else {
    const stage = STAGES[stageId];
    if (stage) {
      // Apply per-stage filler overrides
      if (FILLER_OVERRIDES[stageId]) {
        for (const [val, cat] of Object.entries(FILLER_OVERRIDES[stageId])) {
          result[parseInt(val)] = cat;
        }
      }
      // Stage collectibles take priority
      Object.assign(result, stage.cats);
    }
  }
  return result;
}
