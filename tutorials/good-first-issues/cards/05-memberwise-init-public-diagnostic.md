# Open GFI 카드 05 — #78362 memberwise init 공개성 진단과 fix-it 개선

> **Swift 버전 초점**: 6.2
> **이슈**: [#78362](https://github.com/swiftlang/swift/issues/78362)
> **단계 추정**: Sema / protocol conformance + synthesis
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: diagnostics + fix-it guidance
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

암묵적 memberwise initializer를 public으로 만들 수 없는데, 현재 진단은 그렇게 해야 하는 것처럼 들립니다. conformance diagnostics와 synthesized memberwise init 설명을 함께 다뤄야 합니다.

---

## 재현 코드

```swift
public struct Number: RawRepresentable {
  public let rawValue: Int
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckProtocol.cpp`
- `lib/Sema/CodeSynthesis.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-78362.swift <<'SWIFT'
public struct Number: RawRepresentable {
  public let rawValue: Int
}
SWIFT
swiftc /tmp/gfi-78362.swift
rg "witness_not_accessible_proto|memberwise initializer" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckProtocol.cpp lib/Sema/CodeSynthesis.cpp
```

---

## 예상 수정 유형

- diagnostic improvement + fix-it guidance

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

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `memberwise init`, `swift 6.2`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
