# 사례 3 — IRGen fast existential cast 최적화 복원

> **단계**: IRGen (SIL/Serialization 경계 포함)
> **난이도**: 중상
> **anchor PR**: [#88270](https://github.com/swiftlang/swift/pull/88270)
> **merged fix commit**: `ae6e5ee9b99`
> **parent commit**: `68b55ff3ce1cd8d31ee9d1100fd10392a4f06038`
> **핵심 파일**: `lib/IRGen/GenCast.cpp`, `lib/Serialization/DeserializeSIL.cpp`
> **핵심 테스트**: `test/IRGen/vtable_conformance_entries.sil`, `test/SILOptimizer/conformance_lookup.swift`

---

## 이 사례를 마지막에 두는 이유

이 사례는 앞선 두 사례보다 복합적입니다.

- 관찰 포인트가 SIL/IR/런타임 표현을 모두 가로지릅니다.
- merged fix에 **새 고수준 회귀 테스트**와 **기존 IRGen 패턴 테스트 수정**이 함께 들어 있습니다.
- 구현도 단순 source range 문제가 아니라 **fast path 추가 + lowered-stage 선언 로딩 허용**까지 포함합니다.

즉, “한 단계의 지역 버그”가 아니라 “경계면을 건너는 설계 수정”에 가깝습니다.

---

## 학습 목표

- existential cast가 IRGen에서 어떤 최적화 기회를 가지는지 이해하기
- vtable conformance entries와 witness table lookup의 관계를 이해하기
- 고수준 실행 테스트와 저수준 IR 패턴 테스트를 함께 사용하는 검증 방식을 익히기

### 함께 볼 카드

- [06-irgen-typed-throws-crash.md](cards/06-irgen-typed-throws-crash.md)
- [11-irgen-save-ir-options.md](cards/11-irgen-save-ir-options.md)

---

## 문제 맥락 (PR / issue)

이 사례는 PR [#88270](https://github.com/swiftlang/swift/pull/88270)의 일부 커밋을 중심으로 봅니다.
PR 전체 주제는 **fast conformance cast를 도입해 compile time을 줄이는 것**입니다.

PR 설명에서 드러나는 큰 맥락은 다음과 같습니다.

- SwiftCompilerSources의 existential cast가 runtime conformance lookup에 많이 의존하고 있었고
- 이것이 compile time hot path로 관찰되었으며
- class-bound protocol + vtable conformance entry를 이용하면 fast path를 만들 수 있었습니다.

이 튜토리얼이 `ae6e5ee9b99`에 집중하는 이유는, 큰 PR 안에서도 **하나의 학습 단위로 잘 분리되는 correctness/IRGen 경계 사례**이기 때문입니다.

### 이 PR에서 특히 배울 점

- 큰 성능 PR도 실제로는 여러 개의 작은 학습 단위로 분해할 수 있습니다.
- PR 본문은 설계서 역할을 하고, 개별 커밋은 구현 단위 역할을 합니다.
- 이 사례는 “성능 최적화”와 “serialization 경계 수정”이 한 학습 단위에서 만나는 예입니다.

---

## 사전 회상 질문

1. `as? P` 같은 cast는 왜 front-end보다 runtime/IRGen 쪽에서 성능 차이가 크게 날까요?
2. 새 최적화나 fast path를 추가할 때는 왜 “실행 결과 테스트”와 “출력 패턴 테스트”를 같이 두는 것이 좋을까요?
3. Serialization 파일이 왜 IRGen 사례에 함께 등장할 수 있을까요?

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/irgen-fast-cast-parent

mkdir -p "$ROOT/worktrees"
git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" 68b55ff3ce1cd8d31ee9d1100fd10392a4f06038
cd "$CASE_ROOT"

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
```

---

## 1단계 — 새 고수준 회귀 테스트 복원

merged fix에서 새 테스트를 가져옵니다.

```bash
git show ae6e5ee9b99:test/SILOptimizer/conformance_lookup.swift > \
  test/SILOptimizer/conformance_lookup.swift
```

그 다음 이 테스트를 실행합니다.

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/conformance_lookup.swift
```

### 이 테스트의 의미
- 단순히 “성능이 좋아진다”가 아니라,
- conformance lookup과 cast 동작이 **IR/SIL 수준에서 기대 패턴을 가진다**는 것을 확인합니다.

---

## 2단계 — 기존 IRGen 테스트도 함께 본다

```bash
utils/run-test --build-dir $BUILD test/IRGen/vtable_conformance_entries.sil
sed -n '1,260p' test/IRGen/vtable_conformance_entries.sil
```

이 사례는 기존 테스트 수정과 새 테스트 추가가 함께 들어가므로,  
**둘을 같이 읽어야 설계 의도가 보입니다.**

---

## 3단계 — 구현 진입점 찾기

먼저 아래 검색으로 시작하세요.

```bash
rg "emitScalarExistentialDowncast" lib/IRGen
rg "lookUpVTable" lib/IRGen lib/Serialization
rg "Lowered" lib/Serialization/DeserializeSIL.cpp
```

첫 구현 진입점은 `lib/IRGen/GenCast.cpp`의 `emitScalarExistentialDowncast` 근처입니다.

### self-explanation
- 왜 이 최적화는 `Sema`가 아니라 `IRGen`에 들어가야 할까요?
- 왜 witness table을 runtime에 전부 물어보지 않고 vtable 음수 오프셋에서 빠르게 읽을 수 있을까요?

---

## 4단계 — 핵심 아이디어 정리

merged fix의 핵심 아이디어는 두 부분입니다.

### A. fast path
- 단일 protocol cast이고
- 추가적인 superclass/class constraint 검사가 필요 없으면
- vtable의 conformance entry에서 witness table을 직접 읽어 빠르게 cast를 처리할 수 있습니다.

### B. lowered-stage declaration loading 허용
- IRGen 과정에서 modulefile의 SIL vtable 선언을 읽는 상황이 있을 수 있으므로
- lowered stage에서도 declaration-only deserialization은 허용해야 합니다.

이 사례는 “최적화 추가”와 “그 최적화를 뒷받침하는 로딩 경계 수정”이 같이 들어간 구조입니다.

---

## 5단계 — 최소 수정 전략 세우기

수정 전에 아래를 적어보세요.

- 어떤 조건에서만 fast path를 써야 안전한가?
- null witness table이면 어떤 값이 반환되어야 하는가?
- 왜 serialization 쪽 수정이 없으면 이 사례가 깨질 수 있는가?

이 질문에 답하지 못하면, 코드를 고쳐도 설계를 이해한 것이 아닙니다.

---

## 6단계 — 좁은 검증

```bash
ninja -C $BUILD bin/swift-frontend
utils/run-test --build-dir $BUILD test/IRGen/vtable_conformance_entries.sil
utils/run-test --build-dir $BUILD test/SILOptimizer/conformance_lookup.swift
```

### 검증 순서가 중요한 이유
1. 먼저 기존 저수준 패턴 테스트로 IR 출력이 맞는지 확인
2. 그 다음 새 고수준 테스트로 실제 동작/최적화 경로를 확인

---

## 7단계 — merged fix와 비교

```bash
git diff 68b55ff3ce1cd8d31ee9d1100fd10392a4f06038..ae6e5ee9b99 -- \
  lib/IRGen/GenCast.cpp \
  lib/Serialization/DeserializeSIL.cpp \
  test/IRGen/vtable_conformance_entries.sil \
  test/SILOptimizer/conformance_lookup.swift
```

비교 질문:
- 나는 fast path 조건을 얼마나 보수적으로 잡았는가?
- 나는 serialization 경계 수정 필요성을 스스로 떠올렸는가?
- 나는 왜 테스트를 두 층(고수준/저수준)으로 깔아야 하는지 설명할 수 있는가?

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. `GenCast.cpp` 안의 다른 dynamic cast 경로 하나를 읽고 fast path 가능성을 적어보기
2. `test/IRGen/`의 다른 패턴 테스트 하나를 골라 구현 파일을 추정해 보기
3. 이 사례를 “성능 최적화가 왜 설계 이해를 요구하는가”라는 관점으로 요약해 보기

---

## 회고 질문

1. 이 사례는 왜 앞선 두 사례보다 훨씬 어려웠나요?
2. 당신은 구현 파일보다 테스트 의도 파악에 더 오래 걸렸나요, 그 반대였나요?
3. 이번 사례를 통해 “단계 경계”에 대한 감각이 어떻게 바뀌었나요?

---

## 학습 설계 근거

- 마지막 사례를 IRGen 경계 문제로 둔 이유는, 앞선 사례에서 만든 단계 분류 감각을 실제 전이시키기 위해서입니다.
- 고수준 새 테스트와 기존 저수준 패턴 테스트를 함께 복원하게 해, 검증 전략 자체를 학습하게 합니다.
- 이 사례는 worked example보다 설계 reasoning 비중이 높아, expertise reversal을 고려해 마지막에 배치했습니다.
- serialization 수정까지 포함한 이유는 “실제 컴파일러 수정은 한 파일짜리 국소 버그만이 아니다”를 보여주기 위함입니다.
- 관련 연구 링크는 [../00-curriculum-and-method.md](../00-curriculum-and-method.md)를 참고하세요.
