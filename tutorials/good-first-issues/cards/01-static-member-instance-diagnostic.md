# Open GFI 카드 01 — #48759 정적 멤버를 인스턴스에서 쓸 때의 진단 문구 개선

> **Swift 버전 초점**: 6.0
> **이슈**: [#48759](https://github.com/swiftlang/swift/issues/48759)
> **단계 추정**: Sema / diagnostics
> **난이도**: 하
> **예상 시간**: 30분
> **유형**: diagnostics wording
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

정적 멤버를 인스턴스 컨텍스트에서 참조했을 때, 현재 진단은 technically 맞지만 사용자가 오해하기 쉽습니다. 메시지/노트/설명 방식을 개선하는 전형적인 diagnostics QoI 과제입니다.

---

## 재현 코드

```swift
struct HasStatic {
    func foo() {
        print(cvar)
    }
    static let cvar = 123
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/CSDiagnostics.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-48759.swift <<'SWIFT'
struct HasStatic {
    func foo() {
        print(cvar)
    }
    static let cvar = 123
}
SWIFT
swiftc /tmp/gfi-48759.swift
rg "could_not_use_type_member_on_instance|static member" include/swift/AST/DiagnosticsSema.def lib/Sema/CSDiagnostics.cpp
```

---

## 예상 수정 유형

- diagnostics wording / note refinement

---

## 관련 자료

### 레퍼런스
- [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)
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

- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.0`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
