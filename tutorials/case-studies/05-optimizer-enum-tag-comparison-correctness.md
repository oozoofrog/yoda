# 사례 5 — enum tag comparison 최적화와 miscompile 방지

> **단계**: Optimizer / Correctness
> **난이도**: 중상
> **anchor PR**: [#88052](https://github.com/swiftlang/swift/pull/88052)
> **연결 이슈**: https://github.com/swiftlang/swift/issues/87906
> **merged fix commit**: `bd1af9283f6`
> **parent commit**: `594c32a89d9545b2a7eefc6748305f16c2fbfc85`
> **핵심 파일**: `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift`
> **핵심 테스트**: `test/SILOptimizer/enum-comparison.swift`, `test/SILOptimizer/simplify_apply.sil`

---

## 이 사례를 왜 고른가

이 사례는 optimizer 학습에서 매우 중요합니다.

- 성능 최적화가 **조용한 miscompile**로 변질될 수 있고
- 그 경계는 생각보다 미묘하며
- 리뷰 논의가 바로 “합법성 범위”를 정의하는 재료가 됩니다.

즉, 이 사례는 단순한 bug fix가 아니라

> “이 최적화는 언제 **법적으로 허용**되는가?”

를 배우는 사례입니다.

---

## 학습 목표

이 사례가 끝나면 아래를 설명할 수 있어야 합니다.

- 왜 RawRepresentable 비교를 enum tag 비교로 바꾸는 최적화가 위험할 수 있는가
- 왜 custom raw type은 stdlib raw type과 같은 신뢰 수준으로 다루면 안 되는가
- miscompile 사례에서 테스트를 어떻게 설계해야 하는가
- 리뷰 논의가 optimization legality를 어떻게 더 정밀하게 만든는가

### 함께 볼 카드

- [cards/02-optimizer-enum-tag-comparison.md](cards/02-optimizer-enum-tag-comparison.md)
- [cards/04-csoptimizer-operator-erasure-scoring.md](cards/04-csoptimizer-operator-erasure-scoring.md)

---

## 문제 맥락 (PR / issue)

PR [#88052](https://github.com/swiftlang/swift/pull/88052)는 issue [#87906](https://github.com/swiftlang/swift/issues/87906)을 고칩니다.

원래 최적화는 다음 아이디어를 사용했습니다.

- `RawRepresentable` enum 비교는 비효율적일 수 있다.
- 그렇다면 raw value 비교 대신 enum tag 비교로 낮추면 훨씬 싸다.

문제는 여기서 끝나지 않습니다.

- custom raw type은 비교 semantics를 자유롭게 구현할 수 있고
- 서로 다른 case를 비교해도 `true`가 나오도록 만들 수 있으며
- side effect가 있는 비교도 이론상 가능하므로
- optimizer가 함부로 tag compare로 치환하면 **원래 프로그램 의미를 깨뜨릴 수 있습니다.**

### 리뷰에서 드러난 핵심 판단

이 PR는 리뷰 논의가 특히 중요합니다.

- `String`도 엄밀히는 비교 semantics가 미래 규칙(예: Unicode normalization)과 얽힐 수 있다는 지적이 나왔습니다.
- 이에 대해 작성자는 **지금 최적화를 허용할 수 있는 범위를 더 보수적으로 좁히는 것**을 택했습니다.
- 최종 결정은 “known stdlib raw value types만 허용”입니다.

즉, 이 사례는 “완벽한 이론적 정당화”보다 **현실적인 안전 경계 설정**이 중요하다는 점을 보여줍니다.

---

## 사전 회상 질문

1. optimizer가 원래 코드보다 더 적은 연산으로 바꾸는 것은 언제 합법적일까요?
2. `RawRepresentable`의 비교 semantics를 compiler가 어디까지 가정해도 될까요?
3. miscompile bug는 crash bug와 다르게 왜 더 위험할까요?

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/enum-tag-compare-parent

mkdir -p "$ROOT/worktrees"
git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" 594c32a89d9545b2a7eefc6748305f16c2fbfc85
cd "$CASE_ROOT"

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
```

---

## 1단계 — merged 테스트를 parent에 복원

이 사례는 새 테스트가 핵심이므로, merged commit의 테스트를 먼저 복원합니다.

```bash
git show bd1af9283f6af5219fdba64b1f4f89c28873eaa4:test/SILOptimizer/enum-comparison.swift \
  > test/SILOptimizer/enum-comparison.swift

git show bd1af9283f6af5219fdba64b1f4f89c28873eaa4:test/SILOptimizer/simplify_apply.sil \
  > test/SILOptimizer/simplify_apply.sil
```

그 다음 실행합니다.

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/enum-comparison.swift
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_apply.sil
```

### 무엇을 관찰할까

- 새 `NonUnqiueRawValue` / `NU` 테스트가 왜 필요한지
- 기존 최적화가 custom raw type에도 적용되면 왜 문제가 되는지
- 실행 테스트와 SIL 패턴 테스트가 각각 무엇을 보호하는지

---

## 2단계 — 구현으로 역추적

먼저 구현 함수 하나만 봅니다.

```bash
rg "tryOptimizeEnumComparison" SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift
sed -n '110,210p' SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift
```

parent 상태에서는 `enumDecl.hasRawType` 수준의 체크만 있었다가,
merged fix에서는 더 보수적인 `hasKnownRawType(context)`로 바뀝니다.

### self-explanation

- 왜 `hasRawType`만으로는 insufficient할까요?
- custom raw type이 `Equatable`을 구현한다는 사실만으로는 왜 optimizer가 안전을 보장할 수 없을까요?
- 이 경우는 “타입 시스템이 허용하는 것”과 “optimizer가 믿어도 되는 것”이 왜 다를까요?

---

## 3단계 — 테스트가 설계를 어떻게 고정하는지 보기

먼저 실행 테스트를 읽습니다.

```bash
sed -n '1,220p' test/SILOptimizer/enum-comparison.swift
```

그 다음 SIL 패턴 테스트를 읽습니다.

```bash
sed -n '200,300p' test/SILOptimizer/simplify_apply.sil
```

### 두 테스트의 역할 차이

- `enum-comparison.swift`:
  - 실제 결과가 잘못되면 잡아줍니다.
  - miscompile을 사용자 관점에서 보호합니다.
- `simplify_apply.sil`:
  - optimizer가 여전히 허용된 경우엔 치환을 하고, 금지된 경우엔 치환하지 않는다는 패턴을 고정합니다.
  - 최적화 legality를 구현자 관점에서 보호합니다.

---

## 4단계 — 리뷰 논의를 설계 관점에서 읽기

이 사례는 PR 리뷰를 같이 보는 가치가 큽니다.

핵심 논점은 다음과 같이 요약할 수 있습니다.

1. `String`도 완전히 안전하다고 단정할 수 있나?
2. custom raw type 비교가 side effect를 가지면 optimizer는 어디까지 없애도 되나?
3. 결국 compiler가 “알고 있는 타입”만 허용하는 것이 최선인가?

학습 포인트:

- optimizer는 이론적으로 가능한 모든 경우를 완벽히 모델링하기 어렵습니다.
- 그래서 **compiler가 semantics를 알고 있는 타입 집합**으로 최적화를 제한하는 설계가 자주 등장합니다.

---

## 5단계 — merged fix와 비교

```bash
git diff 594c32a89d9545b2a7eefc6748305f16c2fbfc85..bd1af9283f6af5219fdba64b1f4f89c28873eaa4 -- \
  SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift \
  test/SILOptimizer/enum-comparison.swift \
  test/SILOptimizer/simplify_apply.sil
```

비교 질문:

- 나는 왜 `hasKnownRawType` 같은 제한이 필요하다고 생각했는가?
- 나는 miscompile을 “성능 회귀”보다 더 심각한 failure mode로 보고 있었는가?
- 리뷰에서 나온 `String` 논점은 최종 패치에 어떻게 반영되었는가?

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. `SimplifyApply.swift`의 다른 peephole 최적화 하나를 골라 legality 조건을 정리하기
2. “compiler가 semantics를 안다”는 말이 실제로는 어떤 declaration/stdlib 정보에 기대는지 적기
3. 실행 테스트와 SIL 패턴 테스트 중 어느 쪽이 더 중요한지, 그리고 왜 둘 다 필요한지 8줄로 정리하기

---

## 회고 질문

1. 나는 이 사례를 통해 “최적화가 빨라진다”보다 “최적화가 합법적이다”를 더 먼저 보게 되었나요?
2. 리뷰 논의가 구현 diff보다 더 큰 학습 가치를 준 순간이 있었나요?
3. 다음 miscompile 사례를 보면 어떤 테스트를 먼저 만들고 싶나요?

---

## 학습 설계 근거

- 이 사례는 review discussion을 학습 자료의 일부로 사용해 설계 판단의 맥락을 노출합니다.
- custom raw type이라는 반례를 먼저 보게 해 contrastive learning과 self-explanation을 강화합니다.
- 실행 테스트와 SIL 패턴 테스트를 함께 읽게 해 “다층 검증” 습관을 만들게 합니다.
- issue → PR → diff → test 순서로 읽게 해 실제 컴파일러 수정의 의사결정 흐름을 복원하게 합니다.
- 관련 근거는 [../00-curriculum-and-method.md](../00-curriculum-and-method.md)를 참고하세요.
