# Open GFI 카드 07 — #76320 existential에서 Self-reference 메서드를 못 쓰는 이유 note 추가

> **Swift 버전 초점**: 6.2
> **이슈**: [#76320](https://github.com/swiftlang/swift/issues/76320)
> **단계 추정**: Sema / diagnostics for existentials
> **난이도**: 중상
> **예상 시간**: 60분
> **유형**: note addition
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

현재 에러는 generic constraint를 쓰라고만 말하고, 왜 메서드를 사용할 수 없는지는 잘 설명하지 않습니다. existential과 `Self` 연관 타입 제약의 원인을 설명하는 note를 붙이는 문제입니다.

---

## 재현 코드

```swift
protocol Base { associatedtype SomeID: Hashable }
protocol Alpha: Base { func take(id: Self.SomeID) }
struct Use {
  let alpha: any Alpha
  func test() {
    alpha.take(id: 12)
  }
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/CSDiagnostics.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-76320.swift <<'SWIFT'
protocol Base { associatedtype SomeID: Hashable }
protocol Alpha: Base { func take(id: Self.SomeID) }
struct Use { let alpha: any Alpha; func test() { alpha.take(id: 12) } }
SWIFT
swiftc /tmp/gfi-76320.swift
rg "generic constraint instead|member .* cannot be used on value of type" include/swift/AST/DiagnosticsSema.def lib/Sema/CSDiagnostics.cpp
```

---

## 예상 수정 유형

- note addition / diagnostic explanation

---

## 관련 자료

### 레퍼런스
- [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)

### merged 사례 카드
- [../../case-studies/cards/06-irgen-typed-throws-crash.md](../../case-studies/cards/06-irgen-typed-throws-crash.md)

### full tutorial
- [../../case-studies/03-irgen-fast-existential-casts.md](../../case-studies/03-irgen-fast-existential-casts.md)

---

## 분석 질문

1. 이 문제는 문구를 고치는 일인가, rule을 고치는 일인가?
2. 진단이 하나 더 필요할까, 아니면 기존 진단을 바꿔야 할까?
3. 가장 좁은 재현 명령을 먼저 잡는다면 무엇부터 실행할 것인가?

---

## 메타데이터 메모

- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `existentials`, `swift 6.2`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
