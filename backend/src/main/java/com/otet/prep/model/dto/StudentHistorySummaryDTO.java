package com.otet.prep.model.dto;

import java.time.LocalDateTime;

public class StudentHistorySummaryDTO {
    private Long attemptId;
    private String paperCode;
    private String paperTitle;
    private LocalDateTime startTime;
    private LocalDateTime submitTime;
    private String status;
    private int score;
    private int totalQuestions;
    private double percentage;
    private boolean passed;
    private String weakAreasSummary;

    public StudentHistorySummaryDTO(Long attemptId, String paperCode, String paperTitle,
                                   LocalDateTime startTime, LocalDateTime submitTime, String status,
                                   int score, int totalQuestions, double percentage, boolean passed,
                                   String weakAreasSummary) {
        this.attemptId = attemptId;
        this.paperCode = paperCode;
        this.paperTitle = paperTitle;
        this.startTime = startTime;
        this.submitTime = submitTime;
        this.status = status;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.percentage = percentage;
        this.passed = passed;
        this.weakAreasSummary = weakAreasSummary;
    }

    public Long getAttemptId() { return attemptId; }
    public String getPaperCode() { return paperCode; }
    public String getPaperTitle() { return paperTitle; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getSubmitTime() { return submitTime; }
    public String getStatus() { return status; }
    public int getScore() { return score; }
    public int getTotalQuestions() { return totalQuestions; }
    public double getPercentage() { return percentage; }
    public boolean isPassed() { return passed; }
    public String getWeakAreasSummary() { return weakAreasSummary; }
}
