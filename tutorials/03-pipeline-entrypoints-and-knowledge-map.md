# Lab 3 — 컴파일러 단계별 진입점과 지식 획득 지도

> **대상**: 어느 디렉토리부터 열어야 할지 자주 막히는 학습자
> **목표**: Parse / Sema / SILGen / SILOptimizer / IRGen / LLVM 단계의 첫 진입점과 학습 순서를 확보
> **예상 시간**: 60~90분
> **선행 실습**: [01-build-environment-lab.md](01-build-environment-lab.md), [02-debugging-environment-lab.md](02-debugging-environment-lab.md)

> **핵심 코스 연결**: 이 문서는 [첫 기여 핵심 코스](courses/00-swift-compiler-first-contribution-track.md)의 **Step 3~4**에서 여는 보조 문서입니다. 전체를 외우기보다, 현재 보고 있는 문제의 첫 진입 단계만 찾는 용도로 사용하세요.

---

## 빠른 시작

아래 표를 먼저 훑고, 오늘은 **한 단계만** 골라 파고드는 것이 목표입니다.

| 단계 | 첫 관찰 명령 | 첫 디렉토리 | 첫 문서 |
|---|---|---|---|
| Parse / AST | `swiftc -dump-ast file.swift` | `lib/Parse/` | `docs/HowToGuides/GettingStarted.md` |
| Sema | `swiftc -typecheck file.swift` | `lib/Sema/` | `docs/TypeChecker.md` |
| SILGen | `swiftc -emit-silgen file.swift` | `lib/SILGen/` | `docs/SIL/SIL.md` |
| SIL Optimizer | `swiftc -emit-sil -O file.swift` | `lib/SILOptimizer/`, `SwiftCompilerSources/Sources/Optimizer/` | `docs/SIL/Instructions.md` |
| IRGen | `swiftc -emit-ir -O file.swift` | `lib/IRGen/` | `docs/ABI/` |
| Demangling | `echo '$s...' | $BUILD/bin/swift-demangle` | `lib/Demangling/` | `docs/ABI/Mangling.rst` |

---

## 시작 전 회상 질문

1. `test/Sema/...` 테스트를 보면 첫 번째로 어느 디렉토리를 열어야 할까요?
2. `test/IRGen/...`과 `test/SILOptimizer/...`는 왜 관찰 명령이 다를까요?
3. 어떤 경우에 `lib/SILOptimizer/`보다 `SwiftCompilerSources/Sources/Optimizer/`를 먼저 보게 될까요?

---

## 단계별 진입점 표

| 단계 | 주로 답하는 질문 | 첫 파일/디렉토리 | 잘못 진입했을 때의 신호 |
|---|---|---|---|
| Parse | “문법 트리는 어떻게 생기나?” | `lib/Parse/`, `include/swift/AST/` | 타입 관련 로직을 찾고 있는데 parser만 보고 있음 |
| Sema | “이 코드는 타입상/의미상 유효한가?” | `lib/Sema/`, `include/swift/AST/Diagnostics*.def` | 최적화나 IR 문제인데 진단만 보고 있음 |
| SILGen | “이 Swift 의미가 처음 SIL로 어떻게 내려가나?” | `lib/SILGen/` | 이미 최적화된 SIL을 기대하고 있음 |
| SIL / Optimizer | “이 SIL을 어떻게 단순화/최적화하나?” | `lib/SIL/`, `lib/SILOptimizer/`, `SwiftCompilerSources/Sources/Optimizer/` | 원인이 front-end인데 최적화 패스만 찾고 있음 |
| IRGen | “이 SIL/타입 정보가 LLVM IR로 어떻게 가나?” | `lib/IRGen/` | 원인이 SIL 이전인데 너무 늦게 진입함 |
| LLVM backend | “기계어/타겟 레벨에서 무슨 일이 벌어지나?” | LLVM 쪽 | Swift 의미 보존 문제를 backend에서 찾으려 함 |

---

## 테스트 경로로 단계 추정하기

