# 카드 02 — enum tag comparison 최적화의 miscompile 수정

> **단계**: Optimizer / Correctness
> **난이도**: 중
> **예상 시간**: 45분
> **출처**: pr
> **anchor**: [PR #88052](https://github.com/swiftlang/swift/pull/88052)
> **fix commit**: `bd1af9283f6a`
> **parent commit**: `594c32a89d95`
> **연결 이슈**: https://github.com/swiftlang/swift/issues/87906
> **관련 full tutorial**: [05-optimizer-enum-tag-comparison-correctness.md](../05-optimizer-enum-tag-comparison-correctness.md)

---

## 한눈에 보기

이 사례는 성능 최적화가 잘못 적용되면 조용한 miscompile로 이어질 수 있음을 보여줍니다. “빠르다”보다 “언제 합법적인가”를 먼저 따져야 한다는 교훈이 선명합니다.

---

## 문제 맥락

PR 설명은 RawRepresentable 비교를 enum tag 비교로 치환하는 최적화가 custom raw type에서 잘못될 수 있다고 지적합니다. 리뷰에서는 `String`과 custom raw type의 비교 semantics를 어디까지 신뢰할지에 대한 논쟁이 드러납니다.

---

## 핵심 파일과 테스트

### 파일
- `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyApply.swift`

### 테스트
- `test/SILOptimizer/enum-comparison.swift`
- `test/SILOptimizer/simplify_apply.sil`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/enum-comparison.swift
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_apply.sil
```

### 무엇을 관찰할까

새 테스트의 custom raw value와 `NonUnqiueRawValue`가 왜 필요한지, 그리고 `hasKnownRawType` 체크가 왜 optimization legality를 표현하는지 봅니다.

---

## 어디서부터 읽을까

`SimplifyApply.swift`의 `tryOptimizeEnumComparison`만 먼저 읽고, 그 뒤 테스트 diff를 비교하는 순서가 좋습니다.

---

## 이 카드로 배우는 것

- miscompile triage
- known stdlib type restriction
- optimization legality

---

## 메타데이터 메모

- `review_signal`: high
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
