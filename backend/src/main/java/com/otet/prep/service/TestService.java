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

    public List<TestPaperSummaryDTO> getAllTestPapers() {
        return testPaperRepository.findAll().stream()
                .map(p -> new TestPaperSummaryDTO(
                        p.getId(),
                        p.getPaperCode(),
                        p.getTitle(),
                        p.getDescription(),
                        p.getTargetClass(),
                        p.getDurationMinutes(),
                        p.getQuestions().size() > 0 ? p.getQuestions().size() : p.getTotalQuestions()
                ))
                .toList();
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

            // Notice: correctOptionIndex is NOT included in this response!
            return new QuestionResponseDTO(q.getId(), q.getQuestionNumber(), q.getSubject(), qTextMap, optionsMap);
        }).toList();
    }

    @Transactional
    public TestResultDTO submitTest(String paperCode, SubmitTestRequestDTO request) {
        TestPaper paper = testPaperRepository.findByPaperCode(paperCode)
                .orElseThrow(() -> new IllegalArgumentException("Test paper not found: " + paperCode));

        List<Question> questions = questionRepository.findByTestPaperIdOrderByQuestionNumberAsc(paper.getId());
        Map<Long, Integer> userAnswers = request.getAnswers() != null ? request.getAnswers() : Collections.emptyMap();

        int score = 0;
        int correctCount = 0;
        int wrongCount = 0;
        int skippedCount = 0;

        Map<String, int[]> subjectCounts = new HashMap<>(); // subject -> [total, correct]
        List<TestResultDTO.QuestionReviewDTO> reviews = new ArrayList<>();

        TestAttempt attempt = new TestAttempt();
        attempt.setTestPaper(paper);
        attempt.setCandidateName(request.getCandidateName() != null ? request.getCandidateName() : "Anonymous Candidate");
        attempt.setCandidateEmail(request.getCandidateEmail() != null ? request.getCandidateEmail() : "guest@otet.edu");
        attempt.setStartTime(LocalDateTime.now().minusMinutes(paper.getDurationMinutes()));
        attempt.setSubmitTime(LocalDateTime.now());

        for (Question q : questions) {
            subjectCounts.putIfAbsent(q.getSubject(), new int[]{0, 0});
            subjectCounts.get(q.getSubject())[0]++;

            Integer selected = userAnswers.get(q.getId());
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

        attempt.setScore(score);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(wrongCount);
        attempt.setSkippedCount(skippedCount);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);

        TestAttempt savedAttempt = testAttemptRepository.save(attempt);

        // Build subject breakdown
        Map<String, TestResultDTO.SubjectPerformanceDTO> subjectBreakdown = new LinkedHashMap<>();
        for (Map.Entry<String, int[]> entry : subjectCounts.entrySet()) {
            int tot = entry.getValue()[0];
            int cor = entry.getValue()[1];
            double pct = tot == 0 ? 0 : ((double) cor / tot) * 100.0;
            subjectBreakdown.put(entry.getKey(), new TestResultDTO.SubjectPerformanceDTO(tot, cor, pct));
        }

        TestResultDTO result = new TestResultDTO();
        result.setAttemptId(savedAttempt.getId());
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
}
