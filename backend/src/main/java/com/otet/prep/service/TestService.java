package com.otet.prep.service;

import com.otet.prep.model.dto.*;
import com.otet.prep.model.entity.*;
import com.otet.prep.repository.QuestionRepository;
import com.otet.prep.repository.TestAttemptRepository;
import com.otet.prep.repository.TestPaperRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestService {

    private final TestPaperRepository testPaperRepository;
    private final QuestionRepository questionRepository;
    private final TestAttemptRepository testAttemptRepository;

    public TestService(TestPaperRepository testPaperRepository,
                       QuestionRepository questionRepository,
                       TestAttemptRepository testAttemptRepository) {
        this.testPaperRepository = testPaperRepository;
        this.questionRepository = questionRepository;
        this.testAttemptRepository = testAttemptRepository;
    }

    @Transactional(readOnly = true)
    public List<TestPaperSummaryDTO> getAllTestPapers() {
        return testPaperRepository.findAll().stream()
                .map(p -> new TestPaperSummaryDTO(
                        p.getId(),
                        p.getPaperCode(),
                        p.getTitle(),
                        p.getDescription(),
                        p.getTargetClass(),
                        p.getDurationMinutes(),
                        p.getTotalQuestions() > 0 ? p.getTotalQuestions() : (p.getQuestions() != null ? p.getQuestions().size() : 150)
                ))
                .toList();
    }

    @Transactional
    public StartTestResponseDTO startOrResumeTest(String paperCode, StartTestRequestDTO req) {
        TestPaper paper = testPaperRepository.findByPaperCode(paperCode)
                .orElseThrow(() -> new IllegalArgumentException("Test paper not found: " + paperCode));

        String email = (req != null && req.getCandidateEmail() != null && !req.getCandidateEmail().isBlank())
                ? req.getCandidateEmail().trim().toLowerCase() : "guest@otet.edu";
        String name = (req != null && req.getCandidateName() != null && !req.getCandidateName().isBlank())
                ? req.getCandidateName().trim() : "Candidate";

        // Check if there is an existing in-progress attempt that hasn't expired
        Optional<TestAttempt> existing = testAttemptRepository
                .findTopByCandidateEmailAndStatusOrderByStartTimeDesc(email, "IN_PROGRESS");

        TestAttempt attempt;
        if (existing.isPresent() && existing.get().getTestPaper().getPaperCode().equals(paperCode)) {
            attempt = existing.get();
            attempt.setLastActiveTime(LocalDateTime.now());
        } else {
            attempt = new TestAttempt();
            attempt.setTestPaper(paper);
            attempt.setCandidateEmail(email);
            attempt.setCandidateName(name);
            attempt.setStatus("IN_PROGRESS");
            attempt.setStartTime(LocalDateTime.now());
            attempt.setLastActiveTime(LocalDateTime.now());
            attempt.setRemainingSeconds(paper.getDurationMinutes() * 60);
            attempt.setCurrentQuestionIndex(0);
            attempt = testAttemptRepository.save(attempt);
        }

        // Fetch questions without answers
        List<QuestionResponseDTO> questions = getQuestionsForPaper(paperCode);

        // Map existing saved answers if resuming
        Map<Long, Integer> savedAnswers = new HashMap<>();
        if (attempt.getAnswers() != null) {
            for (UserAnswer a : attempt.getAnswers()) {
                if (a.getSelectedOptionIndex() != null) {
                    savedAnswers.put(a.getQuestionId(), a.getSelectedOptionIndex());
                }
            }
        }

        StartTestResponseDTO resp = new StartTestResponseDTO();
        resp.setAttemptId(attempt.getId());
        resp.setPaperCode(paper.getPaperCode());
        resp.setPaperTitle(paper.getTitle());
        resp.setDurationMinutes(paper.getDurationMinutes());
        resp.setRemainingSeconds(attempt.getRemainingSeconds());
        resp.setCurrentQuestionIndex(attempt.getCurrentQuestionIndex());
        resp.setStatus(attempt.getStatus());
        resp.setSavedAnswers(savedAnswers);
        resp.setQuestions(questions);

        return resp;
    }

    @Transactional
    public Map<String, Object> autosaveAttempt(Long attemptId, AutosaveRequestDTO req) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return Map.of("status", "LOCKED", "message", "Attempt is already submitted or closed.");
        }

        attempt.setRemainingSeconds(Math.max(0, req.getRemainingSeconds()));
        attempt.setCurrentQuestionIndex(req.getCurrentQuestionIndex());
        attempt.setLastActiveTime(LocalDateTime.now());

        if (req.getAnswers() != null) {
            Map<Long, UserAnswer> existingAnswersMap = attempt.getAnswers().stream()
                    .collect(Collectors.toMap(UserAnswer::getQuestionId, a -> a, (a1, a2) -> a1));

            for (Map.Entry<Long, Integer> entry : req.getAnswers().entrySet()) {
                Long qId = entry.getKey();
                Integer selectedOpt = entry.getValue();

                if (existingAnswersMap.containsKey(qId)) {
                    existingAnswersMap.get(qId).setSelectedOptionIndex(selectedOpt);
                } else {
                    UserAnswer ans = new UserAnswer(attempt, qId, selectedOpt, false);
                    attempt.getAnswers().add(ans);
                }
            }
        }

        testAttemptRepository.save(attempt);

        return Map.of(
                "status", "SAVED",
                "attemptId", attempt.getId(),
                "remainingSeconds", attempt.getRemainingSeconds(),
                "savedAnswersCount", attempt.getAnswers().size()
        );
    }

    @Transactional
    public TestResultDTO submitAttempt(Long attemptId, SubmitTestRequestDTO request) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));

        TestPaper paper = attempt.getTestPaper();
        List<Question> questions = questionRepository.findByTestPaperIdOrderByQuestionNumberAsc(paper.getId());

        Map<Long, Integer> submittedAnswers = (request != null && request.getAnswers() != null)
                ? request.getAnswers() : new HashMap<>();

        // If answers were saved in attempt earlier, merge them
        for (UserAnswer prev : attempt.getAnswers()) {
            if (prev.getSelectedOptionIndex() != null && !submittedAnswers.containsKey(prev.getQuestionId())) {
                submittedAnswers.put(prev.getQuestionId(), prev.getSelectedOptionIndex());
            }
        }

        int score = 0;
        int correctCount = 0;
        int wrongCount = 0;
        int skippedCount = 0;

        Map<String, int[]> subjectCounts = new LinkedHashMap<>(); // subject -> [total, correct]
        List<TestResultDTO.QuestionReviewDTO> reviews = new ArrayList<>();
        attempt.getAnswers().clear();

        for (Question q : questions) {
            subjectCounts.putIfAbsent(q.getSubject(), new int[]{0, 0});
            subjectCounts.get(q.getSubject())[0]++;

            Integer selected = submittedAnswers.get(q.getId());
            boolean isCorrect = false;

            if (selected == null) {
                skippedCount++;
            } else if (selected == q.getCorrectOptionIndex()) {
                score++;
                correctCount++;
                isCorrect = true;
                subjectCounts.get(q.getSubject())[1]++;
            } else {
                wrongCount++;
            }

            UserAnswer answerRecord = new UserAnswer(attempt, q.getId(), selected, isCorrect);
            attempt.getAnswers().add(answerRecord);

            reviews.add(new TestResultDTO.QuestionReviewDTO(
                    q.getId(),
                    q.getQuestionNumber(),
                    q.getSubject(),
                    selected,
                    q.getCorrectOptionIndex(),
                    isCorrect,
                    q.getExplanation()
            ));
        }

        double percentage = questions.isEmpty() ? 0.0 : ((double) score / questions.size()) * 100.0;
        boolean passed = percentage >= 60.0;

        // Generate Diagnostic Analysis of Weak Areas
        StringBuilder diag = new StringBuilder();
        List<String> weakSubjects = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : subjectCounts.entrySet()) {
            int tot = entry.getValue()[0];
            int cor = entry.getValue()[1];
            double p = tot == 0 ? 0 : ((double) cor / tot) * 100.0;
            if (p < 55.0) {
                weakSubjects.add(entry.getKey() + " (" + Math.round(p) + "%)");
            }
        }

        if (weakSubjects.isEmpty()) {
            diag.append("Balanced performance across all domains. Maintain test consistency.");
        } else {
            diag.append("Priority Revision Needed: ").append(String.join(", ", weakSubjects))
                .append(". Focus on theoretical fundamentals and timed drills in these areas.");
        }

        attempt.setStatus("SUBMITTED");
        attempt.setSubmitTime(LocalDateTime.now());
        attempt.setRemainingSeconds(0);
        attempt.setScore(score);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(wrongCount);
        attempt.setSkippedCount(skippedCount);
        attempt.setPercentage(Math.round(percentage * 10.0) / 10.0);
        attempt.setPassed(passed);
        attempt.setWeakAreasSummary(diag.toString());

        testAttemptRepository.save(attempt);

        // Subject breakdown map
        Map<String, TestResultDTO.SubjectPerformanceDTO> subjectBreakdown = new LinkedHashMap<>();
        for (Map.Entry<String, int[]> entry : subjectCounts.entrySet()) {
            int tot = entry.getValue()[0];
            int cor = entry.getValue()[1];
            double pct = tot == 0 ? 0 : ((double) cor / tot) * 100.0;
            subjectBreakdown.put(entry.getKey(), new TestResultDTO.SubjectPerformanceDTO(tot, cor, pct));
        }

        TestResultDTO result = new TestResultDTO();
        result.setAttemptId(attempt.getId());
        result.setPaperCode(paper.getPaperCode());
        result.setPaperTitle(paper.getTitle());
        result.setTotalQuestions(questions.size());
        result.setScore(score);
        result.setCorrectCount(correctCount);
        result.setWrongCount(wrongCount);
        result.setSkippedCount(skippedCount);
        result.setPercentage(Math.round(percentage * 10.0) / 10.0);
        result.setPassed(passed);
        result.setSubjectBreakdown(subjectBreakdown);
        result.setReviews(reviews);

        return result;
    }

    @Transactional(readOnly = true)
    public List<QuestionResponseDTO> getQuestionsForPaper(String paperCode) {
        TestPaper paper = testPaperRepository.findByPaperCode(paperCode)
                .orElseThrow(() -> new IllegalArgumentException("Test paper not found: " + paperCode));

        List<Question> questions = questionRepository.findByTestPaperIdOrderByQuestionNumberAsc(paper.getId());

        return questions.stream().map(q -> {
            Map<String, String> qTextMap = new HashMap<>();
            qTextMap.put("en", q.getQuestionEn());
            qTextMap.put("or", q.getQuestionOr() != null ? q.getQuestionOr() : q.getQuestionEn());

            List<String> enOptions = new ArrayList<>();
            List<String> orOptions = new ArrayList<>();

            for (QuestionOption opt : q.getOptions()) {
                enOptions.add(opt.getTextEn());
                orOptions.add(opt.getTextOr() != null ? opt.getTextOr() : opt.getTextEn());
            }

            Map<String, List<String>> optionsMap = new HashMap<>();
            optionsMap.put("en", enOptions);
            optionsMap.put("or", orOptions);

            return new QuestionResponseDTO(q.getId(), q.getQuestionNumber(), q.getSubject(), qTextMap, optionsMap);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<StudentHistorySummaryDTO> getStudentHistory(String email) {
        if (email == null || email.isBlank()) return Collections.emptyList();
        String cleanEmail = email.trim().toLowerCase();

        return testAttemptRepository.findByCandidateEmailOrderByStartTimeDesc(cleanEmail).stream()
                .map(a -> new StudentHistorySummaryDTO(
                        a.getId(),
                        a.getTestPaper().getPaperCode(),
                        a.getTestPaper().getTitle(),
                        a.getStartTime(),
                        a.getSubmitTime(),
                        a.getStatus(),
                        a.getScore(),
                        a.getTestPaper().getTotalQuestions(),
                        a.getPercentage(),
                        a.isPassed(),
                        a.getWeakAreasSummary() != null ? a.getWeakAreasSummary() : "Analysis pending."
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<StudentHistorySummaryDTO> getActiveResumeAttempt(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        return testAttemptRepository
                .findTopByCandidateEmailAndStatusOrderByStartTimeDesc(email.trim().toLowerCase(), "IN_PROGRESS")
                .map(a -> new StudentHistorySummaryDTO(
                        a.getId(),
                        a.getTestPaper().getPaperCode(),
                        a.getTestPaper().getTitle(),
                        a.getStartTime(),
                        null,
                        a.getStatus(),
                        0,
                        a.getTestPaper().getTotalQuestions(),
                        0.0,
                        false,
                        "In-Progress: " + (a.getRemainingSeconds() / 60) + " minutes remaining."
                ));
    }
}
