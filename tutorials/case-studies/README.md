# 사례 카탈로그

이 디렉토리는 Swift 컴파일러의 **실제 merged fix**를 바탕으로 학습하는 사례 저장소입니다.

핵심 원칙은 단순합니다.

- 사례는 가능한 한 많이 축적한다.
- 하지만 한 세션에서는 1개 사례만 다룬다.
- 사례는 가능하면 **issue / PR / review / final diff**까지 연결한다.
- 최종 diff는 정답지가 아니라 **마지막 비교 자료**로 사용한다.

---

## 사례 라이브러리 구조

- **full tutorial**: 대표 사례를 깊고 길게 따라가는 문서
- **case card**: 많은 사례를 빠르게 탐색하기 위한 짧은 카드
- **index.yaml**: 사람이 수작업으로 큐레이션하는 메타데이터 원본

즉, 저장소는 크게 유지하되 한 세션에 소비하는 양은 작게 유지합니다.

---

## 공개된 full tutorial

| 상태 | 사례 | 단계 | 난이도 | anchor |
| --- | --- | --- | --- | --- |
| 완료 | [01-sema-fixit-source-locs.md](01-sema-fixit-source-locs.md) | Sema / Diagnostics | 하 | PR [#88222](https://github.com/swiftlang/swift/pull/88222) |
| 완료 | [02-sil-location-explicitness.md](02-sil-location-explicitness.md) | SIL / DebugInfo | 중 | PR [#88166](https://github.com/swiftlang/swift/pull/88166) |
| 완료 | [03-irgen-fast-existential-casts.md](03-irgen-fast-existential-casts.md) | IRGen / Serialization | 중상 | PR [#88270](https://github.com/swiftlang/swift/pull/88270) 일부 |
| 신규 | [04-optimizer-cond-fail-pass-architecture.md](04-optimizer-cond-fail-pass-architecture.md) | Optimizer / SILCombine | 중상 | PR [#88258](https://github.com/swiftlang/swift/pull/88258) |
| 신규 | [05-optimizer-enum-tag-comparison-correctness.md](05-optimizer-enum-tag-comparison-correctness.md) | Optimizer / Correctness | 중상 | PR [#88052](https://github.com/swiftlang/swift/pull/88052) |

## 공개된 case card

| 카드 | 영역 | 난이도 | 출처 |
| --- | --- | --- | --- |
| [01-optimizer-cond-fail-pass.md](cards/01-optimizer-cond-fail-pass.md) | Optimizer | 중 | PR #88258 |
| [02-optimizer-enum-tag-comparison.md](cards/02-optimizer-enum-tag-comparison.md) | Optimizer | 중 | PR #88052 |
| [03-sema-anyappleos-diagnostic-group.md](cards/03-sema-anyappleos-diagnostic-group.md) | Sema | 하 | PR #87935 |
| [04-csoptimizer-operator-erasure-scoring.md](cards/04-csoptimizer-operator-erasure-scoring.md) | CSOptimizer | 중상 | PR #88188 |
| [05-concurrency-async-deinit-regression.md](cards/05-concurrency-async-deinit-regression.md) | Concurrency | 하 | PR #88231 |
| [06-irgen-typed-throws-crash.md](cards/06-irgen-typed-throws-crash.md) | IRGen | 중상 | PR #86387 |
| [07-sema-implicit-available-source-loc.md](cards/07-sema-implicit-available-source-loc.md) | Sema | 하 | PR #87843 |
| [08-sema-nonisolated-unsafe-fixit-range.md](cards/08-sema-nonisolated-unsafe-fixit-range.md) | Sema | 하 | PR #88086 |
| [09-optimizer-simplify-struct-extract-silcombine.md](cards/09-optimizer-simplify-struct-extract-silcombine.md) | Optimizer | 하 | commit |
| [10-sil-memaccessutils-assert.md](cards/10-sil-memaccessutils-assert.md) | SIL Utils | 하 | commit |
| [11-irgen-save-ir-options.md](cards/11-irgen-save-ir-options.md) | IRGen | 하 | commit |
| [12-silgen-top-level-prettystacktrace.md](cards/12-silgen-top-level-prettystacktrace.md) | SILGen | 하 | commit |

---

## 추천 소비 방식

### 입문자
- full tutorial 1개 + 관련 case card 1~2개 조합으로 봅니다.
- 예: `01-sema-fixit-source-locs`를 읽고 `03`, `08` 카드를 이어 봅니다.

### 중급
- 같은 단계의 case card 2~3개를 비교합니다.
- 예: Sema diagnostics 묶음, Optimizer correctness 묶음

### 고급
- 큰 PR 하나를 full tutorial + 관련 card 묶음으로 분해해서 봅니다.
- 예: PR #88270처럼 다중 커밋/다중 서브시스템 PR을 부분 사례로 재구성

---

## 사례 선정 기준

좋은 사례는 다음 특징을 가집니다.

1. parent commit에서 재현 가능
2. merged PR 또는 issue 맥락이 명확
3. 테스트가 작고 읽을 수 있음
4. 수정 포인트가 학습 가능한 크기
5. “왜 이렇게 고쳤는가”를 PR 본문이나 리뷰에서 복원 가능

---

## 다음 웨이브 후보

| 영역 | anchor | 학습 포인트 | 상태 |
| --- | --- | --- | --- |
| DebugInfo | [commit 5f5b9112621](https://github.com/swiftlang/swift/commit/5f5b9112621) | debug info salvage 비활성화와 회귀 분석 | candidate |
| Tests / infra | [PR #87911](https://github.com/swiftlang/swift/pull/87911) | `update-checkout` 기본 재시도 정책 개선 | candidate |
| C++ interop / tests | [PR #88211](https://github.com/swiftlang/swift/pull/88211) | Android에서 stdlib C++ interop test 비활성화 | candidate |

---

## 메타데이터와 템플릿

- 메타데이터 원본: [index.yaml](index.yaml)
- 새 사례 템플릿: [_case-template.md](_case-template.md)

반드시 포함해야 하는 요소:
- merged fix anchor
- parent commit
- 핵심 테스트
- 재현 명령
- 단계 분류 이유
- self-explanation 질문
- merged diff 비교 질문
