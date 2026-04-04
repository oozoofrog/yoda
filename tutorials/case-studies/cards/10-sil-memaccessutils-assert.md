# 카드 10 — `MemAccessUtils`의 잘못된 assert 제거

> **단계**: SIL / Utils
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: commit
> **anchor**: [commit 7c8f61c3610](https://github.com/swiftlang/swift/commit/7c8f61c36105914549160959925b8098a9aa10cd)
> **fix commit**: `7c8f61c36105`
> **parent commit**: `864c08f5ef3f`
> **관련 full tutorial**: [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

---

## 한눈에 보기

assert 제거 사례는 “실제 잘못된 불변식 가정”을 배우기에 좋습니다. crash가 크지 않아도 underlying model이 틀렸다는 뜻이기 때문입니다.

---

## 문제 맥락

이 커밋은 분석 유틸리티 쪽의 잘못된 assert를 제거합니다. 보통 이런 사례는 재현이 작고 수정은 짧지만, 왜 assert가 잘못됐는지 설명하는 것이 핵심입니다.

---

## 핵심 파일과 테스트

### 파일
- `include/swift/SIL/MemAccessUtils.h`

### 테스트
- `test/SILOptimizer/cse_ossa.sil`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/cse_ossa.sil
```

### 무엇을 관찰할까

assert를 단순 삭제하는 게 아니라 어떤 케이스를 과도하게 금지하고 있었는지 봅니다.

---

## 어디서부터 읽을까

관련 테스트를 먼저 보고, 그다음 `MemAccessUtils.h`에서 가정이 너무 강한 부분을 찾습니다.

---

## 이 카드로 배우는 것

- assert triage
- analysis utilities
- small crash fix workflow

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: medium
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
