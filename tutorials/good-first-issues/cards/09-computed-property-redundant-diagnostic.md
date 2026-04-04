# Open GFI 카드 09 — #87322 computed property의 중복 진단 제거

> **Swift 버전 초점**: 6.3
> **이슈**: [#87322](https://github.com/swiftlang/swift/issues/87322)
> **단계 추정**: Parse + Sema diagnostics interplay
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: diagnostic suppression / deduplication
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

computed property에 type annotation이 없을 때 parse 단계와 semantic 단계의 진단이 동시에 나올 수 있습니다. 어떤 진단을 남기고 어떤 진단을 억제할지 판단하는 사례입니다.

---

## 재현 코드

```swift
func foo() {
  var int {}
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsParse.def`
- `include/swift/AST/DiagnosticsSema.def`
- `lib/Parse/ParseDecl.cpp`
- `lib/Sema/TypeCheckPattern.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-87322.swift <<'SWIFT'
func foo() {
  var int {}
}
SWIFT
swiftc /tmp/gfi-87322.swift
rg "computed_property_missing_type|cannot_infer_type_for_pattern" include/swift/AST/DiagnosticsParse.def include/swift/AST/DiagnosticsSema.def lib/Parse/ParseDecl.cpp lib/Sema/TypeCheckPattern.cpp
```

## 실제 repo 테스트 후보

- `swift/test/decl/var/properties.swift` — computed property explicit type + pattern error가 함께 나오는 대표 테스트
- `swift/test/decl/var/static_var.swift` — 같은 오류 surface를 static property에서 다시 확인할 수 있음
- `swift/test/decl/protocol/protocols.swift` — property without type와 pattern error가 같이 드러나는 파일

---

## 예상 수정 유형

- diagnostic suppression / duplicate removal

---

## 관련 자료

### 레퍼런스
- [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)

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

- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.3`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
