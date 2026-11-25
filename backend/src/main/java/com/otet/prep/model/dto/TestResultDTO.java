package com.otet.prep.model.dto;

import java.util.List;
import java.util.Map;

public class TestResultDTO {
    private Long attemptId;
    private String paperCode;
    private String paperTitle;
    private int totalQuestions;
    private int score;
    private int correctCount;
    private int wrongCount;
    private int skippedCount;
    private double percentage;
    private boolean passed;
    private Map<String, SubjectPerformanceDTO> subjectBreakdown;
    private List<QuestionReviewDTO> reviews;

    public TestResultDTO() {}

    public static class SubjectPerformanceDTO {
        private int total;
        private int correct;
        private double percentage;

        public SubjectPerformanceDTO(int total, int correct, double percentage) {
            this.total = total;
            this.correct = correct;
            this.percentage = percentage;
        }

        public int getTotal() { return total; }
        public int getCorrect() { return correct; }
        public double getPercentage() { return percentage; }
    }

    public static class QuestionReviewDTO {
        private Long questionId;
        private int questionNumber;
        private String subject;
        private Integer userSelectedOption;
        private int correctOptionIndex;
        private boolean isCorrect;
        private String explanation;

        public QuestionReviewDTO(Long questionId, int questionNumber, String subject, Integer userSelectedOption, int correctOptionIndex, boolean isCorrect, String explanation) {
            this.questionId = questionId;
            this.questionNumber = questionNumber;
            this.subject = subject;
            this.userSelectedOption = userSelectedOption;
            this.correctOptionIndex = correctOptionIndex;
            this.isCorrect = isCorrect;
            this.explanation = explanation;
        }

        public Long getQuestionId() { return questionId; }
        public int getQuestionNumber() { return questionNumber; }
        public String getSubject() { return subject; }
        public Integer getUserSelectedOption() { return userSelectedOption; }
        public int getCorrectOptionIndex() { return correctOptionIndex; }
        public boolean isCorrect() { return isCorrect; }
        public String getExplanation() { return explanation; }
    }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }

    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }

    public String getPaperTitle() { return paperTitle; }
    public void setPaperTitle(String paperTitle) { this.paperTitle = paperTitle; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }

    public int getSkippedCount() { return skippedCount; }
    public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public Map<String, SubjectPerformanceDTO> getSubjectBreakdown() { return subjectBreakdown; }
    public void setSubjectBreakdown(Map<String, SubjectPerformanceDTO> subjectBreakdown) { this.subjectBreakdown = subjectBreakdown; }

    public List<QuestionReviewDTO> getReviews() { return reviews; }
    public void setReviews(List<QuestionReviewDTO> reviews) { this.reviews = reviews; }
}
