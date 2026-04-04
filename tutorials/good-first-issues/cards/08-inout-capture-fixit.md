# Open GFI 카드 08 — #87830 escaping closure가 `inout`를 캡처할 때 fix-it 추가

> **Swift 버전 초점**: 6.3
> **이슈**: [#87830](https://github.com/swiftlang/swift/issues/87830)
> **단계 추정**: Sema / closures + capture semantics
> **난이도**: 중
> **예상 시간**: 45분
> **유형**: fix-it + note addition
> **상태**: open
> **워크북**: [Open issue analysis workbook](../../07-open-issue-analysis-workbook.md)

---

## 한눈에 보기

현재 에러는 맞지만, 사용자가 "copy를 캡처하라"는 대안까지 바로 이해하긴 어렵습니다. closure capture semantics와 fix-it 설계를 같이 연습하기 좋은 사례입니다.

---

## 재현 코드

```swift
func bar(_: @escaping () -> Void) {}
func foo(_ i: inout Int) {
  bar {
    _ = i
  }
}
```

---

## 첫 진입 파일 후보

- `include/swift/AST/DiagnosticsSIL.def`
- `lib/SILOptimizer/Mandatory/DiagnoseInvalidEscapingCaptures.cpp`

---

## 첫 재현 명령 후보

```bash
cat > /tmp/gfi-87830.swift <<'SWIFT'
func bar(_: @escaping () -> Void) {}
func foo(_ i: inout Int) {
  bar { _ = i }
}
SWIFT
swiftc /tmp/gfi-87830.swift
rg "escaping_inout_capture|capture a copy" include/swift/AST/DiagnosticsSIL.def lib/SILOptimizer/Mandatory/DiagnoseInvalidEscapingCaptures.cpp
```

---

## 예상 수정 유형

- note addition + fix-it insertion

---

## 관련 자료

### 레퍼런스
- [../04-stage-modification-workflow.md](../../04-stage-modification-workflow.md)

### merged 사례 카드
- [../../case-studies/cards/10-sil-memaccessutils-assert.md](../../case-studies/cards/10-sil-memaccessutils-assert.md)

### full tutorial
- [../../case-studies/02-sil-location-explicitness.md](../../case-studies/02-sil-location-explicitness.md)

---

## 분석 질문

1. 이 문제는 문구를 고치는 일인가, rule을 고치는 일인가?
2. 진단이 하나 더 필요할까, 아니면 기존 진단을 바꿔야 할까?
3. 가장 좁은 재현 명령을 먼저 잡는다면 무엇부터 실행할 것인가?

---

## 메타데이터 메모

- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `closures`, `swift 6.3`
- 이 카드는 **정답 없는 open issue**를 위한 탐색 카드입니다.
- 실제 분석은 워크북과 함께 진행하세요.
