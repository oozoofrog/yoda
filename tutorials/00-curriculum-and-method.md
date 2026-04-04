# Swift 컴파일러 학습 커리큘럼과 방법론

> **대상**: Swift 사용 경험은 있지만 컴파일러 내부 학습은 체계적으로 해본 적이 없는 개발자
> **목표**: 환경 구성, 관찰, 디버깅, 단계별 수정, 사례 복원의 전 과정을 반복 가능한 학습 루프로 바꾸기
> **전제**: [tutorials/README.md](README.md)를 읽고 전체 구조를 파악한 상태

---

## 빠른 시작 (10분)

이 문서에서 먼저 해야 할 일은 “더 많이 읽는 것”이 아니라 “어떤 방식으로 배울지”를 정하는 것입니다.

1. 이번 주 학습 시간을 정합니다.  
   - 최소: 3회 × 60분
   - 권장: 4회 × 90분
2. 학습 로그 파일 하나를 만듭니다.  
   - 예: `notes/compiler-learning-log.md`
3. 아래 템플릿을 복사해 첫 세션 기록을 시작합니다.

```md
## Session 1
- 오늘의 목표:
- 시작 전 예측:
- 실행한 명령:
- 관찰한 사실:
- 틀린 가설:
- 새로 얻은 연결:
- 다음 세션 첫 질문:
```

---

## 왜 별도 튜토리얼이 필요한가

컴파일러 레퍼런스 문서는 보통 “정보 밀도”가 높고 “작업 순서”는 약합니다.  
하지만 실제 학습은 반대로 진행됩니다.

- 먼저 **작은 관찰 루프**를 만들고
- 그 다음 **단계 지도를 얻고**
- 마지막에 **실제 수정 사례**로 전이해야 합니다.

즉, 레퍼런스 문서는 “무엇이 있는가”를 알려주고, 튜토리얼 문서는 “어떻게 배울 것인가”를 알려줘야 합니다.

---

## 이 커리큘럼의 핵심 설계 원칙

### 1) Retrieval practice — 기억을 꺼내보며 배운다

학습 시작 전에 정답을 다시 읽기보다, 먼저 예측하고 회상하는 편이 장기 기억에 유리합니다.  
그래서 모든 튜토리얼은 사전 질문으로 시작합니다.

예:
- 이 테스트는 어느 단계에서 실패할까?
- 이 버그는 `lib/Sema/`일까 `lib/SILGen/`일까?
- 이 명령을 실행하면 AST/SIL/IR 중 무엇이 나올까?

### 2) Worked example + fading — 완성 예시에서 시작하고 점차 힌트를 줄인다

초반에는 완성된 예시를 먼저 보고, 이후에는 힌트를 줄이며 독립 실습으로 이동합니다.  
컴파일러처럼 인지 부하가 큰 시스템에서는 이 방식이 특히 중요합니다.

이 튜토리얼 세트의 흐름:
- 01/02/03: 완전한 안내가 많은 단계
- 04: 절차는 주되 세부 판단은 직접 하게 하는 단계
- case studies: 실제로 직접 찾고 고치는 단계

### 3) Self-explanation — “왜 이 파일인가?”를 말로 설명한다

단순히 명령을 따라 치는 것만으로는 지식이 연결되지 않습니다.  
각 실습에서 반드시 아래 질문에 답하도록 구성합니다.

- 왜 이 테스트가 이 단계를 가리키는가?
- 왜 이 함수가 첫 진입점이라고 판단했는가?
- 왜 이 수정이 최소 수정이라고 생각하는가?

### 4) Spacing + interleaving — 하루 몰아서 하지 말고 섞어서 반복한다

컴파일러 학습은 한 세션에 오래 몰아치는 것보다, 짧게 반복하고 다른 종류의 작업을 섞는 편이 좋습니다.

권장 리듬:
- Day 1: 환경 + 빌드
- Day 2: AST/SIL/IR 관찰
- Day 3: 단계별 진입점 분류
- Day 4: 수정 워크플로우
- Day 5: 사례 1
- Day 7: 사례 2
- Day 10: 사례 3
- Day 14: 회고와 재복습

### 5) Cognitive apprenticeship — 전문가의 사고 흔적을 따라간다

튜토리얼은 “정답만 제시”하지 않고, 아래 순서로 설계합니다.

1. **모델링**: 먼저 완성된 예를 보여줌
2. **코칭**: 어떤 신호를 봐야 하는지 알려줌
3. **스캐폴딩**: 힌트와 체크포인트 제공
4. **페이딩**: 점점 힌트를 제거

### 6) Metacognitive debugging — 가설을 쓰고 틀린 이유까지 기록한다

컴파일러 디버깅은 “명령 많이 아는 것”보다 “가설-관찰-수정” 루프를 관리하는 능력에 더 크게 좌우됩니다.

