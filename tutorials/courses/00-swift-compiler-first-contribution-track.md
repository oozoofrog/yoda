# Swift 개발자를 위한 Swift 컴파일러 첫 기여 코스

> **대상**: Swift 앱/패키지 개발은 익숙하지만, Swift 컴파일러 내부는 처음인 개발자
> **목표**: 이 코스를 끝내면 **작은 diagnostics / fix-it / validation 변경을 재현·수정·검증하고, 첫 PR 설명까지 준비할 수 있는 수준**에 도달한다.
> **전제**: macOS + Apple Silicon, 로컬에 `swiftlang/swift` 저장소 체크아웃 가능

## 이 문서의 역할

이 문서는 `yoda`의 많은 자료를 대신 읽으라고 만든 문서가 아닙니다.  
반대로, **처음에는 이 문서만 읽고 그대로 따라 하라**고 만든 문서입니다.

처음 기여를 목표로 할 때는 아래를 순서대로만 합니다.

1. 빌드/테스트 루프 확보
2. 출력 관찰 루프 확보
3. 문제 단계 추정
4. 작은 merged 사례 복원
5. open issue 1개 분석
6. 작은 수정 + 좁은 검증
7. PR 설명 준비

처음에는 아래를 하지 않습니다.

- SIL 심화부터 들어가기
- optimizer부터 들어가기
- demangling부터 들어가기
- open issue를 여러 개 동시에 읽기
- 소스 코드를 먼저 넓게 뒤지기

핵심은 **많이 아는 것**이 아니라 **작게 바꾸고, 테스트로 증명하는 것**입니다.

---

## 이 코스를 끝냈을 때의 완료 기준

아래 6개를 만족하면 됩니다.

1. `./utils/build-script`와 `./utils/run-test`로 로컬 루프를 반복할 수 있다.
2. 같은 입력을 AST / SIL / IR로 각각 볼 수 있다.
3. 문제를 보고 `Parse / Sema / SIL / IRGen` 중 어디부터 볼지 추정할 수 있다.
4. merged diagnostics 사례 1개를 parent commit에서 다시 고칠 수 있다.
5. open good first issue 1개에 대해
   - 최소 재현 코드
   - 첫 진입 파일 후보
   - 첫 테스트 후보
   를 적을 수 있다.
6. 작은 diagnostics/fix-it 변경을 로컬에서 검증하고 PR 설명 10줄을 쓸 수 있다.

---

## 준비: 이 코스에서 쓸 기본 경로

이 코스의 모든 명령은 **`swift` 저장소 루트에서 실행**한다고 가정합니다.

```bash
cd /path/to/swiftlang/swift
export SWIFT_REPO=$PWD
export ARCH=$(uname -m)
export PLATFORM=macosx
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-${PLATFORM}-${ARCH}
export SWIFTC_BIN="$BUILD/bin/swiftc"
```

### 시작 전 체크
- `pwd`가 `swift` 저장소 루트인지 확인
- `./utils/build-script`가 존재하는지 확인
- `../llvm-project`가 checkout되어 있는지 확인

### 실패 시 가장 먼저 볼 것
- `pwd`가 정말 `swift` 루트인지
- `utils/update-checkout`을 아직 안 했는지
- `BUILD` 변수에 오타가 없는지

---

## Step 1 — 로컬 빌드와 첫 테스트를 성공시킨다

### 왜 지금 이걸 먼저 하는가
- 컴파일러 학습의 첫 번째 능력은 지식이 아니라 **반복 가능한 루프**입니다.
- 이게 없으면 이후 단계는 전부 구경으로 끝납니다.

### 시작 전 체크
- 아직 빌드를 한 번도 안 했다면 이 Step부터 시작
- 이미 빌드가 있다면 `test -x "$BUILD/bin/swift-frontend"`로 재사용 가능 여부만 확인

