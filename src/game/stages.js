// Cat breed mappings for all stages

export const COMMON_CATS = {
  2: 'korean',
  4: 'russian',
  8: 'bombay',
  16: 'bengal',
  32: 'ragdoll',
};

// Stage cat maps: value → catId (1 cat per stage)
// Stages 1-11: Rare | 12-27: Epic | 28-36: Legendary
const S1  = { 64:   'scottish' };
const S2  = { 64:   'persian' };
const S3  = { 128:  'munchkin' };
const S4  = { 256:  'british' };
const S5  = { 128:  'american-sh' };
const S6  = { 128:  'siamese' };
const S7  = { 256:  'norwegian' };
const S8  = { 256:  'burmese' };
const S9  = { 512:  'exotic-sh' };
const S10 = { 256:  'turkish-angora' };
const S11 = { 512:  'abyssinian' };
const S12 = { 512:  'himalayan' };
const S13 = { 1024: 'havana-brown' };
const S14 = { 512:  'somali' };
const S15 = { 1024: 'balinese' };
const S16 = { 128:  'mainecoon' };
const S17 = { 256:  'oriental-sh' };
const S18 = { 1024: 'egyptian-mau' };
const S19 = { 2048: 'japanese-bt' };
const S20 = { 256:  'devon-rex' };
const S21 = { 512:  'chartreux' };
const S22 = { 1024: 'cornish-rex' };
const S23 = { 2048: 'savannah' };
const S24 = { 512:  'manx' };
const S25 = { 1024: 'american-curl' };
const S26 = { 1024: 'toyger' };
const S27 = { 2048: 'turkish-van' };
const S28 = { 2048: 'ocicat' };
const S29 = { 4096: 'singapura' };
const S30 = { 64:   'sphynx' };
const S31 = { 128:  'selkirk-rex' };
const S32 = { 128:  'korat' };
const S33 = { 256:  'birman' };
const S34 = { 2048: 'pixiebob' };
const S35 = { 4096: 'tonkinese' };
const S36 = { 8192: 'nebelung' };

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
const FILLER_OVERRIDES = {};

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

