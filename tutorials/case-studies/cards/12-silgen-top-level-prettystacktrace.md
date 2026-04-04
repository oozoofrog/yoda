# 카드 12 — top-level decl visitor에 `PrettyStackTraceDecl` 추가

> **단계**: SILGen / Diagnostics
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: commit
> **anchor**: [commit cb85ded480c](https://github.com/swiftlang/swift/commit/cb85ded480ca705d762479c6940ae6e66b0bc4ff)
> **fix commit**: `cb85ded480ca`
> **parent commit**: `68768aeac321`
> **관련 full tutorial**: [../02-debugging-environment-lab.md](../../02-debugging-environment-lab.md)

---

## 한눈에 보기

학습자가 실제 crash를 만났을 때 좋은 stack trace의 가치를 바로 느낄 수 있습니다. 이런 도구성 수정은 디버깅 경험을 바꾸지만 코드 크기는 작습니다.

---

## 문제 맥락

이 커밋은 top-level decl visitor에 `PrettyStackTraceDecl`를 추가해 crash 시 어떤 선언을 처리 중이었는지 더 잘 보이게 만듭니다. 즉, 코어 로직이 아니라 “문제 분석 비용”을 낮추는 변경입니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/SILGen/SILGen.cpp`

### 테스트
- `(주로 crash 진단 개선 사례; 수동 관찰 중심)`

---

## 재현 시작점

```bash
rg "PrettyStackTraceDecl" lib/SILGen/SILGen.cpp
```

### 무엇을 관찰할까

기능 변화보다 “crash가 났을 때 어떤 정보가 새로 보이는가”를 상상하며 읽는 것이 좋습니다.

---

## 어디서부터 읽을까

`SILGen.cpp`의 top-level visitor 진입점을 찾고, trace 추가가 어떤 범위를 감싸는지 확인합니다.

---

## 이 카드로 배우는 것

- pretty stack trace
- compiler crash diagnosability
- top-level visitor instrumentation

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: low
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
