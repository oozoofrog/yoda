# 30일 Compiler Core 트랙

> **대상**: Parse / Sema / SILGen / IRGen 중심의 핵심 파이프라인을 폭넓게 이해하고 싶은 학습자
> **목표**: 30일 동안 컴파일러 단계별 진입점, 대표 버그 유형, 진단/IR/debug 경계를 체계적으로 익히는 수준 도달
> **전제**: [../01-build-environment-lab.md](../01-build-environment-lab.md), [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)

---

## 구성 원칙

- 단계별로 한 주제씩 분리해서 배웁니다.
- 하루에 한 단계 또는 한 사례만 깊게 봅니다.
- “어느 단계 문제인가?”를 먼저 분류하는 습관을 중심에 둡니다.

---

## Week 1 — 파이프라인 지도 만들기

### Day 1
- 읽기: [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)
- 로그: 단계별 첫 디렉토리 6개 정리

### Day 2
- AST dump 관찰
- 로그: AST에서 읽히는 정보 3개

### Day 3
- SILGen vs SIL -O 비교
- 로그: 최적화 전후 차이

### Day 4
- IRGen 관찰
- 로그: IR에서 보이는 low-level 신호 3개

### Day 5
- Demangling 빠른 시작 복습
- 로그: 심볼 → 선언 대응 3개

### Day 6
- `test/` 경로로 단계 추정 연습
- 로그: 5개 테스트를 단계 분류

### Day 7
- 복습일

---

## Week 2 — Sema / diagnostics 중심

### Day 8
- [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)

### Day 9
- [../good-first-issues/cards/01-static-member-instance-diagnostic.md](../good-first-issues/cards/01-static-member-instance-diagnostic.md)

### Day 10
- [../good-first-issues/cards/04-static-nonmutating-diagnostic.md](../good-first-issues/cards/04-static-nonmutating-diagnostic.md)

### Day 11
- [../good-first-issues/cards/03-opaque-property-fixit.md](../good-first-issues/cards/03-opaque-property-fixit.md)

### Day 12
- [../good-first-issues/cards/05-memberwise-init-public-diagnostic.md](../good-first-issues/cards/05-memberwise-init-public-diagnostic.md)

### Day 13
- [../good-first-issues/cards/06-dynamicmemberlookup-fixits.md](../good-first-issues/cards/06-dynamicmemberlookup-fixits.md)

### Day 14
- 복습 및 Sema 관련 첫 진입 파일 목록 만들기

---

## Week 3 — SILGen / DebugInfo / IRGen 경계

### Day 15
- [../case-studies/02-sil-location-explicitness.md](../case-studies/02-sil-location-explicitness.md)

### Day 16
- [../case-studies/cards/12-silgen-top-level-prettystacktrace.md](../case-studies/cards/12-silgen-top-level-prettystacktrace.md)

### Day 17
- [../case-studies/cards/06-irgen-typed-throws-crash.md](../case-studies/cards/06-irgen-typed-throws-crash.md)

### Day 18
- [../case-studies/03-irgen-fast-existential-casts.md](../case-studies/03-irgen-fast-existential-casts.md)

### Day 19
- `swiftc -emit-ir`와 관련 테스트 비교

### Day 20
- `swift-demangle`와 SIL/IR 예시 교차 보기

### Day 21
- 복습일

---

## Week 4 — open issue와 기여 전환

### Day 22
- [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md) 복습

### Day 23
- [../good-first-issues/cards/07-existential-self-note.md](../good-first-issues/cards/07-existential-self-note.md)

### Day 24
- [../good-first-issues/cards/08-inout-capture-fixit.md](../good-first-issues/cards/08-inout-capture-fixit.md)

### Day 25
- [../good-first-issues/cards/12-global-actor-inheritance-clause.md](../good-first-issues/cards/12-global-actor-inheritance-clause.md)

### Day 26
- 내가 가장 이해한 단계 하나를 선택

### Day 27
- 그 단계의 open issue 하나를 워크북으로 분석

### Day 28
- 첫 진입 파일 후보 1개로 줄이기

### Day 29
- 실제 테스트 후보 1개 정하기

### Day 30
- 회고: Parse / Sema / SILGen / IRGen 중 가장 강한 단계와 가장 약한 단계 정리
