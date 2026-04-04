# Open GFI 카드 12 — #86693 inheritance clause의 global actor annotation 금지

> **Swift 버전 초점**: 6.3
> **이슈**: [#86693](https://github.com/swiftlang/swift/issues/86693)
> **단계 추정**: Type resolution / attributes in inheritance clauses
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: accepts invalid / rule enforcement
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

현재는 무의미한 global actor annotation이 inheritance clause에 들어가도 받아들여질 수 있습니다. diagnostics 개선이 아니라 language rule enforcement를 직접 다뤄볼 수 있는 사례입니다.

---

## 재현 코드

```swift
class Base {}
class Derived: @MainActor Base {}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckType.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-86693.swift <<'SWIFT'
class Base {}
class Derived: @MainActor Base {}
SWIFT
swiftc /tmp/gfi-86693.swift
rg "typeattr_not_inheritance_clause|resolveGlobalActor" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckType.cpp
```

---

## 예상 수정 유형

- rule enforcement + targeted diagnostic

---

## 관련 자료

### 레퍼런스
- [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)

### merged 사례 카드
- [../../case-studies/cards/03-sema-anyappleos-diagnostic-group.md](../../case-studies/cards/03-sema-anyappleos-diagnostic-group.md)

### full tutorial
- [../../case-studies/01-sema-fixit-source-locs.md](../../case-studies/01-sema-fixit-source-locs.md)

---

## 분석 질문

1. 이 문제는 문구를 고치는 일인가, rule을 고치는 일인가?
2. 진단이 하나 더 필요할까, 아니면 기존 진단을 바꿔야 할까?
3. 가장 좁은 재현 명령을 먼저 잡는다면 무엇부터 실행할 것인가?

---

## 메타데이터 메모

- 라벨: `good first issue`, `type checker`, `accepts invalid`, `concurrency`, `swift 6.3`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
