# 카드 05 — generic actor의 async deinit 회귀 테스트 확대

> **단계**: Concurrency / Tests
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: pr
> **anchor**: [PR #88231](https://github.com/swiftlang/swift/pull/88231)
> **fix commit**: `1b999288aa3d`
> **parent commit**: `a0ba1f70800f`
> **연결 이슈**: https://github.com/swiftlang/swift/issues/88197
> **관련 full tutorial**: [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

---

## 한눈에 보기

항상 구현 수정만 배우는 것은 아닙니다. 이 사례는 이미 고쳐진 버그를 더 넓은 모드와 경로에서 다시 잡히게 만드는 regression test의 가치를 보여줍니다.

---

## 문제 맥락

PR 본문은 실제 버그 수정은 earlier commit에서 끝났고, 이 PR은 normal test suite로 coverage를 확대한다고 설명합니다. 즉 “버그를 고쳤다”가 끝이 아니라 “다시 안 깨지게 묶는다”가 학습 포인트입니다.

---

## 핵심 파일과 테스트

### 파일
- `test/SILGen/deinit_isolation_generic.swift`

### 테스트
- `test/SILGen/deinit_isolation_generic.swift`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/SILGen/deinit_isolation_generic.swift
```

### 무엇을 관찰할까

새 테스트가 어떤 mode/shape를 추가로 커버하는지 보세요. 구현보다 coverage 설계가 핵심입니다.

---

## 어디서부터 읽을까

테스트 파일을 먼저 읽고, 이 버그를 고친 원 커밋을 PR 본문 링크로 따라가는 방식이 좋습니다.

---

## 이 카드로 배우는 것

- regression test design
- coverage expansion
- validation-test to test migration

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
