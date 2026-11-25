package com.otet.prep.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_attempts")
public class TestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_paper_id", nullable = false)
    private TestPaper testPaper;

    private String candidateName;
    private String candidateEmail;

    private LocalDateTime startTime;
    private LocalDateTime submitTime;

    private int score;
    private int correctCount;
    private int wrongCount;
    private int skippedCount;
    private double percentage;
    private boolean passed;

    @OneToMany(mappedBy = "testAttempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserAnswer> answers = new ArrayList<>();

    public TestAttempt() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TestPaper getTestPaper() { return testPaper; }
    public void setTestPaper(TestPaper testPaper) { this.testPaper = testPaper; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getSubmitTime() { return submitTime; }
    public void setSubmitTime(LocalDateTime submitTime) { this.submitTime = submitTime; }

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

    public List<UserAnswer> getAnswers() { return answers; }
    public void setAnswers(List<UserAnswer> answers) { this.answers = answers; }
}
