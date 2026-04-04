# 카드 01 — `cond_fail true` 최적화를 SILCombine 밖 패스로 이동

> **단계**: Optimizer / SILCombine
> **난이도**: 중
> **예상 시간**: 45분
> **출처**: pr
> **anchor**: [PR #88258](https://github.com/swiftlang/swift/pull/88258)
> **fix commit**: `cc3c70146207`
> **parent commit**: `a0ba1f70800f`
> **관련 full tutorial**: [04-optimizer-cond-fail-pass-architecture.md](../04-optimizer-cond-fail-pass-architecture.md)

---

## 한눈에 보기

이 사례는 “똑같이 보이는 최적화라도 어느 레벨에서 수행하느냐”가 왜 중요한지를 보여줍니다. 단순 peephole을 function pass로 승격해야 하는 이유를 OSSA 불변식 관점에서 배울 수 있습니다.

---

## 문제 맥락

PR 본문은 unconditional `cond_fail` 뒤에 `unreachable`를 삽입하는 단순화가 SILCombine 단계에서는 OSSA lifetime을 깨뜨릴 수 있다고 설명합니다. 즉, 버그의 핵심은 최적화 아이디어가 아니라 최적화의 실행 위치였습니다.

---

## 핵심 파일과 테스트

### 파일
- `SwiftCompilerSources/Sources/Optimizer/FunctionPasses/CondFailOptimization.swift`
- `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/SimplifyCondFail.swift`

### 테스트
- `test/SILOptimizer/simplify_cond_fail.sil`
- `test/SILOptimizer/constant_propagation.sil`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cond_fail.sil
utils/run-test --build-dir $BUILD test/SILOptimizer/constant_propagation.sil
```

### 무엇을 관찰할까

`cond_fail` 자체보다 “언제 unreachable를 넣어도 되는가”와 “lifetime completion이 누가 책임지는가”를 봅니다.

---

## 어디서부터 읽을까

먼저 `SimplifyCondFail.swift`의 기존 단순화 코드를 읽고, 이후 새 `CondFailOptimization.swift`가 어떤 후처리(removeDeadBlocks, completeLifetimes)를 추가하는지 비교합니다.

---

## 이 카드로 배우는 것

- OSSA lifetime completion
- instruction simplification vs function pass
- SIL verifier

---

## 메타데이터 메모

- `review_signal`: medium
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
