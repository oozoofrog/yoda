# 사례 2 — SILLocation explicitness와 DebugInfo 회귀 테스트

> **단계**: SIL / DebugInfo 경계
> **난이도**: 중간
> **anchor PR**: [#88166](https://github.com/swiftlang/swift/pull/88166)
> **merged fix commit**: `ed743259c5c`
> **parent commit**: `cdd4049fb644a9505e1731843382dfc9d077e119`
> **핵심 파일**: `lib/SIL/IR/SILLocation.cpp`
> **핵심 테스트**: `test/DebugInfo/if-bool-var.swift` (merged fix에서 새로 추가됨)

---

## 이 사례의 교육적 포인트

이 사례는 첫 사례보다 한 단계 어렵습니다.

- 증상이 warning 텍스트가 아니라 **debug metadata의 line/column**입니다.
- parent commit에는 회귀 테스트가 아직 없습니다.
- 즉, 먼저 **회귀 테스트를 복원**하고, 그 다음 구현을 고쳐야 합니다.

이 패턴은 실제 컴파일러 개발에서 매우 흔합니다.

---

## 학습 목표

- 새 regression test를 merged commit에서 복원하는 법 익히기
- `SILLocation`의 explicit/implicit 전파가 debug info에 왜 중요한지 이해하기
- “겉으로는 SILLocation 변경이지만 실제 관찰은 IR debug metadata에서 한다”는 경계 사례 감각 익히기

### 함께 볼 카드

- [07-sema-implicit-available-source-loc.md](cards/07-sema-implicit-available-source-loc.md)
- [12-silgen-top-level-prettystacktrace.md](cards/12-silgen-top-level-prettystacktrace.md)

---

## 문제 맥락 (PR / issue)

PR [#88166](https://github.com/swiftlang/swift/pull/88166)는 아래와 같은 코드를 디버깅할 때
LLDB가 `if mutable` 조건 줄을 건너뛰는 문제를 설명합니다.

```swift
func hello(param: Bool) {
    var mutable = param
    if mutable {
        print("true")
    }
}
```

PR 설명과 작성자의 코멘트에서 중요한 포인트는 다음입니다.

- AST에서 `if mutable` 조건은 `load_expr implicit`로 감싸져 있습니다.
- 이 암시적 변환 때문에 `cond_br`의 `SILLocation`도 implicit로 분류될 수 있습니다.
- 하지만 사용자 관점에서는 실제 멈춰야 하는 위치가 분명히 explicit 코드 줄입니다.

### 이 PR에서 특히 배울 점

- debug info 문제는 출력이 IR/LLDB에서 보이더라도, 원인은 AST→SIL location 전파에 있을 수 있습니다.
- PR 코멘트가 AST 모양과 SIL 결과를 같이 보여주기 때문에, “경계 단계 문제를 어떻게 설명하는가”를 배우기 좋습니다.

---

## 사전 회상 질문

1. AST의 explicit/implicit 정보는 왜 debug info 품질에 영향을 줄까요?
2. parent commit에 테스트가 없을 때는 학습을 어떻게 시작해야 할까요?
3. `test/DebugInfo`는 왜 Sema보다 관찰 비용이 더 높을까요?

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/sillocation-parent

mkdir -p "$ROOT/worktrees"
git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" cdd4049fb644a9505e1731843382dfc9d077e119
cd "$CASE_ROOT"

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
```

---

## 1단계 — regression test 복원

parent commit에는 테스트가 없으므로 merged commit에서 테스트를 가져옵니다.

```bash
git show ed743259c5c:test/DebugInfo/if-bool-var.swift > test/DebugInfo/if-bool-var.swift
```

그 다음 테스트를 실행합니다.

```bash
utils/run-test --build-dir $BUILD test/DebugInfo/if-bool-var.swift
```

### 관찰 포인트
- `if mutable`의 branch debug location이 기대한 line/column을 가리키지 않을 수 있습니다.

---

## 2단계 — 테스트에서 구현으로 역추적

먼저 새 테스트를 읽습니다.

```bash
sed -n '1,120p' test/DebugInfo/if-bool-var.swift
```

그 다음 구현 쪽을 찾습니다.

```bash
rg "isImplicit" lib/SIL/IR/SILLocation.cpp
rg "ImplicitConversionExpr" lib/SIL/IR/SILLocation.cpp
```

이 사례의 첫 진입점은 `SILLocation::SILLocation(Expr *E)` 생성자입니다.

### self-explanation
- 왜 `test/DebugInfo` 문제인데 `lib/SIL/IR/`부터 보는 것이 자연스러울까요?
- 왜 `IRGen`이 아니라 `SILLocation`에서 먼저 막힐 수 있을까요?

---

## 3단계 — 핵심 원인 파악

parent 상태에서는 **implicit conversion으로 감싼 explicit node**도 통째로 implicit처럼 취급됩니다.  
하지만 debug info 관점에서는 “겉의 래퍼는 implicit이어도, 실제 사용자 코드 위치는 explicit”여야 하는 경우가 있습니다.

핵심 질문:
- `Expr`가 implicit이면 무조건 implicit 처리해도 될까요?
- `ImplicitConversionExpr`는 왜 특별 취급이 필요할까요?

---

## 4단계 — 최소 수정 시도

아래 부분만 집중해서 읽으세요.

```bash
sed -n '1,120p' lib/SIL/IR/SILLocation.cpp
```

학습자 과제:
- `E->isImplicit()` 하나만으로는 부족한 이유 설명하기
- `ImplicitConversionExpr`의 `getSyntacticSubExpr()`를 보는 이유 설명하기
- “explicit node를 감싼 implicit wrapper”라는 표현을 자기 말로 다시 설명하기

---

## 5단계 — 좁은 검증

```bash
ninja -C $BUILD bin/swift-frontend
utils/run-test --build-dir $BUILD test/DebugInfo/if-bool-var.swift
```

가능하면 아래도 추가로 시도합니다.

```bash
utils/run-test --build-dir $BUILD test/DebugInfo
```

> 디렉토리 전체는 시간이 걸릴 수 있으니, 먼저 단일 테스트 성공을 확실히 확보하세요.

---

## 6단계 — merged fix와 비교

```bash
git diff cdd4049fb644a9505e1731843382dfc9d077e119..ed743259c5c -- \
  lib/SIL/IR/SILLocation.cpp \
  test/DebugInfo/if-bool-var.swift
```

비교 질문:
- 나는 “새 regression test를 먼저 추가한다”는 전략을 스스로 떠올렸는가?
- 나는 `ImplicitConversionExpr`를 특별 취급해야 한다고 예측했는가?
- 나는 왜 이 문제가 debug info 품질 문제인지 설명할 수 있는가?

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. `test/DebugInfo/`의 다른 테스트 하나를 골라 관련 위치 정보가 어디서 결정될지 추정하기
2. `SILLocation.cpp`의 다른 생성자를 읽고 explicit/implicit 기준을 비교하기
3. 이 사례의 테스트를 보고 “왜 새 테스트가 필요했는지” 5줄로 요약하기

---

## 회고 질문

1. 이번 사례에서 가장 어려웠던 것은 테스트 복원이었나요, 구현 추론이었나요?
2. `implicit`와 `explicit`라는 용어를 debug info 품질과 연결해 설명할 수 있나요?
3. 다음에 비슷한 경계 사례를 만나면 AST/SIL/IR 중 어디부터 볼 것인가요?

---

## 학습 설계 근거

- 이 사례는 “부모 커밋에는 테스트가 없다”는 현실적 상황을 훈련시키기 위해 선택했습니다.
- 테스트 복원 → 실패 확인 → 구현 수정 순서로 TDD 감각을 강화합니다.
- 경계 단계 사례를 일부러 넣어, 학습자가 단계 분류를 기계적으로 하지 않도록 설계했습니다.
- self-explanation 질문은 explicit/implicit 판단을 단순 조건문 암기로 끝내지 않게 합니다.
- 관련 연구 링크는 [../00-curriculum-and-method.md](../00-curriculum-and-method.md)를 참고하세요.
