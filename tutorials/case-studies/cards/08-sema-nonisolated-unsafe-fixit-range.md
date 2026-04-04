# 카드 08 — `nonisolated(unsafe)` fix-it이 전체 attribute를 교체하도록 수정

> **단계**: Sema / Fix-It
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: pr
> **anchor**: [PR #88086](https://github.com/swiftlang/swift/pull/88086)
> **fix commit**: `bf7d2551864c`
> **parent commit**: `5478f521ae39`
> **연결 이슈**: https://github.com/swiftlang/swift/issues/87342
> **관련 full tutorial**: [01-sema-fixit-source-locs.md](../01-sema-fixit-source-locs.md)

---

## 한눈에 보기

이 사례는 한 줄짜리 수정도 학습 가치가 클 수 있음을 보여줍니다. 특히 fix-it은 사용자가 editor에서 즉시 체감하기 때문에 작은 range 버그도 UX impact가 큽니다.

---

## 문제 맥락

PR 본문은 기존 fix-it이 `nonisolated`만 교체해서 “Replace nonisolated with nonisolated”처럼 무의미한 제안을 만들었다고 설명합니다. 핵심은 `getStartLoc()`에서 `getRange()`로의 전환입니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/Sema/TypeCheckAttr.cpp`

### 테스트
- `test/FixCode/nonisolated_unsafe_fixit.swift`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/FixCode/nonisolated_unsafe_fixit.swift
```

### 무엇을 관찰할까

실패 메시지 전문보다 replacement가 attribute 전체를 덮는지에 집중하세요.

---

## 어디서부터 읽을까

`visitNonisolatedAttr()`의 `fixItReplace` 호출 한 곳만 먼저 찾으면 됩니다.

---

## 이 카드로 배우는 것

- fixItReplace range choice
- attribute text replacement
- regression test minimalism

---

## 메타데이터 메모

- `review_signal`: medium
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
