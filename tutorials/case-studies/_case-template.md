# 사례 N — <짧은 제목>

> **단계**: <Sema / SILGen / SIL / IRGen / ...>
> **난이도**: <하 / 중 / 상>
> **merged fix commit**: `<sha>`
> **parent commit**: `<sha>`
> **anchor PR / issue**: <URL>
> **핵심 파일**: `<path1>`, `<path2>`
> **핵심 테스트**: `<test-path>`

---

## 이 사례의 교육적 포인트

- 왜 이 사례를 선택했는가
- 어떤 종류의 사고를 훈련하는가
- 어떤 경계/함정이 드러나는가

---

## 학습 목표

- 
- 
- 

---

## 사전 회상 질문

1. 
2. 
3. 

---

## 문제 맥락

- issue / PR 본문 요약
- 사용자가 겪은 증상
- 왜 이 문제가 중요한가

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/<case-name>

git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" <parent-commit>
cd "$CASE_ROOT"
```

---

## 1단계 — 실패 재현

```bash
utils/run-test --build-dir $BUILD <test-path>
```

### 무엇을 볼 것인가
- 

---

## 2단계 — 테스트에서 구현으로 역추적

```bash
rg "<keyword>" <directories>
```

### self-explanation
- 왜 이 단계라고 판단했는가?
- 왜 이 파일을 첫 진입점으로 골랐는가?

---

## 3단계 — 핵심 원인 가설

- 
- 

---

## 4단계 — 최소 수정

- 어떤 종류의 수정이 필요한가
- 왜 이 수정이 최소 수정인가

---

## 5단계 — 좁은 검증

```bash
utils/run-test --build-dir $BUILD <narrow-test>
utils/run-test --build-dir $BUILD <adjacent-test>
```

---

## 6단계 — merged fix와 비교

```bash
git diff <parent>..<fix-commit> -- <paths>
```

비교 질문:
- 
- 
- 

---

## 독립 전이 과제

1. 
2. 
3. 

---

## 회고 질문

1. 
2. 
3. 

---

## 학습 설계 근거

- retrieval practice:
- self-explanation:
- worked example / fading:
- transfer:
