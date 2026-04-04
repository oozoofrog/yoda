# Diagnostics 트랙 로그 샘플

이 문서는 `30-day-diagnostics-track.md`를 따라갈 때 남길 수 있는 로그 예시입니다.

중요한 점:
- 길게 쓰는 것보다 **핵심 판단**을 남기는 것이 중요합니다.
- 틀린 가설도 반드시 기록합니다.
- 다음 세션 첫 질문이 있어야 연속성이 생깁니다.

---

## Day 1 샘플 — 환경 루프 확보

- 오늘 목표: `BUILD` 경로를 확정하고 첫 단일 테스트를 성공시킨다.
- 실행한 명령:
  ```bash
  export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
  ninja -C $BUILD bin/swift-frontend
  utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
  ```
- 관찰:
  - `build-script`보다 `ninja -C $BUILD ...`가 일상 루프에 훨씬 적합하다.
  - `run-test`는 source path 기준으로 부를 수 있어서 기억하기 쉽다.
- 틀린 가설:
  - 처음엔 `llvm-lit`를 바로 써야 한다고 생각했는데, 현재 루프에선 `run-test`가 더 편했다.
- 다음 세션 첫 질문:
  - AST / SIL / IR 중 어떤 출력을 먼저 보는 습관이 가장 좋을까?

---

## Day 8 샘플 — static member diagnostics 카드

- 오늘 본 카드: `#48759 정적 멤버를 인스턴스에서 쓸 때의 진단 문구 개선`
- 재현 코드:
  ```swift
  struct HasStatic {
      func foo() {
          print(cvar)
      }
      static let cvar = 123
  }
  ```
- 실행한 명령:
  ```bash
  swiftc /tmp/gfi-48759.swift
  rg "could_not_use_type_member_on_instance|static member" include/swift/AST/DiagnosticsSema.def lib/Sema/CSDiagnostics.cpp
  ```
- 관찰:
  - 진단 ID는 `could_not_use_type_member_on_instance` 쪽일 가능성이 높다.
  - 진단 문구가 technically 맞아도, 사용자가 왜 틀렸는지 바로 이해하기 어렵다.
- 틀린 가설:
  - 처음에는 `TypeCheckAttr.cpp`를 먼저 볼 줄 알았는데, 실제로는 `CSDiagnostics.cpp`가 더 직접적이었다.
- 다음 세션 첫 질문:
  - 이 문제는 wording만 바꾸면 충분한가, note도 추가해야 할까?

---

## Day 15 샘플 — open issue 워크북 첫 적용

- 오늘 본 issue: `#48759`
- 시작 전 가설:
  - Sema diagnostics 문제이고, fix-it보다 wording과 note가 핵심일 것 같다.
- 첫 진입 파일 후보:
  - `include/swift/AST/DiagnosticsSema.def`
  - `lib/Sema/CSDiagnostics.cpp`
  - `swift/test/Constraints/members.swift`
- 재현 명령:
  ```bash
  swiftc /tmp/gfi-48759.swift
  ```
- 관찰 결과:
  - 에러는 정확하지만, “instance에서 static member를 봤다”는 인지 부하가 높다.
  - `HasStatic.` fix-it이 있어도 메시지만 보면 `self.cvar`처럼 오해하기 쉽다.
- 틀린 가설:
  - fix-it 개선이 핵심이라고 생각했지만, 실제 issue 본문은 메시지 해석 문제를 더 강하게 말한다.
- 다음 세션 첫 질문:
  - 기존 note 체계를 건드리지 않고도 문장을 개선할 수 있을까?

---

## Day 25 샘플 — merged 사례와 open issue 비교

- 비교 대상:
  - merged: `01-sema-fixit-source-locs`
  - open: `#87324 computed property type fix-it`
- 관찰:
  - merged 사례는 source range와 API 선택이 이미 확정돼 있다.
  - open issue는 “parse 단계에서 fix-it을 줄지”, “sema 단계까지 넘길지”부터 스스로 판단해야 한다.
- 배운 점:
  - 정답 있는 사례는 구현 패턴을 배우기 좋고,
  - open issue는 단계 추정 능력을 더 강하게 요구한다.
- 다음 세션 첫 질문:
  - `computed_property_missing_type` fix-it은 placeholder를 어디에 넣는 게 가장 자연스러운가?

---

## Day 30 샘플 — 최종 회고

- 내가 가장 자신 있는 유형 3개:
  - diagnostics wording
  - fix-it insertion
  - duplicate diagnostics suppression
- 아직 막막한 유형 2개:
  - existential 관련 note 설계
  - closure capture semantics와 SIL diagnostics 경계
- 다음 30일에 이어갈 open issue:
  - `#87830` — escaping closure captures `inout` parameter
- 이유:
  - 재현은 짧고,
  - fix-it과 capture semantics를 함께 다룰 수 있고,
  - diagnostics와 SIL 경계를 더 배우기에 적절하다.
