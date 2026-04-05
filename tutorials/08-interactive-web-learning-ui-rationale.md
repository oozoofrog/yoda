# 인터랙티브 학습 웹 UI 설계 메모

> **대상**: `yoda` 문서를 웹으로 소비하는 학습자와 향후 UI를 확장할 기여자
> **목표**: 왜 현재 웹앱이 `Coursera 하이브리드` 구조를 택했는지 기록한다.
> **전제**: 정적 GitHub Pages 배포와 localStorage 기반 진행 상태 저장을 기본으로 한다.

## 빠른 시작

- 기본 구조는 **Coursera식 3열 코스 레이아웃**이다.
- 하지만 그대로 복제하지 않고 아래 요소를 섞는다.
  - **Codecademy식**: practice card, step-by-step exercise framing
  - **Khan식**: mastery / consistency / chunking
  - **Duolingo식**: 1·3·7일 복습 재노출, lightweight streak
- 이유는 `yoda`가 “짧게 맛보는 자료”가 아니라 **오래, 많이, 반복해서 배우는 저장소**이기 때문이다.

## 왜 Coursera 골격인가

`yoda`의 문서는 코스·사례·레퍼런스가 함께 존재한다. 따라서 다음이 중요하다.

1. 현재 내가 **어느 트랙에 있는지** 보이는 것
2. 지금 보고 있는 문서가 전체 학습 흐름에서 **어디쯤인지** 보이는 것
3. 문서 읽기와 실습 체크, 다음 문서 추천이 **같은 화면에서 이어지는 것**

이 점에서 Coursera식 구조는 다음 장점이 있다.

- 좌측 syllabus가 커다란 라이브러리에서도 길을 잃지 않게 한다.
- 중앙 lesson이 긴 문서를 차분하게 소비하게 한다.
- 우측 progress와 next recommendation이 코스 진행 감각을 유지하게 한다.

## 왜 다른 플랫폼 요소를 섞는가

### Codecademy에서 가져온 것
- 읽기만 하지 않고 **바로 손을 움직이는 작은 과제 카드**
- 명령 복사, 테스트 후보 체크, 진입 파일 확인 같은 작은 완료 단위

`yoda`는 실제 컴파일러 학습이므로, “읽음”만으로는 부족하다. 따라서 practice card가 필수다.

### Khan Academy에서 가져온 것
- **mastery 상태**를 완료와 분리
- 최근 7일 일관성, 작은 단위의 누적 진행률 표시

컴파일러 학습은 한 번 읽고 끝나는 지식이 아니라, 설명 가능 / 재현 가능 / 혼자 다시 찾기 단계로 올라가야 하기 때문이다.

### Duolingo에서 가져온 것
- 1일 / 3일 / 7일 복습 재노출
- 가벼운 streak-lite

문서가 많을수록 핵심은 더 많이 읽는 것이 아니라 **다시 돌아오는 구조**를 만드는 것이다.

## 대안 비교

### 순수 Coursera 복제
장점:
- 안정적이고 익숙하다.
- 긴 코스를 소비하기 좋다.

단점:
- practice와 review가 약하면 `yoda`의 카드/사례 학습과 잘 맞지 않는다.

### 순수 Codecademy형
장점:
- 바로 손이 움직인다.
- 실습 중심 학습에 강하다.

단점:
- `yoda`처럼 긴 설명 문서와 깊은 사례 복원을 담기 어렵다.

### 순수 Khan/ Duolingo형
장점:
- 복습과 동기 유지에 강하다.

단점:
- 컴파일러 문서처럼 긴 읽기 자료, 코드 맥락, 링크 탐색에는 덜 적합하다.

## 결론

현재 `yoda`에 가장 맞는 방식은 아래다.

- **기본 탐색과 진행 구조는 Coursera**
- **실습 단위는 Codecademy**
- **숙련도와 일관성 표시는 Khan**
- **복습 재노출은 Duolingo**

즉, `Coursera 하이브리드`가 가장 적합하다.

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
