# 카드 06 — typed throws 관련 IRGen crash 수정

> **단계**: IRGen
> **난이도**: 중상
> **예상 시간**: 60분
> **출처**: pr
> **anchor**: [PR #86387](https://github.com/swiftlang/swift/pull/86387)
> **fix commit**: `d09c773536ac`
> **parent commit**: `e6911d7711f6`
> **연결 이슈**: https://github.com/swiftlang/swift/issues/86347
> **관련 full tutorial**: [03-irgen-fast-existential-casts.md](../03-irgen-fast-existential-casts.md)

---

## 한눈에 보기

typed throws는 여러 단계에 영향을 미치는 feature라, 한 지점의 crash도 SILGen과 IRGen 테스트를 함께 봐야 합니다. 이 사례는 feature work가 왜 다층 테스트를 요구하는지 보여줍니다.

---

## 문제 맥락

PR은 issue #86347의 crash를 고친다고 매우 짧게 설명하지만, 수정 파일 목록은 call emission과 thunk, ObjC, distributed 경계까지 넓게 퍼져 있습니다. 작은 증상이 넓은 설계면을 건드릴 수 있다는 예입니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/IRGen/GenCall.cpp`
- `lib/IRGen/IRGenSIL.cpp`

### 테스트
- `test/IRGen/typed_throws_generic.swift`
- `test/SILGen/typed_throws_generic.swift`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/IRGen/typed_throws_generic.swift
utils/run-test --build-dir $BUILD test/SILGen/typed_throws_generic.swift
```

### 무엇을 관찰할까

어느 단계에서 문제가 처음 드러나는지와, 왜 IRGen 쪽 수정이 여러 helper 파일로 번지는지에 집중합니다.

---

## 어디서부터 읽을까

테스트를 먼저 읽은 뒤 `GenCall.cpp`와 `IRGenSIL.cpp`를 시작점으로 잡고 콜 경로를 좁혀갑니다.

---

## 이 카드로 배우는 것

- typed throws lowering
- IRGen crash triage
- cross-stage regression tests

---

## 메타데이터 메모

- `review_signal`: medium
- `reproduction_quality`: medium
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
