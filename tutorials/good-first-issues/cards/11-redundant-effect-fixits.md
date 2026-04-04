# Open GFI 카드 11 — #85882 redundant effect marker에 fix-it 추가

> **Swift 버전 초점**: 6.3
> **이슈**: [#85882](https://github.com/swiftlang/swift/issues/85882)
> **단계 추정**: Sema / effects diagnostics
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: fix-it insertion
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

redundant `try`/`unsafe` warning은 존재하지만, 제거 fix-it은 아직 부족합니다. expression-level effect marker와 single-value statement diagnostics를 함께 다룹니다.

---

## 재현 코드

```swift
@discardableResult
func g() -> Int? { nil }

_ = try g()
_ = try switch g() { default: 0 }
_ = unsafe switch g() { default: 0 }
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckEffects.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-85882.swift <<'SWIFT'
@discardableResult
func g() -> Int? { nil }

_ = try g()
_ = try switch g() { default: 0 }
_ = unsafe switch g() { default: 0 }
SWIFT
swiftc /tmp/gfi-85882.swift
rg "no_throw_in_try|effect_marker_on_single_value_stmt" include/swift/AST/DiagnosticsSema.def lib/Sema/TypeCheckEffects.cpp
```

## 실제 repo 테스트 후보

- `swift/test/Parse/try.swift` — `try` 관련 parse/diagnostic surface가 가장 넓게 모여 있음
- `swift/test/SIL/diagnose_effects.swift` — effect 관련 진단을 모아둔 테스트
- `swift/test/Unsafe/unsafe_in_unsafe.swift` — `unsafe` marker surface를 별도로 확인 가능

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

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `error handling`, `swift 6.3`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