학습 로그에는 최소한 아래가 있어야 합니다.

- 현재 가설
- 그 가설을 검증할 명령
- 예상 결과
- 실제 결과
- 왜 가설이 틀렸는지

---

## 추천 학습 일정

## 1주 입문 루프

### Session 1 — 환경 확보
- [01-build-environment-lab.md](01-build-environment-lab.md)
- 산출물: `BUILD` 변수, 첫 `run-test` 성공

### Session 2 — 관찰 도구 익히기
- [02-debugging-environment-lab.md](02-debugging-environment-lab.md)
- 산출물: AST/SIL/IR/LLDB 관찰 기록

### Session 3 — 단계 지도 그리기
- [03-pipeline-entrypoints-and-knowledge-map.md](03-pipeline-entrypoints-and-knowledge-map.md)
- 산출물: “이 테스트는 어느 단계인가?” 분류표

### Session 4 — 공통 수정 절차 익히기
- [04-stage-modification-workflow.md](04-stage-modification-workflow.md)
- 산출물: 수정 전 체크리스트

### Session 5~7 — 사례 3개
- [01-sema-fixit-source-locs.md](case-studies/01-sema-fixit-source-locs.md)
- [02-sil-location-explicitness.md](case-studies/02-sil-location-explicitness.md)
- [03-irgen-fast-existential-casts.md](case-studies/03-irgen-fast-existential-casts.md)

---

## 세션 운영 템플릿

### 60~90분 세션 기준

1. **사전 회상 5분**
   - 오늘 수정할 버그는 어느 단계인가?
   - 첫 번째로 열 파일은 어디일까?

2. **worked example 10~20분**
   - 문서에 나온 예시를 먼저 그대로 따라간다.

3. **guided practice 20~30분**
   - 같은 절차를 유사 문제에 적용한다.

4. **independent transfer 20~30분**
   - 힌트를 줄이고 스스로 단계/명령/파일을 선택한다.

5. **reflection 10분**
   - 무엇을 틀렸는지, 다음 번에는 무엇을 먼저 볼지 기록한다.

---

## 산출물 중심으로 학습하라

이 튜토리얼은 “읽었다”보다 “무엇을 남겼는가”를 더 중요하게 봅니다.

세션마다 최소 1개 이상 남겨야 하는 산출물:
- 실패 재현 명령
- 관찰 로그
- 단계 분류 메모
- 가설/반증 기록
- 수정 체크리스트
- 최종 회고

---

## 이 커리큘럼을 따라가며 피해야 할 함정

### 1. 문서만 오래 읽기
컴파일러 학습은 읽기만 해서는 전이가 잘 일어나지 않습니다.  
반드시 “명령 → 결과 → 해석”이 붙어야 합니다.

### 2. 테스트 전체를 너무 일찍 돌리기
처음에는 항상 **가장 좁은 재현**부터 시작해야 합니다.

### 3. 증상과 단계를 혼동하기
에러 메시지가 Sema에서 보인다고 해서 원인이 꼭 Sema는 아닙니다.  
반대로 IR 출력이 이상해 보여도 SIL 단계가 원인일 수 있습니다.

### 4. 정답 diff를 너무 빨리 보기
사례 문서는 merged diff 비교를 마지막 단계에 둡니다.  
먼저 스스로 진입점과 수정 포인트를 찾아보세요.

---

## 학습 설계 근거

이 튜토리얼 세트는 Swift 컴파일러 전용 학습 연구가 충분하지 않다는 점을 전제로,  
일반 학습과학 + 컴퓨팅 교육 연구를 컴파일러 학습에 맞게 변형해 사용합니다.

- **효과적인 학습 기법 종합 리뷰**: Dunlosky et al., *Improving Students’ Learning With Effective Learning Techniques*  
  https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html/comment-page-1
- **retrieval practice / test-enhanced learning**: Roediger & Karpicke, 2006  
  https://journals.sagepub.com/doi/pdf/10.1111/j.1467-9280.2006.01693.x
- **spacing 효과**: Cepeda et al., 2006  
  https://pubmed.ncbi.nlm.nih.gov/16719566/
- **worked example / expertise reversal**: Kalyuga, 2007  
  https://link.springer.com/article/10.1007/s10648-007-9054-3
- **self-explanation 원리**: Wylie & Chi  
  https://csi.asu.edu/wp-content/uploads/2018/01/Wylie_Chi_SelfExplanation.pdf
- **프로그래밍 교육에서의 메타인지**: ICER 2024  
  https://eecs.northwestern.edu/~hq/papers/mab_icer2024.pdf
- **디버깅 교육 개입의 효과**: Sun et al.  
  https://journals.sagepub.com/doi/full/10.1177/07356331241227793

이 문서 이후의 모든 튜토리얼은 위 원칙을 작게 쪼개 적용합니다.
