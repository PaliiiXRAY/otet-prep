package com.otet.prep.model.dto;

public class TestPaperSummaryDTO {
    private Long id;
    private String paperCode;
    private String title;
    private String description;
    private String targetClass;
    private int durationMinutes;
    private int totalQuestions;

    public TestPaperSummaryDTO(Long id, String paperCode, String title, String description, String targetClass, int durationMinutes, int totalQuestions) {
        this.id = id;
        this.paperCode = paperCode;
        this.title = title;
        this.description = description;
        this.targetClass = targetClass;
        this.durationMinutes = durationMinutes;
        this.totalQuestions = totalQuestions;
    }

    public Long getId() { return id; }
    public String getPaperCode() { return paperCode; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTargetClass() { return targetClass; }
    public int getDurationMinutes() { return durationMinutes; }
    public int getTotalQuestions() { return totalQuestions; }
}
