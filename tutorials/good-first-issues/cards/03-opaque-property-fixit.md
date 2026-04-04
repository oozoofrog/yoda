# Open GFI 카드 03 — #69241 opaque property inferred type에 대한 fix-it 추가

> **Swift 버전 초점**: 6.0
> **이슈**: [#69241](https://github.com/swiftlang/swift/issues/69241)
> **단계 추정**: Sema / storage type checking
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: fix-it insertion
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

opaque result type가 property/variable type inference로 흘러들어올 때, 에러는 나오지만 사용자가 바로 고칠 수 있는 fix-it이 없습니다. `some` 관련 진단과 storage checking의 교차 지점입니다.

---

## 재현 코드

```swift
protocol Proto {}
struct Concrete: Proto {}
func getProto() -> some Proto { Concrete() }

let value = getProto()
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckStorage.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-69241.swift <<'SWIFT'
protocol Proto {}
struct Concrete: Proto {}
func getProto() -> some Proto { Concrete() }

let value = getProto()
SWIFT
swiftc /tmp/gfi-69241.swift
rg "property definition has inferred type|opaque result type as its type by type inference" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckStorage.cpp
```

---

## 예상 수정 유형

- fix-it insertion

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

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `opaque types`, `swift 6.0`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