### 읽기
- [../01-build-environment-lab.md](../01-build-environment-lab.md)
- [../../2026-04-04-swift-compiler-dev-environment.md](../../2026-04-04-swift-compiler-dev-environment.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/README.md>
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/DevelopmentTips.md>

### 실행 명령

```bash
./utils/update-checkout --clone-with-ssh

./utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$ARCH" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-${PLATFORM}-${ARCH}
export SWIFTC_BIN="$BUILD/bin/swiftc"

test -x "$BUILD/bin/swift-frontend"
./utils/run-test --build-dir "$BUILD" test/SILOptimizer/simplify_cfg.sil
```

### 기대 결과
- `test -x "$BUILD/bin/swift-frontend"`가 조용히 끝남
- `./utils/run-test --build-dir "$BUILD" test/SILOptimizer/simplify_cfg.sil`에서 `PASS:`가 보임

### 실패 시 가장 먼저 볼 것
- `../build/Ninja-RelWithDebInfoAssert/swift-macosx-$ARCH`가 실제로 생성됐는지
- `--swift-darwin-supported-archs "$ARCH"`가 현재 머신과 맞는지
- 첫 빌드가 끝나기 전에 테스트를 돌렸는지
- Xcode/SDK 문제로 실패하면 `xcode-select -p`와 `xcrun --show-sdk-path`가 정상인지

### 남길 산출물
- 내 `BUILD` 경로 1줄
- 첫 성공 테스트 명령 1개
- 빌드/테스트에 걸린 시간 메모

### 다음 단계로 넘어가는 기준
- “나는 지금 내 머신에서 compiler를 다시 빌드하고 test 1개를 돌릴 수 있다”라고 말할 수 있으면 통과

---

## Step 2 — 좁은 테스트 실행 루프를 만든다

### 왜 이 단계가 필요한가
- 실제 기여는 거의 항상 “전체 빌드”가 아니라 **좁은 테스트 → 작은 수정 → 다시 좁은 테스트**로 진행됩니다.
- 이 감각이 없으면 사소한 수정도 너무 크게 느껴집니다.

### 시작 전 체크
- Step 1이 끝나 있어야 함
- `BUILD`와 `SWIFTC_BIN`이 현재 shell에 남아 있어야 함

### 읽기
- [../01-build-environment-lab.md](../01-build-environment-lab.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/Testing.md>

### 실행 명령

```bash
./utils/run-test --build-dir "$BUILD" test/Parse/invalid_ternary_expr.swift
./utils/run-test --build-dir "$BUILD" test/Availability/availability_suggest_any_apple_os.swift
./utils/run-test --build-dir "$BUILD" test/SILOptimizer/simplify_cfg.sil
```

### 기대 결과
- Parse / Sema-ish / SILOptimizer 계열 테스트를 각각 1개씩 성공시킴
- 테스트 경로만 보고도 “이건 어느 단계 문제인가”라는 감이 조금 생김

### 실패 시 가장 먼저 볼 것
- 테스트 경로 오타 여부
- `BUILD`가 실제 빌드 디렉토리인지
- 이전 빌드가 중간에 실패했는데 `swift-frontend`만 남아 있는 상태가 아닌지

### 남길 산출물
- 내가 자주 쓸 기본 테스트 명령 3개
- 아래 한 줄 메모
  - `test/Parse/...`를 보면 어디부터 연다
  - `test/Availability/...`를 보면 어디부터 연다
  - `test/SILOptimizer/...`를 보면 어디부터 연다

### 다음 단계로 넘어가는 기준
- 테스트 경로를 보고 Parse / Sema / SIL 쪽을 대략 구분할 수 있으면 통과

---

## Step 3 — 같은 입력을 AST / SIL / IR로 본다

### 왜 이 단계가 먼저인가
- 코드를 읽기 전에 **출력이 어떻게 달라지는지**를 먼저 보는 편이 훨씬 빠릅니다.
- 초보자가 가장 빨리 얻어야 할 감각은 “이 현상은 어디까지 내려갔나?”입니다.

### 시작 전 체크
- `SWIFTC_BIN`이 설정되어 있어야 함

### 읽기
- [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)

### 실행 명령

```bash
cat >/tmp/yoda-step3.swift <<'SWIFT'
func add(_ a: Int, _ b: Int) -> Int { a + b }
SWIFT

"$SWIFTC_BIN" -dump-ast /tmp/yoda-step3.swift > /tmp/yoda-step3.ast
"$SWIFTC_BIN" -emit-silgen /tmp/yoda-step3.swift > /tmp/yoda-step3.silgen
"$SWIFTC_BIN" -emit-sil -O /tmp/yoda-step3.swift > /tmp/yoda-step3.sil
"$SWIFTC_BIN" -emit-ir -O /tmp/yoda-step3.swift > /tmp/yoda-step3.ll

sed -n '1,80p' /tmp/yoda-step3.ast
sed -n '1,80p' /tmp/yoda-step3.silgen
sed -n '1,120p' /tmp/yoda-step3.sil
sed -n '1,120p' /tmp/yoda-step3.ll
```

### 기대 결과
- AST / SILGen / Optimized SIL / LLVM IR의 출력 모양이 명확히 다름
- 같은 `add` 함수가 단계별로 다른 관점에서 보임

### 실패 시 가장 먼저 볼 것
- `SWIFTC_BIN`이 실제로 존재하는지
- 출력 파일이 비어 있지 않은지
- `-emit-ir -O`에서 시스템 툴체인 문제로 실패하면 Step 1 빌드 상태를 다시 확인

### 남길 산출물
- 아래 두 문장을 내 말로 채움
  - AST는 주로 ______를 본다.
  - SIL은 주로 ______를 본다.
  - IR은 주로 ______를 본다.

### 다음 단계로 넘어가는 기준
- “이 문제는 parser에서 끝난 건지, type checking을 거친 건지, 최적화 이후까지 간 건지”를 말할 수 있으면 통과

---

## Step 4 — 문제를 보고 어느 단계부터 볼지 추정한다

### 왜 이 단계가 핵심인가
- 초보자는 보통 문제를 보면 바로 소스를 넓게 엽니다.
- 하지만 실제로는 **어느 단계 문제인지 먼저 맞히는 능력**이 첫 기여에서 가장 중요합니다.

### 읽기
- [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)
- [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)

### 실행 과제
아래 셋을 각각 보고 첫 진입 단계를 적습니다.

```text
1) parse error 1개
2) diagnostics/fix-it 문제 1개
3) SIL/optimizer 문제 1개
```

추천 입력:
- Parse: `test/Parse/invalid_ternary_expr.swift`
- Diagnostics: `test/Availability/availability_suggest_any_apple_os.swift`
- Optimizer: `test/SILOptimizer/simplify_cfg.sil`

### 기대 결과
- 각 문제에 대해 `Parse / Sema / SIL / IRGen` 중 하나를 먼저 떠올릴 수 있음

### 실패 시 가장 먼저 볼 것
- 문제의 “증상”이 아니라 “검증 방법”을 보고 있는지
- 테스트 디렉토리를 무시하고 바로 코드만 열고 있지 않은지

### 남길 산출물
- 각 문제별 2줄 메모
  - 내가 먼저 볼 단계
  - 그 이유

### 다음 단계로 넘어가는 기준
- 테스트 경로와 증상을 보고 **첫 진입 단계 하나**를 고를 수 있으면 통과

---

## Step 5 — LLDB로 컴파일러를 한 번 실제로 연다

### 왜 필요한가
- 기여 수준에 도달하려면 컴파일러를 “문서”가 아니라 **디버깅 가능한 프로그램**으로 인식해야 합니다.
- 이 Step의 목표는 화려한 디버깅이 아니라, **컴파일러 프로세스에 들어가 보는 것**입니다.

### 시작 전 체크
- Step 1이 끝나 있어야 함
- `swift-frontend` 바이너리가 존재해야 함

### 읽기
- [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/DebuggingTheCompiler.md>

### 실행 명령

```bash
cat >/tmp/yoda-step5.swift <<'SWIFT'
func demo() {
  let x: Int = "hello"
}
SWIFT

lldb -- "$BUILD/bin/swift-frontend" -- -frontend -typecheck /tmp/yoda-step5.swift
```

LLDB 안에서:

```lldb
(lldb) process launch --stop-at-entry
(lldb) bt
(lldb) continue
```

### 기대 결과
- 프로세스 시작 직후 한 번 멈춤
- `bt`에서 `swift-frontend` 백트레이스를 볼 수 있음
- `continue` 후 타입 오류가 출력되고 종료됨

### 실패 시 가장 먼저 볼 것
- `lldb`가 설치되어 있는지
- `"$BUILD/bin/swift-frontend"` 경로가 맞는지
- `process launch --stop-at-entry`를 `run`과 헷갈리지 않았는지

### 남길 산출물
- 내가 가장 자주 쓸 LLDB 명령 3개
- 컴파일러를 디버깅 가능한 프로그램으로 봤다는 짧은 메모 2줄

### 다음 단계로 넘어가는 기준
- LLDB로 compiler process를 한 번 열고 backtrace를 읽어봤다면 통과

---

## Step 6 — 가장 쉬운 merged 사례를 parent commit에서 다시 고친다

### 왜 diagnostics 사례부터 시작하는가
처음 기여 목표라면 optimizer나 IRGen이 아니라 **Sema diagnostics / fix-it**이 가장 좋습니다.

이유:
- 재현이 쉽고
- 테스트가 선명하고
- 수정 범위가 작고
- 기여 가치가 높기 때문입니다.

### 선택할 사례
- [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)

### 시작 전 체크
- Step 1~5가 끝나 있어야 함
- worktree를 한 번도 안 써봤다면 [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)를 먼저 다시 읽기

### 실행 명령

```bash
cd "$SWIFT_REPO"
export COURSE_ROOT="$(cd .. && pwd)"
mkdir -p "$COURSE_ROOT/worktrees"

git worktree add "$COURSE_ROOT/worktrees/sema-fixit-source-locs" dd03302d7b71dc2c60f87daa1f00eb632ed9ada2
cd "$COURSE_ROOT/worktrees/sema-fixit-source-locs"

./utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
./utils/run-test --build-dir "$BUILD" test/Availability/availability_suggest_any_apple_os.swift
```

### 기대 결과
- parent commit 상태에서 해당 테스트가 실패하거나, 문서에서 설명한 잘못된 fix-it 범위를 재현할 수 있음

### 실패 시 가장 먼저 볼 것
- worktree 위치를 `swift` 저장소 바깥으로 만들고 있는지
- `BUILD`를 main checkout의 빌드와 혼동하고 있지 않은지
- 테스트 이름 오타가 없는지

### 남길 산출물
- parent commit SHA
- 재현 명령 1개
- 실패 증상 3줄

### 다음 단계로 넘어가는 기준
- “정답이 있는 작은 사례 1개를 내 손으로 재현했다”라고 말할 수 있으면 통과

---

## Step 7 — 테스트를 먼저 읽는 습관을 만든다

### 왜 별도 단계로 두는가
- 초보자는 보통 코드부터 읽습니다.
- 하지만 Swift 컴파일러 기여에서는 **테스트가 명세**인 경우가 많습니다.

### 읽기
- Step 6 사례 문서 재복습
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/Testing.md>

### 실행 명령

```bash
cd "$COURSE_ROOT/worktrees/sema-fixit-source-locs"
sed -n '1,220p' test/Availability/availability_suggest_any_apple_os.swift
```

### 기대 결과
- 테스트가 무엇을 기대하는지 말로 설명할 수 있음
- 특히 어떤 fix-it 범위가 잘못되었는지 체크 라인을 눈으로 읽을 수 있음

### 실패 시 가장 먼저 볼 것
- 테스트를 “코드”로만 보고 `RUN:` / `CHECK:`를 읽지 않았는지
- 실패 증상과 체크 라인이 정확히 연결되는지

### 남길 산출물
- 아래 문장 완성
  - 이 테스트는 ______를 깨지 않게 막는다.
  - 내가 고치려는 것은 ______가 아니라 ______다.

### 다음 단계로 넘어가는 기준
- 테스트를 보고 수정 의도를 역으로 설명할 수 있으면 통과

---

## Step 8 — diagnostics/fix-it 문제의 전형을 익힌다

### 왜 이 단계가 필요한가
- 첫 open issue를 고르기 전에, 초보자에게 안전한 문제 유형 3개를 먼저 봐야 합니다.
- 이 Step의 목적은 많은 문제를 보는 것이 아니라 **문제 유형에 이름을 붙이는 것**입니다.

### 읽기
- [../good-first-issues/cards/01-static-member-instance-diagnostic.md](../good-first-issues/cards/01-static-member-instance-diagnostic.md)
- [../good-first-issues/cards/03-opaque-property-fixit.md](../good-first-issues/cards/03-opaque-property-fixit.md)
- [../good-first-issues/cards/06-dynamicmemberlookup-fixits.md](../good-first-issues/cards/06-dynamicmemberlookup-fixits.md)

### 실행 과제
각 카드에 대해 아래를 한 줄씩 적습니다.

```text
- 최소 재현:
- 첫 진입 파일 후보:
- 첫 테스트 후보:
- 예상 수정 유형:
```

### 기대 결과
- wording 개선 / fix-it 추가 / attribute validation 문제를 구분할 수 있음

### 실패 시 가장 먼저 볼 것
- “문제의 구현”을 먼저 찾으려 하지 않았는지
- 카드에 있는 `repo test candidate`를 건너뛰지 않았는지

### 남길 산출물
- 세 카드 각각에 대한 4줄 메모

### 다음 단계로 넘어가는 기준
- diagnostics/fix-it 문제를 봤을 때 “어떤 종류인지” 이름 붙일 수 있으면 통과

---

## Step 9 — 첫 open issue는 하나만 고른다

### 규칙
- 절대로 여러 개를 동시에 고르지 않습니다.
- 첫 기여 목표라면 아래 중 하나만 고릅니다.
  - wording 개선
  - note 추가
  - fix-it 추가
  - duplicate diagnostics suppression

### 기본 추천 issue
첫 시도는 아래 하나로 고정합니다.

- `#48759` — static member diagnostics wording

대체 후보는 아래 순서입니다.
- `#77835`
- `#87324`
- `#85882`

### 읽기
- [../06-good-first-issues-swift-6.0-6.3.md](../06-good-first-issues-swift-6.0-6.3.md)
- [../good-first-issues/README.md](../good-first-issues/README.md)
- 기본 카드: [../good-first-issues/cards/01-static-member-instance-diagnostic.md](../good-first-issues/cards/01-static-member-instance-diagnostic.md)

### 실행 과제
- 오늘은 issue를 하나만 확정하고, 다른 카드는 닫습니다.

### 기대 결과
- “이번에 내가 파고들 첫 issue는 이것”이라고 확정할 수 있음

### 실패 시 가장 먼저 볼 것
- modern feature가 재밌어 보여도 난이도가 높아지지 않는지
- 동시에 2개 이상 열어두지 않았는지

### 남길 산출물
- 선택한 issue 번호 1개
- 왜 이 issue를 골랐는지 3줄

### 다음 단계로 넘어가는 기준
- 이번에 파고들 issue 1개가 확정되면 통과

---

## Step 10 — 워크북으로 open issue를 해부한다

### 왜 이 단계가 중요한가
- open issue는 정답이 없습니다.
- 그래서 “해결”보다 먼저 **탐색 계획을 쓰는 능력**이 필요합니다.

### 읽기
- [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)
- [../open-issue-templates/analysis-template.md](../open-issue-templates/analysis-template.md)

### 실행 명령
기본 issue `#48759` 기준:

```bash
cat >/tmp/gfi-48759.swift <<'SWIFT'
struct HasStatic {
    func foo() {
        print(cvar)
    }
    static let cvar = 123
}
SWIFT

"$SWIFTC_BIN" /tmp/gfi-48759.swift
rg "could_not_use_type_member_on_instance|static member" include/swift/AST/DiagnosticsSema.def lib/Sema/CSDiagnostics.cpp
sed -n '1,220p' test/Constraints/members.swift
```

### 기대 결과
- 재현 코드가 손에 들어옴
- 진입 파일 후보를 최소 2개로 줄일 수 있음
- 관련 테스트 후보 1개 이상을 실제로 열어봄

### 실패 시 가장 먼저 볼 것
- 재현 코드를 issue 본문보다 더 크게 만들고 있지 않은지
- `rg` 검색어를 너무 넓게 잡지 않았는지
- 테스트 후보를 열지 않고 바로 코드부터 바꾸려 하지 않는지

### 남길 산출물
아래 템플릿을 채웁니다.

```text
- 이슈 번호:
- 재현 코드:
- 추정 단계:
- 첫 진입 파일 후보 3개:
- 첫 테스트 후보 3개:
- 예상 수정 유형:
```

### 다음 단계로 넘어가는 기준
- issue를 읽고 막막해하지 않고, 첫 탐색 계획을 적을 수 있으면 통과

---

## Step 11 — 테스트를 먼저 만들거나 기존 테스트에 붙인다

### 왜 중요한가
- Swift 컴파일러 기여는 “코드를 고쳤다”보다 **테스트로 증명했다**가 더 중요합니다.

### 실행 과제
선택한 issue에 대해 아래 둘 중 하나를 고릅니다.

```text
1) 기존 테스트 파일에 새 케이스를 붙인다.
2) 같은 디렉토리에 새 테스트 파일을 만든다.
```

기본 issue `#48759` 기준으로는 먼저 기존 테스트를 읽는 쪽이 안전합니다.

```bash
sed -n '1,260p' test/Constraints/members.swift
```

### 기대 결과
- “가장 좁은 테스트가 무엇인지”를 한 문장으로 말할 수 있음

### 실패 시 가장 먼저 볼 것
- 새 파일을 만들고 싶은 충동 때문에 기존 테스트를 아직 안 읽었는지
- 같은 디렉토리의 기존 테스트 관례를 무시하고 있지 않은지

### 남길 산출물
- 가장 좁은 테스트 경로 1개
- 그 테스트가 검증할 체크 포인트 2줄

### 다음 단계로 넘어가는 기준
- “이 변경을 검증하는 가장 좁은 테스트”를 1개 말할 수 있으면 통과

---

## Step 12 — 작은 로컬 수정, 좁은 검증, 인접 회귀 확인

### 왜 이 순서를 고정하는가
- 첫 기여에서 가장 큰 실수는 **변경 범위를 너무 넓히는 것**입니다.
- 따라서 항상 아래 순서로만 갑니다.

### 실행 순서
1. 작은 수정 1개
2. 가장 좁은 테스트 1개 통과
3. 인접 테스트 몇 개 더 통과
4. 불필요한 범위 확장 금지

### 실행 명령 템플릿

```bash
ninja -C "$BUILD" bin/swift-frontend
./utils/run-test --build-dir "$BUILD" test/Constraints/members.swift
```

필요하면 인접 테스트를 하나 더 봅니다.

```bash
./utils/run-test --build-dir "$BUILD" test/attr/attr_dynamic_member_lookup.swift
```

### 기대 결과
- 수정 직후 가장 좁은 테스트가 먼저 통과함
- 인접 테스트를 한두 개 더 확인해도 이상이 없음

### 실패 시 가장 먼저 볼 것
- 너무 많은 파일을 한 번에 바꾸지 않았는지
- `ninja` 없이 예전 바이너리를 재사용하고 있지 않은지
- 테스트 실패가 원인 미해결인지, 다른 회귀인지 구분하고 있는지

### 남길 산출물
- 수정 파일 목록
- 가장 좁은 검증 명령
- 인접 검증 명령
- 왜 이 범위만 바꿨는지 3줄

### 다음 단계로 넘어가는 기준
- “작은 수정 1개를 테스트와 함께 설명”할 수 있으면, 이미 첫 기여 직전입니다.

---

## Step 13 — PR 전 체크리스트를 통과한다

### 반드시 확인할 것
- 재현 코드가 작다
- 테스트가 있다
- 변경 범위가 작다
- 설명이 diagnostics/fix-it 목적에 맞다
- 인접 테스트도 최소한 확인했다

### 읽기
- [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/CONTRIBUTING.md>

### 실행 과제
아래 5문장을 10줄 이내로 채웁니다.

```text
- 문제는 무엇이었나?
- 왜 이 파일을 고쳤나?
- 가장 좁은 테스트는 무엇이었나?
- 인접 회귀는 어떻게 확인했나?
- 이 변경은 왜 작은가?
```

### 기대 결과
- PR description 초안이 거의 준비됨

### 실패 시 가장 먼저 볼 것
- “왜 이 범위만 바꿨는가”를 설명 못하고 있지 않은지
- 테스트와 문제의 연결을 문장으로 못 쓰고 있지 않은지

### 남길 산출물
- 10줄 PR 설명 초안

### 완료 조건
- 내가 왜 이 변경을 했고, 어떻게 검증했는지 10줄 이내로 설명 가능하면 통과

---

## 이 순서가 최적인 이유

이 순서는 “넓게 아는 순서”가 아니라 **처음 기여 성공 확률이 가장 높은 순서**입니다.

1. **빌드/테스트 루프가 먼저**
   - 루프가 없으면 모든 학습이 구경이 됩니다.
2. **출력 관찰이 코드 읽기보다 먼저**
   - AST / SIL / IR를 먼저 보면 소스 읽기가 훨씬 빨라집니다.
3. **단계 추정이 상세 internals보다 먼저**
   - 첫 기여에서 가장 중요한 것은 정확한 진입점 추정입니다.
4. **merged 사례가 open issue보다 먼저**
   - 정답이 있는 작은 사례로 사고 루프를 먼저 익혀야 합니다.
5. **diagnostics/fix-it이 optimizer보다 먼저**
   - 첫 기여 성공 확률과 검증 선명도가 가장 높기 때문입니다.
6. **테스트가 코드보다 먼저**
   - 컴파일러 기여에서는 테스트가 명세인 경우가 많습니다.

---

## 딱 하나만 기억할 것

Swift를 이미 아는 초보자가 Swift 컴파일러에 처음 기여하려면,
처음부터 SIL/optimizer를 파는 것이 아니라

**빌드 → 테스트 → 관찰 → 단계 추정 → 작은 diagnostics 사례 복원 → open issue 1개 분석 → 작은 수정 + 테스트 → PR 설명**

이 순서로 가야 합니다.

이 코스는 바로 그 순서를 고정한 문서입니다.
