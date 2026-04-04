# 카드 11 — IRGen 디버깅 옵션 `-save-irgen`, `-save-ir` 추가

> **단계**: IRGen / Debugging
> **난이도**: 하
> **예상 시간**: 20분
> **출처**: commit
> **anchor**: [commit 6f3a4b04c3d](https://github.com/swiftlang/swift/commit/6f3a4b04c3dac966512ce72afefdf4775c920c1c)
> **fix commit**: `6f3a4b04c3da`
> **parent commit**: `956cf51d6fc1`
> **관련 full tutorial**: [../02-debugging-environment-lab.md](../../02-debugging-environment-lab.md)

---

## 한눈에 보기

모든 학습이 bug fix일 필요는 없습니다. 디버깅 옵션 추가 사례는 “도구를 개선하면 이후 학습/디버깅이 얼마나 쉬워지는가”를 보여줍니다.

---

## 문제 맥락

이 커밋은 `-save-irgen <file>`와 `-save-ir <file>` 옵션을 추가해 관찰 결과를 파일로 남길 수 있게 합니다. 튜토리얼 관점에서는 관찰 가능성(observability) 자체를 개선한 사례입니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/IRGen/IRGen.cpp`

### 테스트
- `(옵션 동작 확인용 수동 실습 권장)`

---

## 재현 시작점

```bash
rg "save-irgen" lib/IRGen/IRGen.cpp
swiftc -help-hidden | rg "save-ir"
```

### 무엇을 관찰할까

옵션이 어느 레이어에서 파싱되고 실제 저장 호출이 어디에 연결되는지 추적합니다.

---

## 어디서부터 읽을까

`IRGen.cpp` 한 파일에서 시작해도 전체 그림이 보이는 좋은 입문 사례입니다.

---

## 이 카드로 배우는 것

- debugging UX
- developer tooling
- IRGen observability

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: medium
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