| 테스트 경로 | 첫 추정 단계 | 첫 행동 |
|---|---|---|
| `test/Sema/...` | Sema | 진단 텍스트나 관련 attr/typecheck 함수 검색 |
| `test/Parse/...` | Parse | AST 덤프와 parser 디렉토리 확인 |
| `test/SILGen/...` | SILGen | `-emit-silgen`으로 출력 비교 |
| `test/SILOptimizer/...` | SIL Optimizer | `-emit-sil -O`, `sil-print-*`, 패스 추적 |
| `test/IRGen/...` | IRGen | `-emit-ir`, `lib/IRGen/` 검색 |
| `test/Demangle/...` | Demangling | `swift-demangle`, `lib/Demangling/` 검색 |
| `test/DebugInfo/...` | SILGen / IRGen / DebugInfo 경계 | debug loc와 IR debug metadata 둘 다 의심 |

---

## 지식 획득 순서

### 1단계 — 출력 먼저 보기
- AST / SIL / IR 중 해당 단계의 출력을 먼저 본다.

### 2단계 — 테스트를 읽기
- `RUN:`과 `CHECK:`를 읽어 “테스트가 무엇을 기대하는지”를 먼저 언어화한다.

### 3단계 — 첫 디렉토리만 보기
- 처음부터 10개 디렉토리를 열지 않는다.
- 가장 가능성이 높은 디렉토리 하나만 연다.

### 4단계 — 관련 문서 한 개만 읽기
- 문서도 한 번에 여러 개 읽지 않는다.
- 현재 단계에 가장 가까운 문서 한 개만 읽는다.

### 5단계 — 다시 출력으로 돌아가기
- 읽은 문서를 바탕으로 출력을 다시 보면 연결이 생긴다.

---

## 추천 읽기 그래프

### 공통 시작
- [../2026-04-04-swift-compiler-dev-environment.md](../2026-04-04-swift-compiler-dev-environment.md)
- [../2026-04-04-swift-compiler-contributor-learning-guide.md](../2026-04-04-swift-compiler-contributor-learning-guide.md)

### SIL 쪽으로 갈 때
- [../2026-04-04-sil-deep-dive.md](../2026-04-04-sil-deep-dive.md)
- `docs/SIL/SIL.md`
- `docs/SIL/Instructions.md`

### Demangling / ABI 쪽으로 갈 때
- [../2026-04-04-demangling-deep-dive.md](../2026-04-04-demangling-deep-dive.md)
- `docs/ABI/Mangling.rst`
- `docs/ABIStabilityManifesto.md`

### Sema 쪽으로 갈 때
- `docs/TypeChecker.md`
- `docs/Lexicon.md`

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. `test/Availability/availability_suggest_any_apple_os.swift`를 보고 첫 진입 단계를 적기
2. `test/DebugInfo/if-bool-var.swift` 같은 테스트는 왜 경계 단계 사례인지 설명하기
3. `test/SILOptimizer/simplify_cfg.sil`을 보고 첫 관찰 명령을 고르기

---

## 회고 질문

1. 나는 문제를 볼 때 “테스트 경로”를 먼저 보는가, “증상 텍스트”를 먼저 보는가?
2. 잘못된 단계로 들어간 경험이 있었는가? 그때 어떤 신호를 놓쳤는가?
3. 다음부터는 어떤 표식을 기준으로 단계를 더 빨리 분류할 수 있겠는가?

---

## 학습 설계 근거

- 이 랩은 단계별 지식을 “암기 목록”이 아니라 “질문-출력-디렉토리” 매핑으로 익히게 합니다.
- 테스트 경로와 관찰 명령을 연결하는 활동은 transfer를 높이는 대표적 설계입니다.
- 한 단계만 깊게 보게 한 이유는 intrinsic cognitive load를 낮추기 위해서입니다.
- 단계 분류를 먼저 시키고 문서를 나중에 읽게 한 이유는 self-explanation과 retrieval practice를 유도하기 위해서입니다.
- 관련 근거는 [00-curriculum-and-method.md](00-curriculum-and-method.md)를 참고하세요.
