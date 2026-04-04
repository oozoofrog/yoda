# Open GFI 카드 02 — #72662 `any P!`에 대한 중복 진단 정리

> **Swift 버전 초점**: 6.0
> **이슈**: [#72662](https://github.com/swiftlang/swift/issues/72662)
> **단계 추정**: Sema / type resolution
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: diagnostics deduplication + spelling
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

`any P!`처럼 잘못된 타입 표기에서 두 개의 진단이 겹쳐 나옵니다. 올바른 spelling과 단일한 진단 전략을 고르는, TypeResolver 경계 문제입니다.

---

## 재현 코드

```swift
protocol P {}
let _: any P!
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckType.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-72662.swift <<'SWIFT'
protocol P {}
let _: any P!
SWIFT
swiftc /tmp/gfi-72662.swift
rg "incorrect_optional_any|implicitly_unwrapped_optional" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckType.cpp
```

---

## 예상 수정 유형

- diagnostic consolidation / fix-it spelling

---

## 관련 자료

### 레퍼런스
- [../03-pipeline-entrypoints-and-knowledge-map.md](../../03-pipeline-entrypoints-and-knowledge-map.md)
- [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

### merged 사례 카드
- [../../case-studies/cards/07-sema-implicit-available-source-loc.md](../../case-studies/cards/07-sema-implicit-available-source-loc.md)

### full tutorial
- [../../case-studies/01-sema-fixit-source-locs.md](../../case-studies/01-sema-fixit-source-locs.md)

---

## 분석 질문

1. 이 문제는 문구를 고치는 일인가, rule을 고치는 일인가?
2. 진단이 하나 더 필요할까, 아니면 기존 진단을 바꿔야 할까?
3. 가장 좁은 재현 명령을 먼저 잡는다면 무엇부터 실행할 것인가?

---

## 메타데이터 메모

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `existentials`, `swift 6.0`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
