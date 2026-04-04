# 30일 Optimizer 트랙

> **대상**: SILOptimizer, Swift optimizer pass, correctness/perf trade-off를 집중적으로 배우고 싶은 학습자
> **목표**: 30일 동안 optimizer 사례와 코드를 따라가며 pass 구조, legality, verifier, 테스트 전략을 이해하는 수준 도달
> **전제**: [../01-build-environment-lab.md](../01-build-environment-lab.md), [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md), [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)

---

## 구성 원칙

- diagnostics보다 코드/불변식 읽기 비중이 큽니다.
- `-emit-sil -O`, `sil-print-*`, `run-test` 루프를 반복합니다.
- 성능보다 먼저 legality와 correctness를 봅니다.

---

## Week 1 — SIL 읽기와 optimizer 관찰

### Day 1
- 읽기: [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- 실행: `swiftc -emit-silgen`, `swiftc -emit-sil -O`
- 로그: Raw SIL과 Optimized SIL 차이 3개

### Day 2
- 읽기: [../case-studies/cards/01-optimizer-cond-fail-pass.md](../case-studies/cards/01-optimizer-cond-fail-pass.md)
- 실행: `test/SILOptimizer/simplify_cond_fail.sil`
- 로그: simplification vs function pass 차이

### Day 3
- 읽기: [../case-studies/cards/02-optimizer-enum-tag-comparison.md](../case-studies/cards/02-optimizer-enum-tag-comparison.md)
- 실행: `test/SILOptimizer/enum-comparison.swift`
- 로그: miscompile 위험의 징후

### Day 4
- 카드: [../case-studies/cards/09-optimizer-simplify-struct-extract-silcombine.md](../case-studies/cards/09-optimizer-simplify-struct-extract-silcombine.md)
- 로그: registration/wiring이 behavior를 바꾸는 방식

### Day 5
- 카드: [../case-studies/cards/10-sil-memaccessutils-assert.md](../case-studies/cards/10-sil-memaccessutils-assert.md)
- 로그: assert가 틀린 불변식의 신호라는 점

### Day 6
- 읽기: [../case-studies/04-optimizer-cond-fail-pass-architecture.md](../case-studies/04-optimizer-cond-fail-pass-architecture.md)
- 로그: why function pass?

### Day 7
- 복습: Week 1 로그 재정리

---

## Week 2 — correctness 중심 optimizer 사례

### Day 8
- 읽기: [../case-studies/05-optimizer-enum-tag-comparison-correctness.md](../case-studies/05-optimizer-enum-tag-comparison-correctness.md)
- 로그: optimizer legality 조건 정리

### Day 9
- `SimplifyApply.swift` 재읽기
- 로그: `hasKnownRawType`의 의미

### Day 10
- `test/SILOptimizer/simplify_apply.sil` 분석
- 로그: 패턴 테스트가 무엇을 고정하는가

### Day 11
- `test/SILOptimizer/constant_propagation.sil` 분석
- 로그: verifier 친화적 변화는 무엇인가

### Day 12
- `PassRegistration.swift`, `Passes.def` 읽기
- 로그: pass registration 공통 패턴

### Day 13
- `PassPipeline.cpp` 읽기
- 로그: pass ordering이 왜 중요한가

### Day 14
- 복습 및 요약 카드 작성

---

## Week 3 — open issue와 optimizer 사고 연결

### Day 15
- 워크북 재사용: [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)
- 대상: optimizer 관련 backlog 후보 1개 선택

### Day 16
- 카드: [../case-studies/cards/04-csoptimizer-operator-erasure-scoring.md](../case-studies/cards/04-csoptimizer-operator-erasure-scoring.md)
- 로그: scoring policy vs algorithm bug

### Day 17
- 카드: [../case-studies/cards/06-irgen-typed-throws-crash.md](../case-studies/cards/06-irgen-typed-throws-crash.md)
- 로그: cross-stage bug와 optimizer bug 차이

### Day 18
- SIL test 작성 패턴 정리
- 로그: CHECK-LABEL / CHECK-NOT / 실행 테스트 역할 구분

### Day 19
- `sil-print-before/after` 루프 실습
- 로그: pass 전후 차이 추적

### Day 20
- dead block removal / lifetime completion 정리
- 로그: OSSA 관련 핵심 메모

### Day 21
- 복습일

---

## Week 4 — optimizer 기여 준비

### Day 22
- 내가 가장 이해한 optimizer 사례 1개를 10줄로 다시 설명

### Day 23
- 테스트 먼저 읽고 구현을 추정하는 연습

### Day 24
- 구현 먼저 읽고 테스트를 추정하는 연습

### Day 25
- 법적 최적화 조건 checklist 작성

### Day 26
- verifier 관련 로그 정리

### Day 27
- pass registration checklist 작성

### Day 28
- 작은 optimizer open issue 또는 candidate commit 1개 분석

### Day 29
- 실제 도전 후보 1개 선택

### Day 30
- 회고: legality / registration / testing / verifier 중 가장 약한 축 정리
