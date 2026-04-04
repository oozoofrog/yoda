# Wave 1 사례 확장 원자료 정리

> **목적**: full tutorial / case card로 확장하기 전에, PR/issue 본문·핵심 파일·테스트·학습 포인트를 한 곳에 모아둔 원자료
> **대상 범위**: 첫 웨이브에서 우선 채택한 5개 PR 기반 사례
> **사용처**: `case-studies/` 튜토리얼 작성, `cards/` 카드 작성, `index.yaml` 메타데이터 검증

---

## 1. PR #88258 — `cond_fail true` 최적화의 패스 이동

- PR: https://github.com/swiftlang/swift/pull/88258
- fix commit: `cc3c701462078ca24387a116743d633726a12d3d`
- parent commit: `a0ba1f70800f2c21e80c26d550b7d9380c9e00d9`
- 핵심 파일
  - `SwiftCompilerSources/Sources/Optimizer/FunctionPasses/CondFailOptimization.swift`
  - `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyCondFail.swift`
  - `SwiftCompilerSources/Sources/Optimizer/PassManager/PassRegistration.swift`
  - `include/swift/SILOptimizer/PassManager/Passes.def`
  - `lib/SILOptimizer/PassManager/PassPipeline.cpp`
- 핵심 테스트
  - `test/SILOptimizer/simplify_cond_fail.sil`
  - `test/SILOptimizer/constant_propagation.sil`
- PR 본문 핵심
  - unconditional `cond_fail` 뒤에 `unreachable`를 넣는 최적화는 직관적으로 맞다.
  - 하지만 instruction simplification 단계에서는 OSSA lifetime이 incomplete 상태로 남을 수 있다.
  - 따라서 별도 function pass로 옮기고 dead block 제거 + lifetime completion을 함께 해야 한다.
- 학습 포인트
  - simplification vs function pass
  - optimizer correctness는 알고리즘 자체보다 패스 책임 배치의 문제일 수 있다.
  - verifier failure가 패스 구조를 바꾸게 만드는 전형적 사례
- 현재 반영 문서
  - full tutorial: `04-optimizer-cond-fail-pass-architecture.md`
  - case card: `cards/01-optimizer-cond-fail-pass.md`

---

## 2. PR #88052 — enum tag comparison 최적화의 miscompile 수정

- PR: https://github.com/swiftlang/swift/pull/88052
- issue: https://github.com/swiftlang/swift/issues/87906
- fix commit: `bd1af9283f6af5219fdba64b1f4f89c28873eaa4`
- parent commit: `594c32a89d9545b2a7eefc6748305f16c2fbfc85`
- 핵심 파일
  - `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift`
- 핵심 테스트
  - `test/SILOptimizer/enum-comparison.swift`
  - `test/SILOptimizer/simplify_apply.sil`
- PR 본문 핵심
  - RawRepresentable enum 비교를 enum tag compare로 바꾸는 최적화는 매우 효율적이다.
  - 하지만 custom raw type은 비교 semantics를 자유롭게 구현할 수 있다.
  - side effect가 있는 비교나 “다른 case인데 true가 되는” 비교를 optimizer가 무시하면 miscompile이 된다.
  - 그래서 known stdlib raw value types로 범위를 제한한다.
- 리뷰에서 배울 점
  - `String`의 비교 semantics도 완전히 단순화 가능한가라는 질문이 나옴
  - 작성자는 이론적 완전성을 추구하기보다 안전한 경계로 축소하는 쪽을 택함
- 학습 포인트
  - optimization legality
  - miscompile은 crash보다 더 위험한 failure mode
  - 실행 테스트와 SIL 패턴 테스트의 역할 차이
- 현재 반영 문서
  - full tutorial: `05-optimizer-enum-tag-comparison-correctness.md`
  - case card: `cards/02-optimizer-enum-tag-comparison.md`

---

## 3. PR #87935 — `UseAnyAppleOSAvailability` 진단 그룹 도입

