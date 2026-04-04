# 30일 Diagnostics / Fix-It 트랙

> **대상**: Swift 컴파일러 diagnostics와 fix-it 개선을 실제 기여 수준까지 배우고 싶은 학습자
> **목표**: 30일 동안 레퍼런스, merged 사례, open issue를 함께 소비해 diagnostics/fix-it 문제를 직접 분석하고 시도할 수 있는 수준 도달
> **전제**: [../00-curriculum-and-method.md](../00-curriculum-and-method.md), [../01-build-environment-lab.md](../01-build-environment-lab.md)

---

## 사용 원칙

- 하루에 하나만 깊게 봅니다.
- 하루 학습 시간은 45~90분을 가정합니다.
- 매일 아래를 남깁니다.
  - 실행한 명령 1개 이상
  - 관찰 로그 3줄 이상
  - 다음 날 첫 질문 1개

---

## Week 1 — 환경과 관찰 루프 만들기

### Day 1 — 환경 루프 확보
- 읽기: [../01-build-environment-lab.md](../01-build-environment-lab.md)
- 실행: 첫 build / 첫 `run-test`
- 로그: `BUILD` 경로, 첫 성공 테스트

### Day 2 — AST/SIL/IR 관찰
- 읽기: [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- 실행: `-dump-ast`, `-emit-sil`, `-emit-ir`
- 로그: 단계별 출력 차이

### Day 3 — 진입점 지도
- 읽기: [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)
- 실행: 테스트 경로별 단계 추정 연습
- 로그: `test/Sema`, `test/Parse`, `test/SILOptimizer` 각각의 첫 진입 파일 후보

### Day 4 — 수정 워크플로우
- 읽기: [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)
- 실행: merged 사례를 읽기 전 체크리스트 작성
- 로그: “재현 → 수정 → 검증” 절차를 내 말로 요약

### Day 5 — merged 사례 입문 1
- 읽기: [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)
- 보조 카드: [../case-studies/cards/03-sema-anyappleos-diagnostic-group.md](../case-studies/cards/03-sema-anyappleos-diagnostic-group.md)
- 로그: source range bug를 어떻게 인식했는지

### Day 6 — merged 사례 입문 2
- 읽기: [../case-studies/02-sil-location-explicitness.md](../case-studies/02-sil-location-explicitness.md)
- 보조 카드: [../case-studies/cards/12-silgen-top-level-prettystacktrace.md](../case-studies/cards/12-silgen-top-level-prettystacktrace.md)
- 로그: explicit / implicit 구분이 왜 debug info 품질과 연결되는지

### Day 7 — 복습일
- 다시 보기: Day 1~6 로그
- 과제: 내가 diagnostics/fix-it 문제를 볼 때 먼저 확인할 파일 5개 목록 만들기

---

## Week 2 — diagnostics 패턴 익히기

### Day 8 — static member diagnostics
- 카드: [../good-first-issues/cards/01-static-member-instance-diagnostic.md](../good-first-issues/cards/01-static-member-instance-diagnostic.md)
- 워크북: [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)
- 로그: wording 개선형 문제의 특징

### Day 9 — `static nonmutating` 진단
- 카드: [../good-first-issues/cards/04-static-nonmutating-diagnostic.md](../good-first-issues/cards/04-static-nonmutating-diagnostic.md)
- 로그: modifier 조합을 진단하는 방식

### Day 10 — fix-it range 비교
- 카드: [../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md](../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md)
- full tutorial 복습: [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)
- 로그: range bug와 wording bug의 차이

### Day 11 — opaque type fix-it
- 카드: [../good-first-issues/cards/03-opaque-property-fixit.md](../good-first-issues/cards/03-opaque-property-fixit.md)
- 로그: `some` 관련 explicit annotation fix-it 설계

### Day 12 — `@dynamicMemberLookup` fix-it
- 카드: [../good-first-issues/cards/06-dynamicmemberlookup-fixits.md](../good-first-issues/cards/06-dynamicmemberlookup-fixits.md)
- 로그: attribute validation에서의 fix-it 설계 포인트

### Day 13 — memberwise init 공개성 진단
- 카드: [../good-first-issues/cards/05-memberwise-init-public-diagnostic.md](../good-first-issues/cards/05-memberwise-init-public-diagnostic.md)
- 로그: synthesized memberwise init와 conformance diagnostics 관계

### Day 14 — 복습일
- 과제: Day 8~13 중 가장 손대고 싶은 issue 2개를 고르고 이유 적기

---

## Week 3 — open issue 분석 실전

### Day 15 — 워크북 첫 적용
- 읽기: [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)
- 템플릿: [../open-issue-templates/analysis-template.md](../open-issue-templates/analysis-template.md)
- 대상 issue: `#48759`

### Day 16 — existential / optional spelling
- 카드: [../good-first-issues/cards/02-any-iuo-diagnostic.md](../good-first-issues/cards/02-any-iuo-diagnostic.md)
- 워크북 기록

### Day 17 — existential note design
- 카드: [../good-first-issues/cards/07-existential-self-note.md](../good-first-issues/cards/07-existential-self-note.md)
- 워크북 기록

### Day 18 — computed property 중복 진단
- 카드: [../good-first-issues/cards/09-computed-property-redundant-diagnostic.md](../good-first-issues/cards/09-computed-property-redundant-diagnostic.md)
- 워크북 기록

### Day 19 — computed property fix-it
- 카드: [../good-first-issues/cards/10-computed-property-type-fixit.md](../good-first-issues/cards/10-computed-property-type-fixit.md)
- 워크북 기록

### Day 20 — effect marker fix-its
- 카드: [../good-first-issues/cards/11-redundant-effect-fixits.md](../good-first-issues/cards/11-redundant-effect-fixits.md)
- 워크북 기록

### Day 21 — 복습일
- 과제: 5개의 open issue 중 하나를 골라 “내가 가장 먼저 열 파일”을 1개로 줄이기

---

## Week 4 — 실제 기여 전환 준비

### Day 22 — accepts invalid 사례 보기
- 카드: [../good-first-issues/cards/12-global-actor-inheritance-clause.md](../good-first-issues/cards/12-global-actor-inheritance-clause.md)
- 로그: diagnostics 개선과 invalid accept 금지의 차이

### Day 23 — closure capture semantics
- 카드: [../good-first-issues/cards/08-inout-capture-fixit.md](../good-first-issues/cards/08-inout-capture-fixit.md)
- 로그: fix-it 추가가 필요한 이유와 진입 파일 후보

### Day 24 — diagnostics 묶음 비교
- 비교:
  - [../good-first-issues/cards/09-computed-property-redundant-diagnostic.md](../good-first-issues/cards/09-computed-property-redundant-diagnostic.md)
  - [../good-first-issues/cards/10-computed-property-type-fixit.md](../good-first-issues/cards/10-computed-property-type-fixit.md)
- 로그: suppression과 fix-it insertion의 차이

### Day 25 — merged 사례와 open issue 교차
- 비교:
  - [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)
  - [../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md](../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md)
  - [../good-first-issues/cards/10-computed-property-type-fixit.md](../good-first-issues/cards/10-computed-property-type-fixit.md)
- 로그: “정답 있는 사례”와 “정답 없는 issue”의 접근 차이

### Day 26 — 실제 후보 1개 선정
- 대상: 지금까지 본 open issue 중 하나
- 산출물: issue analysis template 완성본 1개

### Day 27 — 재현 명령 정교화
- 산출물: 최소 재현 파일 + 실행 명령 + 예상 출력

### Day 28 — 첫 진입 파일 추정 검증
- `rg` / `swiftc` / `run-test`를 사용해 진입 파일 후보를 3개 → 1개로 줄임

### Day 29 — 수정 유형 예측 문서화
- 산출물: wording / note / fix-it / suppression / rule enforcement 중 무엇인지 확정

### Day 30 — 최종 회고
- 내가 가장 자신 있는 diagnostics 문제 유형 3개
- 아직 막막한 유형 2개
- 다음 30일에 이어갈 open issue 1개

---

## 완료 기준

30일이 끝났을 때 아래를 갖추면 성공입니다.

- build / test / debug 루프를 스스로 반복 가능
- merged 사례 2개 이상 깊게 이해
- open issue 분석 로그 5개 이상
- 실제로 도전해볼 open issue 1개 선정

---

## 다음 단계

이 코스가 끝나면 아래로 넘어가는 것이 자연스럽습니다.

- `good-first-issues/` 카드 더 확장
- 실제 open issue 브랜치 실습
- diagnostics 외의 optimizer/core 트랙으로 확장
