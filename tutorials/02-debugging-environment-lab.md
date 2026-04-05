# Lab 2 — Swift 컴파일러 디버깅 환경 구성

> **대상**: 첫 빌드와 단일 테스트 실행까지는 성공했지만, 내부 관찰 루프는 아직 약한 학습자
> **목표**: AST/SIL/IR dump, pass 추적, LLDB 진입, 테스트 재현의 네 가지 관찰 루프 확보
> **예상 시간**: 90~150분
> **선행 실습**: [01-build-environment-lab.md](01-build-environment-lab.md)
> **레퍼런스**: [../2026-04-04-swift-compiler-dev-environment.md](../2026-04-04-swift-compiler-dev-environment.md)

> **핵심 코스 연결**: 이 문서는 [첫 기여 핵심 코스](courses/00-swift-compiler-first-contribution-track.md)의 **Step 3, Step 5**에서 여는 보조 문서입니다. 처음 시작이라면 핵심 코스의 순서 안에서 사용하세요.

---

## 빠른 시작

먼저 실험용 파일을 하나 만듭니다.

```bash
cat >/tmp/compiler-lab.swift <<'SWIFT'
func add(_ a: Int, _ b: Int) -> Int { a + b }
SWIFT
```

그 다음 아래 4개를 순서대로 실행합니다.

```bash
swiftc -dump-ast /tmp/compiler-lab.swift > /tmp/compiler-lab.ast
swiftc -emit-silgen /tmp/compiler-lab.swift > /tmp/compiler-lab.silgen
swiftc -emit-sil -O /tmp/compiler-lab.swift > /tmp/compiler-lab.sil
swiftc -emit-ir -O /tmp/compiler-lab.swift > /tmp/compiler-lab.ll
```

---

## 시작 전 회상 질문

1. AST / Raw SIL / Optimized SIL / LLVM IR은 각각 어떤 질문에 답하나요?
2. “버그가 어느 단계에서 생겼는지”를 가장 빨리 분류하는 출력은 무엇일까요?
3. LLDB를 쓰기 전에 텍스트 출력만으로 확인할 수 있는 것은 무엇일까요?

---

## 실습 1 — 중간 표현을 눈으로 구분하기

```bash
swiftc -dump-ast /tmp/compiler-lab.swift | sed -n '1,80p'
swiftc -emit-silgen /tmp/compiler-lab.swift | sed -n '1,80p'
swiftc -emit-sil -O /tmp/compiler-lab.swift | sed -n '1,120p'
swiftc -emit-ir -O /tmp/compiler-lab.swift | sed -n '1,120p'
```

### 관찰 포인트
- AST는 선언과 표현식 트리 중심인가
- SILGen 출력에는 고수준 Swift 의미가 남아 있는가
- Optimized SIL에서는 중간 구조가 간결해졌는가
- LLVM IR은 Swift 고유 의미보다 저수준 연산 중심인가

### self-explanation
- 같은 `add` 함수가 네 단계에서 어떻게 다르게 보였는지 말로 설명해 보세요.

---

## 실습 2 — 테스트 재현 루프 만들기

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
utils/run-test --build-dir $BUILD test/Demangle/demangle.swift
```

### 목표
- “테스트를 돌렸다”가 아니라,
- “어떤 테스트가 어떤 서브시스템에 가까운지 분류할 수 있다”까지 가는 것

### 기록할 것
- 테스트 경로
- 예상 서브시스템
- 실제로 어떤 바이너리가 관여할 것 같은지

---

## 실습 3 — SIL pass 추적

```bash
swiftc -Xllvm '-sil-print-pass-name' -O /tmp/compiler-lab.swift 2>&1 | head -50
swiftc -Xllvm '-sil-print-function=$s4main3addyS2i_SitF' -O /tmp/compiler-lab.swift
swiftc -Xllvm '-sil-print-before=simplify-cfg' -O /tmp/compiler-lab.swift
swiftc -Xllvm '-sil-print-after=simplify-cfg' -O /tmp/compiler-lab.swift
```

### 관찰 포인트
- pass 이름을 먼저 보고, 출력은 그 다음에 본다
- `before/after`를 비교할 때 “무엇이 사라졌는가 / 무엇이 새로 생겼는가”만 먼저 본다

### 함정
- 처음부터 모든 pass 출력을 다 읽으려 하지 말 것
- 한 함수, 한 pass, 한 차이만 본다

---

## 실습 4 — 타입 체커 관찰

```bash
cat >/tmp/compiler-sema.swift <<'SWIFT'
func demo() {
  let x: Int = "hello"
}
SWIFT

swiftc -Xfrontend -debug-constraints /tmp/compiler-sema.swift
swiftc -Xfrontend -debug-diagnostic-names /tmp/compiler-sema.swift
```

### 목표
- Sema 문제를 “그냥 에러 메시지”가 아니라 “제약 시스템의 실패”로 보기 시작하기

---

## 실습 5 — LLDB로 진입하기

```bash
lldb -- $BUILD/bin/swift-frontend -emit-sil -O /tmp/compiler-lab.swift
```

LLDB 안에서:

```lldb
(lldb) breakpoint set -n "SILCombiner::run"
(lldb) run
(lldb) bt
(lldb) frame variable
```

### 최소 성공 기준
- 브레이크포인트가 한 번이라도 걸린다
- 백트레이스를 읽고 “지금 어느 계층에 들어와 있는가”를 말할 수 있다

---

## 권장 디버깅 로그 형식

```md
- 증상:
- 현재 단계 추정:
- 현재 가설:
- 확인 명령:
- 예상 결과:
- 실제 결과:
- 다음 행동:
```

이 템플릿을 그대로 복사해서 사용하세요.

---

## 독립 전이 과제

다음 중 하나를 직접 수행하세요.

1. `test/Demangle/demangle.swift`를 실행하고 어느 바이너리가 핵심인지 설명하기
2. `swiftc -emit-silgen`과 `swiftc -emit-sil -O`의 차이를 한 함수 기준으로 설명하기
3. LLDB에서 다른 함수 이름으로 브레이크포인트를 걸어보기

---

## 회고 질문

1. 텍스트 출력만으로 충분했던 부분과 디버거가 꼭 필요했던 부분은 무엇이었나요?
2. 당신이 가장 먼저 확인하는 출력은 AST/SIL/IR 중 무엇이었나요? 왜 그랬나요?
3. 오늘 만든 관찰 루프 중 가장 재사용 가치가 높은 것은 무엇인가요?

---

## 학습 설계 근거

- 이 랩은 “디버깅은 툴 사용법 암기”가 아니라 “관찰 루프 설계”라는 감각을 먼저 심습니다.
- AST/SIL/IR를 같은 입력으로 비교하게 한 것은 interleaving과 contrastive learning 효과를 노린 설계입니다.
- LLDB는 마지막에 배치해, 먼저 텍스트 관찰로 충분한 부분을 구분하도록 했습니다.
- 디버깅 로그는 메타인지와 self-explanation을 강제하기 위한 장치입니다.
- 관련 연구 링크는 [00-curriculum-and-method.md](00-curriculum-and-method.md)를 참고하세요.