- PR: https://github.com/swiftlang/swift/pull/87935
- fix commit(핵심): `1f26971a88180fccb7149c86a08bb87f8e975a11`
- parent commit: `ce2de43ecbb5c9d51e92a2441a65ecc8366c64f7`
- 핵심 파일
  - `include/swift/AST/DiagnosticGroups.def`
  - `include/swift/AST/DiagnosticsSema.def`
  - `lib/Sema/TypeCheckAttr.cpp`
  - `test/Availability/availability_suggest_any_apple_os.swift`
- PR 본문 핵심
  - `anyAppleOS`로 대체 가능한 availability annotation을 진단한다.
  - 다만 이 진단은 상시 경고가 아니라 opt-in diagnostic group으로 제공한다.
- 학습 포인트
  - 진단의 존재와 기본 활성화는 다른 정책 문제다.
  - diagnostic group 도입은 기능 추가보다 migration 정책 설계에 가깝다.
  - availability 관련 사례를 연속 학습할 때 anchor로 좋다.
- 현재 반영 문서
  - case card: `cards/03-sema-anyappleos-diagnostic-group.md`
  - 관련 deep/full tutorial 연결: `01-sema-fixit-source-locs.md`

---

## 4. PR #88188 — operator overload scoring에서 erasure lower 처리

- PR: https://github.com/swiftlang/swift/pull/88188
- issue: https://github.com/swiftlang/swift/issues/88193
- fix commit: `1280a27d70da4e875be13b34ad77f71758839f62`
- parent commit: `aa649de3ca776247b23a9b70c38e85a77a6addf0`
- 핵심 파일
  - `lib/Sema/CSOptimizer.cpp`
- 핵심 테스트
  - `test/Constraints/operator_generics_vs_erasure.swift`
- PR 본문 핵심
  - pre-6.3 operator overload selection behavior를 복원한다.
  - generic requirement 충족과 optional injection, erasure lower가 얽힌 경우 concrete overload를 더 선호하도록 scoring을 조정한다.
- 학습 포인트
  - type checker heuristic / scoring policy
  - algorithmic bug가 아니라 ranking policy 조정의 사례
  - 테스트를 읽고 expected winner를 추론하는 훈련에 좋다
- 현재 반영 문서
  - case card: `cards/04-csoptimizer-operator-erasure-scoring.md`

---

## 5. PR #86387 — typed throws 관련 IRGen crash 수정

- PR: https://github.com/swiftlang/swift/pull/86387
- issue: https://github.com/swiftlang/swift/issues/86347
- fix commit: `d09c773536ac90695f00f07f7eeb1e56824d4c82`
- parent commit: `e6911d7711f68face792b39897be2990e1f56789`
- 핵심 파일
  - `lib/IRGen/GenCall.cpp`
  - `lib/IRGen/IRGenSIL.cpp`
  - 그 외 `GenDistributed.cpp`, `GenObjC.cpp`, `GenThunk.cpp` 등
- 핵심 테스트
  - `test/IRGen/typed_throws_generic.swift`
  - `test/SILGen/typed_throws_generic.swift`
- PR 본문 핵심
  - issue #86347의 typed throws crash를 고친다.
  - 수정 파일 목록을 보면 call emission과 IRGen 경계가 넓게 퍼져 있다.
- 학습 포인트
  - feature-level bug는 여러 helper 파일을 동시에 건드릴 수 있다.
  - IRGen crash라도 SILGen 테스트를 같이 보는 이유를 배울 수 있다.
  - “짧은 PR 설명 + 넓은 수정 면” 사례로서 분석 훈련 가치가 높다.
- 현재 반영 문서
  - case card: `cards/06-irgen-typed-throws-crash.md`

---

## 정리 메모

이 5개는 첫 웨이브의 원자료 기준점 역할을 합니다.

- Optimizer correctness: `#88258`, `#88052`
- Sema/diagnostics policy: `#87935`, `#88188`
- IRGen crash 분석: `#86387`

즉, “작은 fix-it”, “패스 구조”, “miscompile”, “scoring heuristic”, “IRGen crash”라는 서로 다른 학습 축을 커버합니다.
