# 카드 07 — implicit available attr 진단의 source loc 개선

> **단계**: Sema / Diagnostics
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: pr
> **anchor**: [PR #87843](https://github.com/swiftlang/swift/pull/87843)
> **fix commit**: `efdcfbe8ac88`
> **parent commit**: `8631532bd2b4`
> **관련 full tutorial**: [01-sema-fixit-source-locs.md](../01-sema-fixit-source-locs.md)

---

## 한눈에 보기

이 사례는 “정답 위치에 진단을 찍는 것”이 얼마나 중요한지 보여줍니다. 컴파일러 diagnostics 품질은 메시지 텍스트뿐 아니라 어디에 찍는가에도 달려 있습니다.

---

## 문제 맥락

PR 설명은 implicit declaration이 enclosing scope보다 availability가 높을 때, 실제 사용자 코드에서 가장 이해하기 쉬운 enclosing declaration 위치에 진단해야 한다고 말합니다.

---

## 핵심 파일과 테스트

### 파일
- `lib/Sema/TypeCheckAttr.cpp`
- `include/swift/AST/DiagnosticsSema.def`

### 테스트
- `(PR에 테스트 추가는 없음; diagnostics 경로 추적 중심)`

---

## 재현 시작점

```bash
rg "implicit available" lib/Sema include/swift/AST
```

### 무엇을 관찰할까

새로운 알고리즘 추가보다 “어느 source loc를 사용자에게 보여줄 것인가”라는 정책 판단을 봅니다.

---

## 어디서부터 읽을까

`TypeCheckAttr.cpp`에서 availability 진단 경로를 찾고, `DiagnosticsSema.def`의 문구와 함께 읽습니다.

---

## 이 카드로 배우는 것

- diagnostic source location policy
- implicit declaration description
- availability diagnostics UX

---

## 메타데이터 메모

- `review_signal`: low
- `reproduction_quality`: medium
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
