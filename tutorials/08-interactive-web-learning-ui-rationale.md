# 개인용 학습 웹 UI 설계 메모

> **대상**: `yoda` 문서를 웹으로 소비하는 학습자와 향후 UI를 확장할 기여자
> **목표**: 왜 서비스형 UI를 버리고 개인용 2단 리더 구조를 택했는지 기록한다.
> **전제**: 정적 GitHub Pages 배포와 localStorage 기반 진행 상태 저장을 기본으로 한다.

## 빠른 시작

- 기본 구조는 **좌측 전체 목차 / 우측 현재 문서 내용**의 2단 리더다.
- 문서 간 이동, 현재 문서 목차, 개인 메모만 남긴다.
- 이유는 `yoda`가 서비스가 아니라 **개인이 조용히 오래 읽고 메모하는 학습 저장소**이기 때문이다.

## 왜 Coursera식 구조를 버렸는가

`yoda`는 강의 플랫폼이 아니라 개인 학습용 문서 모음이다.

초기에는 Coursera식 3열 구조를 시도했지만, 실제로는 아래 문제가 있었다.

- 문서보다 UI 장치가 더 눈에 띄었다.
- progress, mastery, recommendation 같은 요소가 서비스처럼 보였다.
- 깊게 읽고 메모하는 흐름보다 “관리당하는 느낌”이 강해졌다.

그래서 최종적으로는 **문서 읽기 자체를 방해하지 않는 2단 리더**가 더 적합하다고 판단했다.

## 현재 구조에서 남긴 것

최소한으로 남긴 기능은 아래뿐이다.

- 좌측에서 전체 문서를 **순서대로 고르는 일**
- 우측에서 현재 문서를 **길게 읽는 일**
- 현재 문서 안의 heading으로 **바로 이동하는 일**
- 각 문서마다 개인 메모를 남기는 일

즉, 학습의 중심을 UI가 아니라 **문서와 메모**에 둔다.

## 왜 이런 단순화가 필요한가

문서 학습에서는 “기능이 많다”가 항상 좋은 것이 아니다.

특히 개인 학습에서는 다음이 더 중요하다.

- UI가 아니라 내용이 전면에 오는가
- 읽다가 바로 메모할 수 있는가
- 전체 문서를 한눈에 훑고 순서대로 읽을 수 있는가
- 다음 페이지를 추천받는 대신, **내가 스스로 순서를 선택**할 수 있는가

## 결론

현재 `yoda`에 가장 맞는 방식은 **개인용 2단 문서 리더**다.

- 좌측: 전체 목차
- 우측: 현재 문서 내용
- 하단: 개인 메모

서비스형 장치보다, 조용히 읽고 반복해서 참고하는 흐름이 더 중요하다.

## 참고 링크

- Coursera course pages and quality reports
  - https://www.coursera.org/learn/measuring-total-data-quality
  - https://about.coursera.org/press/wp-content/uploads/2020/10/Coursera_DriversOfQuality_Book_MCR-1126-V4-lr.pdf
  - https://about.coursera.org/press/wp-content/uploads/2022/05/Courseras-Drivers-of-Retention-in-Online-Degree-Programs-Report-1.pdf
- Codecademy practice and assessment docs
  - https://www.codecademy.com/learn/introduction-to-javascript/
  - https://help.codecademy.com/hc/en-us/articles/15373426748187-Quizzes-Assessments-and-Exams-What-s-the-Difference
  - https://help.codecademy.com/hc/en-us/articles/360033903793-Practice-Packs
- Khan Academy mastery / consistency
  - https://support.khanacademy.org/hc/en-us/articles/360030753412
  - https://blog.khanacademy.org/get-motivated-to-learn-with-khan-academys-new-streaks-and-levels-features/
  - https://blog.khanacademy.org/three-research-backed-strategies-teachers-can-implement-on-khan-academy-to-boost-student-learning-outcomes/
- Duolingo habit / review / methodology
  - https://blog.duolingo.com/putting-in-work-the-habit-of-language-learning/
  - https://blog.duolingo.com/guide-to-duolingo-practice-hub/
  - https://blog.duolingo.com/improving-the-streak/
  - https://blog.duolingo.com/duolingo-teaching-method/
- 학습과학 배경
  - https://journals.sagepub.com/doi/pdf/10.1111/j.1467-9280.2006.01693.x
  - https://pubmed.ncbi.nlm.nih.gov/16719566/
  - https://csi.asu.edu/wp-content/uploads/2018/01/Wylie_Chi_SelfExplanation.pdf
  - https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html/comment-page-1
