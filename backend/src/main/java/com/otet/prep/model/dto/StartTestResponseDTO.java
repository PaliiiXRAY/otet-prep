package com.otet.prep.model.dto;

import java.util.List;
import java.util.Map;

public class StartTestResponseDTO {
    private Long attemptId;
    private String paperCode;
    private String paperTitle;
    private int durationMinutes;
    private int remainingSeconds;
    private int currentQuestionIndex;
    private String status;
    private Map<Long, Integer> savedAnswers;
    private List<QuestionResponseDTO> questions;

    public StartTestResponseDTO() {}

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }

    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }

    public String getPaperTitle() { return paperTitle; }
    public void setPaperTitle(String paperTitle) { this.paperTitle = paperTitle; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public int getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(int remainingSeconds) { this.remainingSeconds = remainingSeconds; }

    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<Long, Integer> getSavedAnswers() { return savedAnswers; }
    public void setSavedAnswers(Map<Long, Integer> savedAnswers) { this.savedAnswers = savedAnswers; }

    public List<QuestionResponseDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionResponseDTO> questions) { this.questions = questions; }
}
