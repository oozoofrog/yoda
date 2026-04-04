# 카드 09 — `SimplifyStructExtract`를 SILCombine에도 적용

> **단계**: Optimizer / SIL
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: commit
> **anchor**: [commit 77f64398e58](https://github.com/swiftlang/swift/commit/77f64398e58f5c6a67f40ead34a9494925dc59b9)
> **fix commit**: `77f64398e58f`
> **parent commit**: `c20593cd584b`
> **관련 full tutorial**: [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

---

## 한눈에 보기

새 최적화를 만드는 것만큼 중요한 것이 이미 있는 단순화를 다른 최적화 경로에 연결하는 일입니다. 이 카드는 “등록 위치가 곧 동작 범위”라는 감각을 줍니다.

---

## 문제 맥락

커밋 메시지는 단순하지만, 실제로는 이미 존재하던 simplification을 SILCombine 쪽에도 활성화하는 wiring 변화입니다. 이런 종류의 변경은 코드 양은 적어도 효과 범위가 넓습니다.

---

## 핵심 파일과 테스트

### 파일
- `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyStructExtract.swift`
- `lib/SILOptimizer/SILCombiner/Simplifications.def`

### 테스트
- `(관련 테스트는 부모/후속 커밋을 함께 탐색하는 방식 권장)`

---

## 재현 시작점

```bash
rg "SimplifyStructExtract" SwiftCompilerSources lib/SILOptimizer
```

### 무엇을 관찰할까

알고리즘 자체보다 “어디에 연결해야 실제로 더 자주 실행되는가”를 봅니다.

---

## 어디서부터 읽을까

`Simplifications.def`와 Swift 쪽 simplification 구현 파일을 나란히 놓고 읽는 것이 핵심입니다.

---

## 이 카드로 배우는 것

- optimization reuse
- SILCombine hookup
- pass registration

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: low
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