// 스테이지 기준 희귀도: Common(기본 타일), Rare(S1-S7), Epic(S8-S15), Legendary(S16-S20)
export const CAT_RARITY = {
  // Common (기본 합성 타일)
  korean: 'common', russian: 'common', bombay: 'common', bengal: 'common', ragdoll: 'common',
  // Rare (S1-S7)
  scottish: 'rare', persian: 'rare', munchkin: 'rare', british: 'rare',
  'american-sh': 'rare', siamese: 'rare', norwegian: 'rare', burmese: 'rare',
  'exotic-sh': 'rare', 'turkish-angora': 'rare', abyssinian: 'rare',
  // Epic (S8-S15)
  himalayan: 'epic', 'havana-brown': 'epic', somali: 'epic', balinese: 'epic',
  mainecoon: 'epic', 'oriental-sh': 'epic', 'egyptian-mau': 'epic', 'japanese-bt': 'epic',
  'devon-rex': 'epic', chartreux: 'epic', 'cornish-rex': 'epic', savannah: 'epic',
  manx: 'epic', 'american-curl': 'epic', toyger: 'epic', 'turkish-van': 'epic',
  // Legendary (S16-S20)
  ocicat: 'legendary', singapura: 'legendary', sphynx: 'legendary', 'selkirk-rex': 'legendary',
  korat: 'legendary', birman: 'legendary', pixiebob: 'legendary', tonkinese: 'legendary',
  nebelung: 'legendary',
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
  // ── Rare (1–11) ──
  1:  { id: 1,  rows: 5, cols: 5, size: 5, goal: 64,   initialTiles: 3, cats: S1,  boardLabel: '5×5', difficulty: 1 },
  2:  { id: 2,  rows: 5, cols: 5, size: 5, goal: 64,   initialTiles: 3, cats: S2,  boardLabel: '5×5', difficulty: 1 },
  3:  { id: 3,  rows: 5, cols: 5, size: 5, goal: 128,  initialTiles: 3, cats: S3,  boardLabel: '5×5', difficulty: 1 },
  4:  { id: 4,  rows: 5, cols: 5, size: 5, goal: 256,  initialTiles: 3, cats: S4,  boardLabel: '5×5', difficulty: 2 },
  5:  { id: 5,  rows: 4, cols: 4, size: 4, goal: 128,  initialTiles: 2, cats: S5,  boardLabel: '4×4', difficulty: 2 },
  6:  { id: 6,  rows: 4, cols: 4, size: 4, goal: 128,  initialTiles: 2, cats: S6,  boardLabel: '4×4', difficulty: 2 },
  7:  { id: 7,  rows: 4, cols: 4, size: 4, goal: 256,  initialTiles: 2, cats: S7,  boardLabel: '4×4', difficulty: 2 },
  8:  { id: 8,  rows: 5, cols: 5, size: 5, goal: 256,  initialTiles: 3, cats: S8,  boardLabel: '5×5', difficulty: 2 },
  9:  { id: 9,  rows: 5, cols: 5, size: 5, goal: 512,  initialTiles: 3, cats: S9,  boardLabel: '5×5', difficulty: 2 },
  10: { id: 10, rows: 4, cols: 4, size: 4, goal: 256,  initialTiles: 2, cats: S10, boardLabel: '4×4', difficulty: 3 },
  11: { id: 11, rows: 4, cols: 4, size: 4, goal: 512,  initialTiles: 2, cats: S11, boardLabel: '4×4', difficulty: 3 },
  // ── Epic (12–27) ──
  12: { id: 12, rows: 4, cols: 4, size: 4, goal: 512,  initialTiles: 2, cats: S12, boardLabel: '4×4', difficulty: 3 },
  13: { id: 13, rows: 4, cols: 4, size: 4, goal: 1024, initialTiles: 2, cats: S13, boardLabel: '4×4', difficulty: 3 },
  14: { id: 14, rows: 5, cols: 5, size: 5, goal: 512,  initialTiles: 3, cats: S14, boardLabel: '5×5', difficulty: 3 },
  15: { id: 15, rows: 5, cols: 5, size: 5, goal: 1024, initialTiles: 3, cats: S15, boardLabel: '5×5', difficulty: 3 },
  16: { id: 16, rows: 3, cols: 4, size: 3, goal: 128,  initialTiles: 2, cats: S16, boardLabel: '4×3', difficulty: 3 },
  17: { id: 17, rows: 3, cols: 4, size: 3, goal: 256,  initialTiles: 2, cats: S17, boardLabel: '4×3', difficulty: 3 },
  18: { id: 18, rows: 4, cols: 4, size: 4, goal: 1024, initialTiles: 2, cats: S18, boardLabel: '4×4', difficulty: 4 },
  19: { id: 19, rows: 4, cols: 4, size: 4, goal: 2048, initialTiles: 2, cats: S19, boardLabel: '4×4', difficulty: 4 },
  20: { id: 20, rows: 3, cols: 4, size: 3, goal: 256,  initialTiles: 2, cats: S20, boardLabel: '4×3', difficulty: 4 },
  21: { id: 21, rows: 3, cols: 4, size: 3, goal: 512,  initialTiles: 2, cats: S21, boardLabel: '4×3', difficulty: 4 },
  22: { id: 22, rows: 5, cols: 5, size: 5, goal: 1024, initialTiles: 3, cats: S22, boardLabel: '5×5', difficulty: 4 },
  23: { id: 23, rows: 5, cols: 5, size: 5, goal: 2048, initialTiles: 3, cats: S23, boardLabel: '5×5', difficulty: 4 },
  24: { id: 24, rows: 3, cols: 4, size: 3, goal: 512,  initialTiles: 2, cats: S24, boardLabel: '4×3', difficulty: 4 },
  25: { id: 25, rows: 3, cols: 4, size: 3, goal: 1024, initialTiles: 2, cats: S25, boardLabel: '4×3', difficulty: 4 },
  26: { id: 26, rows: 6, cols: 6, size: 6, goal: 1024, initialTiles: 3, cats: S26, boardLabel: '6×6', difficulty: 4 },
  27: { id: 27, rows: 6, cols: 6, size: 6, goal: 2048, initialTiles: 3, cats: S27, boardLabel: '6×6', difficulty: 4 },
  // ── Legendary (28–36) ──
  28: { id: 28, rows: 6, cols: 6, size: 6, goal: 2048, initialTiles: 3, cats: S28, boardLabel: '6×6', difficulty: 5 },
  29: { id: 29, rows: 6, cols: 6, size: 6, goal: 4096, initialTiles: 3, cats: S29, boardLabel: '6×6', difficulty: 5 },
  30: { id: 30, rows: 3, cols: 3, size: 3, goal: 64,   initialTiles: 2, cats: S30, boardLabel: '3×3', difficulty: 5 },
  31: { id: 31, rows: 3, cols: 3, size: 3, goal: 128,  initialTiles: 2, cats: S31, boardLabel: '3×3', difficulty: 5 },
  32: { id: 32, rows: 3, cols: 3, size: 3, goal: 128,  initialTiles: 2, cats: S32, boardLabel: '3×3', difficulty: 5 },
  33: { id: 33, rows: 3, cols: 3, size: 3, goal: 256,  initialTiles: 2, cats: S33, boardLabel: '3×3', difficulty: 5 },
  34: { id: 34, rows: 7, cols: 7, size: 7, goal: 2048, initialTiles: 4, cats: S34, boardLabel: '7×7', difficulty: 5 },
  35: { id: 35, rows: 7, cols: 7, size: 7, goal: 4096, initialTiles: 4, cats: S35, boardLabel: '7×7', difficulty: 5 },
  36: { id: 36, rows: 8, cols: 8, size: 8, goal: 8192, initialTiles: 4, cats: S36, boardLabel: '8×8', difficulty: 5 },
  infinite: { id: 'infinite', rows: null, cols: null, size: null, goal: null, initialTiles: 2, cats: S36, boardLabel: '∞', difficulty: 0 },
};

