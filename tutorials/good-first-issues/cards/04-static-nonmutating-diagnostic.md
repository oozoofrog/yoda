# Open GFI 카드 04 — #77835 `static nonmutating` 조합에 대한 진단 개선

> **Swift 버전 초점**: 6.1
> **이슈**: [#77835](https://github.com/swiftlang/swift/issues/77835)
> **단계 추정**: Sema / attributes
> **난이도**: 하
> **예상 시간**: 30분
> **유형**: diagnostics wording
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

현재 진단은 "static functions must not be declared mutating"라고 나오지만, 실제 입력은 `nonmutating static` 조합입니다. modifier 조합을 더 잘 설명하는 문구 설계가 핵심입니다.

---

## 재현 코드

```swift
struct S {
  nonmutating static func foo() {}
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckAttr.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-77835.swift <<'SWIFT'
struct S {
  nonmutating static func foo() {}
}
SWIFT
swiftc /tmp/gfi-77835.swift
rg "static_functions_not_mutating" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckAttr.cpp
```

---

## 예상 수정 유형

- diagnostic wording / note refinement

---

## 관련 자료

### 레퍼런스
- [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

### merged 사례 카드
- [../../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md](../../case-studies/cards/08-sema-nonisolated-unsafe-fixit-range.md)

### full tutorial
- [../../case-studies/01-sema-fixit-source-locs.md](../../case-studies/01-sema-fixit-source-locs.md)

---

## 분석 질문

1. 이 문제는 문구를 고치는 일인가, rule을 고치는 일인가?
2. 진단이 하나 더 필요할까, 아니면 기존 진단을 바꿔야 할까?
3. 가장 좁은 재현 명령을 먼저 잡는다면 무엇부터 실행할 것인가?

---

## 메타데이터 메모

- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.1`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
