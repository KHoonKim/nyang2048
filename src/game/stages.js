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

export const CAT_DESCRIPTIONS = {
  korean: '한국에서 자연적으로 생겨난 토종 고양이로, 특별한 관리 없이도 건강하게 잘 자라요. 다양한 털 색과 무늬를 가지고 있고 적응력이 뛰어나 초보 집사에게도 딱이에요. 성격이 독립적이면서도 애정 표현도 할 줄 아는 균형 잡힌 고양이예요.',
  russian: '러시아 원산으로 은빛이 도는 블루 그레이 피모와 밝은 초록 눈이 신비로운 매력을 풍겨요. 조용하고 얌전한 편이지만 가족에게는 깊은 애정을 보여줘요. 추운 기후에서 적응하며 발달한 이중 털 덕분에 만져보면 엄청 포근해요.',
  ragdoll: '안아 올리면 온몸의 힘을 빼고 인형처럼 축 늘어지는 습성에서 이름이 붙었어요. 순하고 느긋한 성격으로 아이들과도 잘 어울리는 가족 친화적인 품종이에요. 파란 눈과 포인트 컬러 장모가 매우 아름답고, 보통 성묘가 될 때까지 3~4년이나 걸려요.',
  scottish: '자연 돌연변이로 귀 연골이 앞으로 접혀 있어 부엉이처럼 동글동글한 얼굴이 완성돼요. 차분하고 적응력이 좋아 실내 생활에 잘 맞는 성격이에요. 모든 스코티시폴드가 접힌 귀를 갖는 건 아니고, 태어날 때는 귀가 서 있다가 3~4주 후에 접혀요.',
  persian: '납작한 코와 풍성한 장모로 왕족 같은 우아함을 자랑하는 품종이에요. 온순하고 조용한 성격으로 조용한 실내 환경을 좋아하며, 무릎 위에 앉아 있는 걸 즐겨요. 매일 빗질이 필요한 긴 털 관리가 중요하지만, 그만큼 보람도 크답니다.',
  munchkin: '다리가 짧아 뒤뚱뒤뚱 걷는 모습이 너무 사랑스러운 품종이에요. 짧은 다리와 달리 점프력과 이동 능력은 일반 고양이와 비슷하게 발달해 있어요. 호기심이 넘치고 활발해서 집 안 구석구석을 탐험하는 걸 좋아해요.',
  siamese: '고대 태국 왕실에서 키워온 역사 깊은 품종으로, 독특한 포인트 컬러 패턴이 특징이에요. 사람과의 소통을 매우 좋아해서 크고 독특한 목소리로 자주 말을 걸어와요. 지능이 높고 사교적이어서 혼자 오래 두면 외로움을 많이 타요.',
  british: '통통하고 동글동글한 외모로 영국 신사처럼 위엄 있어 보이는 품종이에요. 느긋하고 독립적인 성격으로 조용히 곁에 있는 걸 좋아하며, 지나치게 들러붙지 않아요. 두꺼운 플러시 털은 손으로 누르면 천천히 돌아오는 독특한 질감이 있어요.',
  bombay: '검은 표범을 닮은 외모로 만들어진 품종으로, 검은 비단결 같은 털과 황금빛 눈이 인상적이에요. 버미즈의 피를 이어받아 사람을 매우 좋아하고 애정 표현이 풍부해요. 영리하고 장난기가 넘쳐서 놀이 시간을 무척 즐겨요.',
  'american-sh': '자연 선택으로 발달한 튼튼한 체형과 짧고 빽빽한 털이 특징이에요. 독립적이지만 가족과 함께하는 걸 좋아하는 균형 잡힌 성격을 가지고 있어요. 수명이 길고 건강한 편이라 오랫동안 함께할 수 있는 든든한 반려묘예요.',
  mainecoon: '미국에서 자연 발생한 대형 품종으로 젠틀 자이언트라고도 불려요. 개처럼 사람을 잘 따르고, 물을 좋아하며 장난감을 물어오는 행동도 자주 해요. 풍성한 꼬리와 귀 끝의 링크스 팁이 야생미를 더해주는 매력적인 품종이에요.',
  bengal: '야생 살쾡이(아시안 레퍼드 캣)와의 교배로 탄생한 품종으로 선명한 표범 무늬가 특징이에요. 활동량이 매우 많고 지능이 높아 다양한 놀이와 자극이 필요해요. 물을 좋아하는 개체가 많고, 운동을 충분히 해줘야 스트레스를 받지 않아요.',
  norwegian: '스칸디나비아의 혹독한 추위에서 살아남도록 진화한 이중 방수 털이 특징이에요. 큰 체구와 풍성한 갈기털이 작은 사자를 연상시키는 당당한 품종이에요. 독립적이지만 가족을 사랑하며, 높은 곳에 올라가 주위를 내려다보는 걸 즐겨요.',
  burmese: '근육이 발달한 단단한 체형에 비단 같이 부드러운 짧은 털이 매력적이에요. 매우 사교적이고 애교가 많아 항상 사람 곁에 있으려 해요. 놀기를 좋아하고 어릴 때의 장난기를 성묘가 되어서도 유지하는 영원한 아기 같은 품종이에요.',
  'exotic-sh': '페르시안의 납작한 얼굴과 동글동글한 체형을 그대로 닮았지만 짧은 털로 관리가 훨씬 편해요. 조용하고 온순한 성격으로 실내 생활에 완벽하게 적응해요. 페르시안을 좋아하지만 긴 털 관리가 부담스럽다면 최고의 선택이에요.',
  'turkish-angora': '터키 앙카라가 원산지인 자연 품종으로 실크처럼 부드러운 장모가 특징이에요. 우아한 외모와 달리 호기심이 많고 장난기가 넘치는 활발한 성격이에요. 지능이 높아 문을 여는 등 다양한 것을 스스로 터득하는 영리한 고양이예요.',
  abyssinian: '고대 이집트 벽화에서 볼 수 있는 가장 오래된 품종 중 하나예요. 티킹 무늬(각 털에 여러 색이 들어간)가 황금빛 야생미를 풍겨요. 매우 활발하고 호기심이 넘쳐서 높은 곳을 오르내리며 탐험하는 걸 좋아해요.',
  himalayan: '페르시안의 풍성한 장모와 샴의 포인트 컬러 무늬를 동시에 가진 품종이에요. 온화하고 얌전한 성격으로 조용한 환경을 선호해요. 파란 눈과 화려한 털 색 대비가 매우 아름다워 많은 사람의 마음을 사로잡는 품종이에요.',
  'havana-brown': '전 세계에서 드물게 볼 수 있는 희귀 품종으로, 따뜻한 초콜릿빛 피모가 눈길을 끌어요. 지능이 높고 사람 손으로 물건을 탐색하는 독특한 습성이 있어요. 애정이 넘쳐서 항상 집사 곁에 붙어 있고 혼자 두면 외로움을 잘 타요.',
  somali: '아비시니안의 장모 버전으로, 풍성한 꼬리가 여우를 닮아 여우 고양이라고도 불려요. 활동적이고 장난기가 많으며 놀이를 매우 즐기는 에너지 넘치는 품종이에요. 지능이 높아 퍼즐 장난감이나 간식 찾기 놀이를 잘 해내요.',
  balinese: '샴의 장모 버전으로, 우아하게 흐르는 털과 샴의 포인트 컬러가 특징이에요. 샴처럼 수다스럽고 사교적이지만 목소리는 조금 더 부드러워요. 영리하고 활발하며 가족 모두와 친하게 지내는 사랑스러운 품종이에요.',
  'oriental-sh': '샴과 비슷한 체형이지만 단색이나 다양한 무늬를 가진 품종이에요. 큰 귀와 날씬한 몸매, 아몬드 눈이 독특한 외모를 완성해요. 매우 사교적이고 호기심이 넘쳐서 집 안 모든 것을 탐험하며 항상 바쁘게 움직여요.',
  'egyptian-mau': '자연적으로 생겨난 점박이 무늬를 가진 유일한 가정묘 품종이에요. 고대 이집트에서 신성시되던 품종으로 현재도 그 핏줄을 이어오고 있어요. 다리가 길고 근육이 발달해 가정묘 중 가장 빠른 달리기 속도를 자랑한답니다.',
  'japanese-bt': '일본에서 행운과 번영을 가져다준다고 여겨지는 전통 있는 품종이에요. 짧고 둥글게 말린 꼬리가 마치 토끼 꼬리처럼 귀여운 게 특징이에요. 활발하고 영리하며 사람을 매우 좋아해서 쇼핑몰의 마네키네코(손 흔드는 고양이 인형) 모델이 바로 이 품종이에요.',
  'devon-rex': '큰 귀와 짧은 곱슬털, 개구쟁이 표정이 어우러진 독특한 외모의 품종이에요. 장난기가 넘치고 사람을 졸졸 따라다니는 습성이 있어 강아지 고양이라고도 불려요. 알레르기가 있는 사람에게도 비교적 잘 맞는 저자극성 털을 가지고 있어요.',
  'turkish-van': '터키 반 호수 지역이 원산지로, 흰 몸에 머리와 꼬리 부분만 색이 있는 독특한 패턴이에요. 고양이 중 드물게 물을 좋아해 욕조나 수영장에서 노는 걸 즐기기도 해요. 활발하고 독립적인 성격이지만 가족에게는 깊은 애정을 보여줘요.',
  toyger: '호랑이 무늬를 닮도록 육종된 품종으로, 선명한 줄무늬가 미니 호랑이를 연상시켜요. 외모와 달리 성격은 온순하고 친근하며 사람과의 교류를 좋아해요. 중간 정도의 활동량으로 일반 가정에서 기르기에 적합한 크기와 성격이에요.',
  savannah: '야생 서벌 고양이와 가정묘의 교배종으로, 큰 귀와 긴 다리, 점박이 무늬가 특징이에요. 고양이 중 최대 수준의 활동량과 점프력을 자랑하며, 충분한 공간과 자극이 필요해요. 개처럼 목줄을 하고 산책하는 것도 가능할 정도로 훈련에 잘 반응해요.',
  manx: '꼬리가 없거나 매우 짧은 것이 가장 큰 특징인 영국 맨 섬 출신 품종이에요. 둥근 엉덩이와 뒷다리가 앞다리보다 긴 체형 덕분에 토끼처럼 통통 뛰기도 해요. 충성심이 강하고 개처럼 주인을 잘 따르며 지능도 높은 편이에요.',
  'american-curl': '귀 연골이 뒤로 말려 있는 독특한 외모로, 태어날 때는 귀가 정상이다가 2~10일 내에 말리기 시작해요. 호기심이 많고 장난기가 넘치며 나이가 들어도 어린 고양이 같은 활발함을 유지해요. 사람을 좋아하고 사교적이어서 낯선 손님에게도 쉽게 다가가요.',
  chartreux: '프랑스 수도원에서 수도사들이 길렀다는 유서 깊은 품종이에요. 입꼬리가 올라가 항상 미소 짓는 것처럼 보이는 표정이 매력적이에요. 조용하고 온순한 성격으로 잘 짖지 않으며, 주인을 조용히 따라다니는 충직한 반려묘예요.',
  'cornish-rex': '다운 코트(부드러운 속털)만 가져 물결치는 곱슬털이 특징인 영국 콘월 출신 품종이에요. 날씬한 몸매와 큰 귀, 높은 광대뼈가 독특한 외모를 만들어내요. 매우 활발하고 장난기가 넘치며, 어릴 때의 에너지를 평생 유지하는 영원한 개구쟁이예요.',
  ocicat: '오셀롯(야생 고양이)을 닮은 점박이 무늬지만, 야생 고양이 피는 전혀 섞이지 않은 순수 가정묘예요. 아비시니안, 샴, 아메리칸숏헤어를 교배해 만들어진 품종이에요. 지능이 높고 사교적이어서 개처럼 주인을 따르고 이름을 부르면 달려오기도 해요.',
  singapura: '싱가포르 거리 고양이에서 유래한 세계에서 가장 작은 고양이 품종이에요. 큰 눈과 귀, 아이보리 바탕의 티킹 무늬가 귀여움을 더해요. 작은 체구와 달리 호기심이 왕성하고 활발하며, 사람 어깨 위나 무릎을 특히 좋아해요.',
  sphynx: '털이 없는 것처럼 보이지만 실제로는 아주 짧고 부드러운 솜털이 있어 복숭아 같은 감촉이에요. 체온 손실을 막으려고 항상 따뜻한 곳과 사람 곁을 찾는 애정파예요. 털이 없어 피부 유분이 많으니 정기적으로 목욕이 필요한 특별한 관리가 필요한 품종이에요.',
  'selkirk-rex': '곱슬곱슬한 복슬털이 인형처럼 귀여운 품종으로, 페르시안을 교배해 만들어졌어요. 느긋하고 온순한 성격으로 다른 반려동물과도 잘 어울려요. 태어날 때부터 곱슬한 수염도 가지고 있어 독특한 외모가 완성된답니다.',
  korat: '태국에서 수백 년간 행운과 번영을 가져다주는 고양이로 여겨져 온 품종이에요. 실버블루 털 끝이 빛을 받으면 은빛으로 반짝여 매우 아름다워요. 하트 모양의 얼굴과 밝은 초록 눈이 신비로운 매력을 더하는 품종이에요.',
  birman: '미얀마 사원의 수호묘로 전해져 내려오는 신성한 품종이에요. 실크 같은 장모와 파란 눈, 그리고 네 발의 하얀 장갑이 가장 큰 특징이에요. 온화하고 조용한 성격으로 다른 고양이나 개와도 잘 지내는 평화로운 반려묘예요.',
  pixiebob: '북미 살쾡이와 닮은 야생적인 외모지만, 실제로는 매우 친근하고 개 같은 성격이에요. 꼬리 길이가 다양하며 다발가락(발가락이 더 많은) 개체도 많아요. 주인을 졸졸 따라다니고 이름도 잘 기억하며, 가족에게 깊은 충성심을 보여요.',
  tonkinese: '버미즈와 샴의 장점을 골고루 물려받은 균형 잡힌 품종이에요. 수다스럽고 애정 표현이 풍부하며, 낯선 사람에게도 스스럼없이 다가가는 사교적인 성격이에요. 지능이 높아 다양한 장난감과 놀이에 잘 반응하고, 항상 가족의 중심에 있으려 해요.',
  nebelung: '러시안블루의 장모 버전으로, 안개처럼 흐릿하게 빛나는 은빛 블루 장모가 신비롭고 아름다워요. 조용하고 내성적인 성격으로 가족에게는 매우 헌신적이지만 낯선 사람에게는 수줍음을 잘 타요. 조용한 환경을 좋아하며, 오랫동안 함께하면 깊은 유대감을 형성하는 충직한 반려묘예요.',
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