// Medal score thresholds per stage
// Bronze: stage clear (any score)
// Silver: clear + score >= silver
// Gold:   clear + score >= gold

// Ordered list of all cats with their stage context
export const ALL_CATS_ORDERED = [
  ...Object.values(COMMON_CATS).map(id => ({ id, stage: 'common' })),
  ...Array.from({ length: 36 }, (_, i) => i + 1).flatMap(n =>
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

// ── Sub-stage system ──

export const BOARD_LADDER = [
  { rows: 3, cols: 3, boardLabel: '3×3' },
  { rows: 3, cols: 4, boardLabel: '4×3' },
  { rows: 4, cols: 4, boardLabel: '4×4' },
  { rows: 5, cols: 5, boardLabel: '5×5' },
  { rows: 6, cols: 6, boardLabel: '6×6' },
  { rows: 7, cols: 7, boardLabel: '7×7' },
  { rows: 8, cols: 8, boardLabel: '8×8' },
];

function getBoardLadderIndex(rows, cols) {
  return BOARD_LADDER.findIndex(b => b.rows === rows && b.cols === cols);
}

function getInitialTilesForBoard(rows, cols) {
  const cells = rows * cols;
  if (cells <= 16) return 2;   // 3×3, 4×3, 4×4
  if (cells <= 36) return 3;   // 5×5, 6×6
  return 4;                    // 7×7, 8×8
}

// Parse "1-1" → { stageNum: 1, subNum: 1 }
// Handles legacy integer format: "5" → { stageNum: 5, subNum: 1 }
export function parseStageId(id) {
  const s = String(id);
  if (s.includes('-')) {
    const [stageNum, subNum] = s.split('-').map(Number);
    return { stageNum, subNum };
  }
  return { stageNum: parseInt(s, 10), subNum: 1 };
}

export function formatStageId(stageNum, subNum) {
  return `${stageNum}-${subNum}`;
}

// Returns config for a specific sub-stage.
// subNum: 1 (easiest, large board), 2 (medium), 3 (hardest = current stage config)
export function getSubStageConfig(stageNum, subNum) {
  const base = STAGES[stageNum];
  if (!base) return null;

  const catLineup = getStageCatLineup(stageNum); // sorted by tile value ascending
  const N = catLineup.length;

  const stepsUp = 3 - subNum; // X-1: 2 steps, X-2: 1 step, X-3: 0 steps

  const baseIdx = getBoardLadderIndex(base.rows, base.cols);
  if (baseIdx === -1) return { ...base, boardKey: formatStageId(stageNum, subNum), stageNum, subNum };
  const maxIdx = BOARD_LADDER.length - 1;

  const targetIdx = Math.min(baseIdx + stepsUp, maxIdx);
  const boardOverflow = Math.max(0, (baseIdx + stepsUp) - maxIdx);

  const newBoard = BOARD_LADDER[targetIdx];

  // Cat count reduction when board size is capped
  let goal = base.goal;
  if (boardOverflow > 0) {
    const targetCatIdx = N - 1 - boardOverflow;
    if (targetCatIdx >= 0) goal = catLineup[targetCatIdx].value;
  }

  return {
    ...base,
    rows: newBoard.rows,
    cols: newBoard.cols,
    boardLabel: newBoard.boardLabel,
    goal,
    initialTiles: getInitialTilesForBoard(newBoard.rows, newBoard.cols),
    boardKey: formatStageId(stageNum, subNum),
    stageNum,
    subNum,
  };
}
