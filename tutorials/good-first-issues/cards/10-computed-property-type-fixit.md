# Open GFI 카드 10 — #87324 computed property의 type annotation fix-it 추가

> **Swift 버전 초점**: 6.3
> **이슈**: [#87324](https://github.com/swiftlang/swift/issues/87324)
> **단계 추정**: Parse diagnostics / fix-it
> **난이도**: 하
> **예상 시간**: 30분
> **유형**: fix-it insertion
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

올바른 에러는 나오지만 사용자가 바로 고칠 수 있는 annotation placeholder fix-it이 없습니다. 작은 범위의 parse diagnostic fix-it 추가 문제입니다.

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
- `lib/Parse/ParseDecl.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-87324.swift <<'SWIFT'
func foo() {
  var int {}
}
SWIFT
swiftc /tmp/gfi-87324.swift
rg "computed_property_missing_type" include/swift/AST/DiagnosticsParse.def lib/Parse/ParseDecl.cpp
```

## 실제 repo 테스트 후보

- `swift/test/decl/var/properties.swift` — computed property missing type 진단과 fix-it이 들어갈 가장 직접적인 후보
- `swift/test/decl/var/static_var.swift` — placeholder fix-it을 static property surface에도 확장할 수 있는 후보

---

## 예상 수정 유형

- fix-it insertion

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

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `swift 6.3`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
