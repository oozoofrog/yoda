# Open GFI 카드 06 — #83344 `@dynamicMemberLookup` 요구사항 누락 시 fix-it 추가

> **Swift 버전 초점**: 6.2
> **이슈**: [#83344](https://github.com/swiftlang/swift/issues/83344)
> **단계 추정**: Sema / attribute validation
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: fix-it insertion
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

`@dynamicMemberLookup` 요구사항이 없을 때 에러는 나오지만, 어떻게 고쳐야 하는지 fix-it이 부족합니다. attribute validation과 structured suggestion을 연습하기 좋은 사례입니다.

---

## 재현 코드

```swift
@dynamicMemberLookup
struct Test {}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckAttr.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-83344.swift <<'SWIFT'
@dynamicMemberLookup
struct Test {}
SWIFT
swiftc /tmp/gfi-83344.swift
rg "@dynamicMemberLookup|subscript\(dynamicMember" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckAttr.cpp
```

---

## 예상 수정 유형

- fix-it insertion / note addition

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

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `attributes`, `swift 6.2`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
