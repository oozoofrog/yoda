# 사례 4 — `cond_fail true` 최적화의 패스 이동과 OSSA 불변식

> **단계**: Optimizer / SILCombine
> **난이도**: 중상
> **anchor PR**: [#88258](https://github.com/swiftlang/swift/pull/88258)
> **merged fix commit**: `cc3c7014620`
> **parent commit**: `a0ba1f70800f2c21e80c26d550b7d9380c9e00d9`
> **핵심 파일**: `SwiftCompilerSources/Sources/Optimizer/FunctionPasses/CondFailOptimization.swift`, `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyCondFail.swift`
> **핵심 테스트**: `test/SILOptimizer/simplify_cond_fail.sil`, `test/SILOptimizer/constant_propagation.sil`

---

## 이 사례를 왜 고른가

이 사례는 컴파일러 최적화 학습에서 아주 중요한 질문을 던집니다.

> “이 최적화는 맞는가?”가 아니라, “이 최적화를 **어디서** 해도 되는가?”

PR [#88258](https://github.com/swiftlang/swift/pull/88258)는 `cond_fail true` 뒤에 `unreachable`를 넣는 단순 최적화가
왜 SILCombine/InstructionSimplification 단계에서는 위험할 수 있고,
왜 별도 function pass로 옮겨야 하는지 설명합니다.

이건 단순 코드 이동이 아니라 **OSSA 불변식과 패스 책임 경계**를 배우는 사례입니다.

---

## 학습 목표

이 사례가 끝나면 아래를 설명할 수 있어야 합니다.

- 왜 어떤 최적화는 instruction simplification에 두면 안 되는가
- `unreachable` 삽입이 OSSA lifetime completion과 왜 연결되는가
- function pass와 simplification의 책임 차이를 어떻게 구분할 것인가
- verifier failure를 막기 위해 패스 구조를 바꾸는 판단이 왜 필요한가

### 함께 볼 카드

- [cards/01-optimizer-cond-fail-pass.md](cards/01-optimizer-cond-fail-pass.md)
- [cards/10-sil-memaccessutils-assert.md](cards/10-sil-memaccessutils-assert.md)

---

## 문제 맥락 (PR / issue)

PR 본문은 문제를 아주 명확하게 설명합니다.

- unconditional `cond_fail`는 사실상 항상 trap이므로
- 뒤 제어 흐름을 끊고 `unreachable`를 넣는 것이 자연스럽습니다.
- 하지만 이걸 instruction simplification에서 바로 해 버리면
  - dead code 제거 전후의 OSSA lifetime이 불완전해질 수 있고
  - 다른 simplification이나 verifier가 complete lifetime을 기대하는 경우 깨질 수 있습니다.

즉, 최적화 아이디어 자체는 맞지만 **실행 위치가 틀렸다**는 것이 핵심입니다.

### 이 PR에서 특히 배울 점

- 큰 버그가 아니라도 “패스 배치”가 잘못되면 correctness 문제가 생깁니다.
- PR 설명만 읽어도 설계 판단의 이유가 드러나는 좋은 사례입니다.
- 리뷰 코멘트는 많지 않지만, 본문 자체가 거의 mini design note 역할을 합니다.

---

## 사전 회상 질문

1. `cond_fail %true` 뒤에 `unreachable`를 넣는 최적화는 왜 직관적으로는 맞아 보일까요?
2. 그럼에도 불구하고 simplification 단계에서 하면 왜 위험할 수 있을까요?
3. “lifetime completion을 누가 책임지는가”라는 질문은 왜 패스 설계에서 중요할까요?

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/condfail-pass-parent

mkdir -p "$ROOT/worktrees"
git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" a0ba1f70800f2c21e80c26d550b7d9380c9e00d9
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

이 사례는 테스트 변화도 학습 포인트이므로, 먼저 merged commit의 테스트를 parent worktree에 복원합니다.

```bash
git show cc3c701462078ca24387a116743d633726a12d3d:test/SILOptimizer/simplify_cond_fail.sil \
  > test/SILOptimizer/simplify_cond_fail.sil

git show cc3c701462078ca24387a116743d633726a12d3d:test/SILOptimizer/constant_propagation.sil \
  > test/SILOptimizer/constant_propagation.sil
```

그 다음 실행합니다.

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cond_fail.sil
utils/run-test --build-dir $BUILD test/SILOptimizer/constant_propagation.sil
```

### 무엇을 관찰할까

- 단순히 FileCheck mismatch가 나는지보다
- “왜 parent 상태의 simplification이 새 기대와 충돌하는가”를 봅니다.
- 특히 `constant_propagation.sil` 쪽에서 verifier 친화적이지 않은 변화가 왜 문제인지 생각해 보세요.

---

## 2단계 — 기존 simplification 경로 읽기

먼저 parent 상태의 코드를 봅니다.

```bash
sed -n '1,220p' SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyCondFail.swift
```

여기서 질문은 하나입니다.

> 왜 이 코드가 “기능적으로는 맞아 보여도” 패스 위치상 위험할까요?

### self-explanation

- `value != 0`일 때 `unreachable`를 넣는 것은 왜 자연스러운가?
- 그런데 그 직후 block split만 하고 끝내면 무엇이 남을 수 있는가?
- `EndBorrowInst`, `DestroyValueInst`, `EndLifetimeInst` 같은 수명 종료 명령이 왜 여기서 중요할까요?

---

## 3단계 — 새 function pass의 형태를 역으로 복원

parent에는 새 파일이 없으므로 merged commit에서 구현을 읽습니다.

```bash
git show cc3c701462078ca24387a116743d633726a12d3d:SwiftCompilerSources/Sources/Optimizer/FunctionPasses/CondFailOptimization.swift | sed -n '1,220p'
```

관찰 포인트:

- `FunctionPass(name: "cond-fail-optimization")`
- 모든 instruction을 순회하며 `CondFailInst`를 찾음
- 최적화 후 `removeDeadBlocks`
- 필요 시 `breakInfiniteLoops`
- 필요 시 `completeLifetimes`

이 순서가 바로 이 사례의 핵심입니다.

---

## 4단계 — 패스 등록과 파이프라인 연결 보기

```bash
rg "cond-fail-optimization|CondFailOptimization|SimplifyCondFail" \
  SwiftCompilerSources include/swift lib/SILOptimizer
```

특히 아래를 봅니다.

- `SwiftCompilerSources/Sources/Optimizer/PassManager/PassRegistration.swift`
- `include/swift/SILOptimizer/PassManager/Passes.def`
- `lib/SILOptimizer/PassManager/PassPipeline.cpp`

### 배울 점

최적화의 “코드 본체”만 읽으면 절반만 이해한 것입니다.
실제로는
- 어느 이름으로 등록되고
- 어떤 파이프라인에 들어가며
- 이전 simplification 경로에서 무엇이 빠지는지
까지 함께 봐야 합니다.

---

## 5단계 — 핵심 설계 판단 정리

merged diff를 보기 전에 아래를 스스로 적어보세요.

- 왜 이 최적화는 simplification이 아니라 function pass여야 하는가?
- 최소한 어떤 후처리(dead block removal / lifetime completion)가 필요할까?
- `cond_fail true` 최적화와 failing cast constant folding은 왜 비슷한가?

이 질문에 답할 수 있으면, 이 사례의 절반은 이해한 것입니다.

---

## 6단계 — merged fix와 비교

```bash
git diff a0ba1f70800f2c21e80c26d550b7d9380c9e00d9..cc3c701462078ca24387a116743d633726a12d3d -- \
  SwiftCompilerSources/Sources/Optimizer/FunctionPasses/CondFailOptimization.swift \
  SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyCondFail.swift \
  SwiftCompilerSources/Sources/Optimizer/PassManager/PassRegistration.swift \
  include/swift/SILOptimizer/PassManager/Passes.def \
  lib/SILOptimizer/PassManager/PassPipeline.cpp \
  test/SILOptimizer/simplify_cond_fail.sil \
  test/SILOptimizer/constant_propagation.sil
```

비교 질문:

- 나는 “코드를 옮기는 것”과 “책임을 옮기는 것”의 차이를 봤는가?
- 나는 왜 `completeLifetimes`가 설계의 핵심인지 설명할 수 있는가?
- 나는 어떤 테스트가 이 패스 이동의 필요성을 가장 잘 드러낸다고 생각하는가?

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. 다른 simplification 하나를 골라 “이건 function pass로 옮겨야 할 가능성이 있는가?”를 적기
2. `PassRegistration.swift`를 읽고 Swift optimizer pass가 등록되는 공통 패턴 정리하기
3. `constant_propagation.sil`에서 왜 이 변화가 verifier 친화적인지 5줄로 요약하기

---

## 회고 질문

1. 이 사례를 통해 “최적화가 맞다”와 “최적화가 여기에 있어도 된다”가 다른 문제라는 점이 선명해졌나요?
2. 당신은 기능 코드보다 패스 등록/파이프라인 연결에서 더 많은 인사이트를 얻었나요?
3. 다음 최적화 PR를 읽을 때 가장 먼저 보고 싶은 것은 무엇인가요? 본문, 테스트, 파이프라인, verifier 중 하나를 골라보세요.

---

## 학습 설계 근거

- 이 사례는 correctness를 “출력값”이 아니라 “불변식 유지” 관점으로 보게 만듭니다.
- function pass와 simplification을 비교하게 해 worked example 이후 구조적 transfer를 유도합니다.
- merged test 복원 단계를 넣은 이유는 parent commit에서의 관찰과 final design을 연결하기 위해서입니다.
- 설계 질문을 먼저 쓰게 해 self-explanation과 metacognitive debugging을 강화합니다.
- 관련 근거는 [../00-curriculum-and-method.md](../00-curriculum-and-method.md)를 참고하세요.
