# 카드 04 — operator overload scoring에서 erasure lower 처리

> **단계**: Sema / CSOptimizer
> **난이도**: 중상
> **예상 시간**: 60분
> **출처**: pr
> **anchor**: [PR #88188](https://github.com/swiftlang/swift/pull/88188)
> **fix commit**: `1280a27d70da`
> **parent commit**: `aa649de3ca77`
> **연결 이슈**: https://github.com/swiftlang/swift/issues/88193
> **관련 full tutorial**: [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)

---

## 한눈에 보기

타입 체커의 heuristic은 작은 점수 조정 하나가 사용자 체감 동작을 바꿉니다. 이 사례는 알고리즘 버그가 아니라 ranking policy의 미세 조정이 어떻게 동작 의미를 바꾸는지 보여줍니다.

---

## 문제 맥락

PR 설명은 pre-6.3 operator overload selection 동작을 복원한다고 말합니다. generic requirement 충족과 erasure lower가 얽힌 경우 concrete overload를 더 강하게 선호하도록 scoring을 조정합니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/Sema/CSOptimizer.cpp`

### 테스트
- `test/Constraints/operator_generics_vs_erasure.swift`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/Constraints/operator_generics_vs_erasure.swift
```

### 무엇을 관찰할까

“왜 concrete overload가 historically preferred인지”와 “그 선호가 score에 어디 반영되는지”를 같이 봅니다.

---

## 어디서부터 읽을까

`CSOptimizer.cpp`에서 score 관련 코드만 먼저 추적한 뒤, 테스트 이름과 expected diagnostics/behavior를 대응시킵니다.

---

## 이 카드로 배우는 것

- constraint solver heuristics
- operator overload resolution
- concrete vs generic preference

---

## 메타데이터 메모

- `review_signal`: medium
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
