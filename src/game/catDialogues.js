// src/game/catDialogues.js

export const CAT_DIALOGUES = {
  // ── Common ──
  korean: {
    first:    '...뭐냥, 나 왜 쳐다보냥. 간식 있냥?',
    friendly: '어, 또 왔다냥. 뭐 가져왔냥?',
    butler:   '나 배고프다냥. 밥 줘냥. 지금 당장이냥.',
  },
  russian: {
    first:    '...가까이 오지 마옹. 아직 잘 모른다옹.',
    friendly: '...조용한 편이구나냥. 나쁘진 않다옹.',
    butler:   '네 옆이 제일 평화롭다옹. 계속 거기 있어옹.',
  },
  bombay: {
    first:    '나 불렀냥? 나냥 나냥! 완전 잘생겼다냥~',
    friendly: '나 따라다닐 거냥. 어디 가냥? 같이 가냥!',
    butler:   '집사냥~ 집사냥~ 집사냥~! (무한반복)',
  },
  bengal: {
    first:    '...지금 뛰어갈 준비 중이다냥. 방해하지 마냥.',
    friendly: '같이 놀자냥! 근데 규칙은 내가 정한다냥.',
    butler:   '오늘 벽 열 번 타고 물건 두 개 떨어뜨렸다냥. 기록이냥.',
  },
  ragdoll: {
    first:    '...안아줘도 돼옹. 도망 안 간다옹.',
    friendly: '여기 앉아도 돼옹? 무릎 빌려줄게옹.',
    butler:   '어디 가옹? 나도... (따라감)',
  },

  // ── Rare ──
  scottish: {
    first:    '...흠냥. (동그란 눈으로 빤히 봄)',
    friendly: '나쁘지 않다냥.',
    butler:   '오늘도 여기 앉겠다냥. 문제 있냥?',
  },
  persian: {
    first:    '...무릎 준비됐냥? 앉아줄 수도 있다옹.',
    friendly: '빗질 잘하는구나냥. 계속해도 된다옹.',
    butler:   '이 집은 내 왕국이다옹. 넌 충신이고옹.',
  },
  munchkin: {
    first:    '안녕이다냥! 나 작아 보여도 엄청 빠르다냥.',
    friendly: '저기 높은 곳 어떻게 올라가냥? 방법 알려줘냥!',
    butler:   '다리 짧은 게 장점이다냥. 무게중심이 낮잖냥.',
  },
  british: {
    first:    '접근 허가 아직 안 났다옹.',
    friendly: '...같은 방에 있어도 되긴 한다옹.',
    butler:   '안아들지 않으면, 옆에 있어줄 수 있다옹.',
  },
  'american-sh': {
    first:    '어, 안녕이다냥! 적응 빠른 편이냥. 금방 친해질 수 있냥.',
    friendly: '이 집 이제 익숙해졌다냥. 집사도 마음에 들고냥.',
    butler:   '가족이 생겼다냥! 우리 가족이냥!',
  },
  siamese: {
    first:    '야옹냥. 야옹냥. 야옹냥. 보고 있냥? 야옹냥.',
    friendly: '오늘 할 말 많다냥. 들을 준비 됐냥? 냥냥냥~',
    butler:   '조용히 있지 마냥. 내가 채워줄게냥. 냥냥!',
  },
  norwegian: {
    first:    '...숲에서 왔다냥. 여기도 나쁘지 않냥.',
    friendly: '높은 데 같이 올라갈래냥? 잘 가르쳐줄 수 있다냥.',
    butler:   '겨울에 내 털 만져봐냥. 천연 핫팩이다냥.',
  },
  burmese: {
    first:    '안녕이다냥! 사람 만나는 거 엄청 좋아한다냥!',
    friendly: '오늘 같이 낮잠 잘 수 있냥? 옆에 있어도 돼냥.',
    butler:   '집사가 최고다냥. 내 인생에서 제일 잘한 선택이냥.',
  },
  'exotic-sh': {
    first:    '...zzz... 어, 왔냥? zzz...',
    friendly: '여기... 편하다냥... 계속 있어도 돼옹... zzz...',
    butler:   '깨워줘서 고맙다냥... 밥 줄 거냥? zzz...',
  },
  'turkish-angora': {
    first:    '처음 보는 거다옹. 내 우아함에 놀라지 마옹.',
    friendly: '물 좋아한다옹. 수도꼭지 틀어줄 거냥?',
    butler:   '이 집에서 제일 아름다운 건 나다옹. 동의하냥?',
  },
  abyssinian: {
    first:    '이 집 구석구석 다 탐험했다냥! 비밀 없냥!',
    friendly: '저기 저 선반 올라갈 수 있다냥. 못 말린다냥.',
    butler:   '집사, 오늘 같이 탐험 몇 번 했냥? 나는 열두 번이다냥.',
  },

  // ── Epic ──
  himalayan: {
    first:    '...조용히 있을게옹. 방해하지 마옹.',
    friendly: '손 따뜻하냥. 조금만 더 만져도 돼옹.',
    butler:   '페르시안의 품위와 샴의 감성. 그게 나다냥.',
  },
  'havana-brown': {
    first:    '(발로 콕콕) 이게 뭐냥? 저게 뭐냥? 흠냥...',
    friendly: '(발로 얼굴 콕) 이게 집사냥? 흠, 나쁘지 않다냥.',
    butler:   '세상 모든 걸 발로 확인했는데냥, 집사가 제일 좋다냥.',
  },
  somali: {
    first:    '여우 아니다냥. 고양이다냥. 혼동하지 마냥.',
    friendly: '이 꼬리 예쁘냥? 만지고 싶으면 달리기 해봐냥.',
    butler:   '집사는 내 꼬리 만질 자격이 있다냥. 특별히 허락해줄게냥.',
  },
  balinese: {
    first:    '안녕이다냥~ 할 말이 정말 많다냥. 앉아봐냥.',
    friendly: '오늘 이야기 들어줘서 고맙다냥. 내일도 있냥.',
    butler:   '말이 많은 건 좋아서 그런 거다냥. 계속 들어줄 거냥?',
  },
  mainecoon: {
    first:    '크다고 무서워하지 마냥. 젠틀자이언트다냥.',
    friendly: '문 따라다니는 게 취미다냥. 집사 가는 곳마다 갈 거냥.',
    butler:   '내가 크니까 집사 보호는 내가 한다냥. 걱정하지 마냥.',
  },
  'oriental-sh': {
    first:    '이 귀 봐냥. 안테나다냥. 집사 생각 다 읽힌냥.',
    friendly: '지금 뭐 생각하냥? 말 안 해도 안냥. 간식 생각이냥?',
    butler:   '집사 마음 다 안냥. 그래도 말해줘냥. 듣는 게 좋아서냥.',
  },
  'egyptian-mau': {
    first:    '세상에서 제일 빠른 집고양이다냥. 믿냥?',
    friendly: '나만 따라오면 된다냥. 빠르게 갈게냥.',
    butler:   '집사는 내 파라오다냥. 영원히 모실게냥.',
  },
  'japanese-bt': {
    first:    '만복이다냥~ 행운 가져다줄게냥. 꼬리 짧은 게 포인트냥.',
    friendly: '나랑 있으면 좋은 일만 생긴다냥. 써봐서 안냥.',
    butler:   '집사한테만 최고 등급 행운 드릴게냥. 고마워해냥~',
  },
  'devon-rex': {
    first:    '요정이냥? 고양이냥? 둘 다다냥! 나냥 나냥!',
    friendly: '장난쳐도 화내지 마냥. 사랑해서 그러는 거다냥.',
    butler:   '집사 인생에 마법이 필요하냥? 내가 있잖냥.',
  },
  chartreux: {
    first:    '...(동그란 눈으로 조용히 바라봄)',
    friendly: '말 안 해도 마음은 전달되고 있다냥.',
    butler:   '우리 사이엔 말이 필요 없냥.',
  },
  'cornish-rex': {
    first:    '만져봐냥! 곱슬곱슬하냥? 신기하냥?',
    friendly: '따뜻한 데 좋다냥. 집사 무릎 자리 예약할게냥.',
    butler:   '겨울엔 내가 집사 핫팩 해줄게냥. 공평한 거다냥.',
  },
  savannah: {
    first:    '야생에서 왔다냥. 여기가 마음에 드는지는 두고 봐야 안냥.',
    friendly: '...인정이다냥. 여기 나쁘지 않냥. 집사도 봐줄 만하냥.',
    butler:   '충성심은 강아지급이다냥. 집사를 선택했냥, 평생.',
  },
  manx: {
    first:    '꼬리 없는 거 안냥. 물어보려 했냥? 태어날 때부터다냥.',
    friendly: '내가 뛰는 거 봤냥? 토끼처럼 깡충깡충이다냥.',
    butler:   '꼬리 대신 눈으로 감정 표현한다냥. 보이냥?',
  },
  'american-curl': {
    first:    '귀가 뒤로 말렸냥? 태어날 때부터 패션이다냥.',
    friendly: '이 귀 만져도 돼냥. 살살만냥.',
    butler:   '집사 귀도 말려있으면 더 어울릴 텐데냥. 아쉽다냥.',
  },
  toyger: {
    first:    '나 호랑이냥. 아니, 고양이다냥. ...호랑이처럼 생긴 고양이냥.',
    friendly: '줄무늬 세어봤냥? 나도 모르겠냥. 같이 세볼까냥?',
    butler:   '집사는 나의 정글이다냥. 여기가 제일 좋냥.',
  },
  'turkish-van': {
    first:    '물 좋아하는 고양이 봤냥? 나냥.',
    friendly: '욕조 같이 써도 돼냥? 수영 가르쳐줄게냥.',
    butler:   '집사 목욕할 때 옆에 있어줄게냥. 외롭지 말라냥.',
  },

  // ── Legendary ──
  ocicat: {
    first:    '야생 같냥? 사실 집에서 태어났다냥. 반전이냥.',
    friendly: '무늬 예쁘냥? 인정해냥. 봐도 돼냥.',
    butler:   '나 같은 거 두 번 못 만난다냥. 잘 모셔냥.',
  },
  singapura: {
    first:    '작다고 무시하지 마냥. 눈이 크면 세상이 크게 보인다냥.',
    friendly: '이 작은 몸에 사랑이 가득이다냥. 넘칠 것 같냥.',
    butler:   '세상에서 제일 작은 내가 집사한테 제일 큰 존재일 거다냥.',
  },
  sphynx: {
    first:    '털 없다고 이상하게 보지 마냥. 피부 완전 따뜻하다냥.',
    friendly: '만져봐냥. 복숭아 껍질 같냥? 인정하냥?',
    butler:   '나 안으면 핫팩이다냥. 겨울에 특히 인기 많냥.',
  },
  'selkirk-rex': {
    first:    '곱슬이라서 테디베어 같다냥. 안아볼래냥?',
    friendly: '성격 제일 좋은 고양이가 누군지 안냥? 나다냥.',
    butler:   '집사 스트레스 받을 때 나한테 와냥. 다 받아줄게냥.',
  },
  korat: {
    first:    '태국에서 온 행운의 고양이다냥. 근데 아무한테나 주진 않냥.',
    friendly: '...집사, 마음에 들었다냥. 행운 드릴게냥.',
    butler:   '한 사람한테만 충성한다냥. 집사가 그 사람이냥.',
  },
  birman: {
    first:    '내 발 봤냥? 흰 장갑이다옹. 성스럽다옹.',
    friendly: '절에서 왔다냥. 그래서 이렇게 점잖은 거다옹.',
    butler:   '집사를 만난 건 인연이다옹. 전생부터였을 거냥.',
  },
  pixiebob: {
    first:    '강아지 같다는 말 많이 들었다냥. 고양이 맞냥.',
    friendly: '산책 같이 갈 수 있냥. 가끔은 그러고 싶냥.',
    butler:   '나 진짜 강아지보다 낫냥? 집사도 알냥?',
  },
  tonkinese: {
    first:    '버미즈랑 샴이 합쳐지면 어떻게 되냥? 나다냥!',
    friendly: '이 집 사람 다 친구 됐냥. 집사는 베스트프렌드냥.',
    butler:   '내 인생 파티에 집사가 주인공이다냥. 항상이냥.',
  },
  nebelung: {
    first:    '...처음엔 좀 멀리 있을게냥. 천천히 알아가냥.',
    friendly: '...사실 집사 많이 좋아한다냥. 말하기 부끄러웠냥.',
    butler:   '이제 말할게냥. 집사가 내 전부다냥. 진심으로냥.',
  },
};

/**
 * 발견 횟수 기반으로 대사와 상황 라벨 반환
 * @param {string} catId
 * @param {number} discoveryCount - getCatCount() 반환값 (0~3)
 * @returns {{ situation: string, label: string, text: string } | null}
 */
export function getDialogue(catId, discoveryCount) {
  const d = CAT_DIALOGUES[catId];
  if (!d || discoveryCount === 0) return null;
  const situation = discoveryCount === 1 ? 'first' : discoveryCount === 2 ? 'friendly' : 'butler';
  const label = discoveryCount === 1 ? '첫만남' : discoveryCount === 2 ? '친해지기' : '집사되기';
  return { situation, label, text: d[situation] };
}
