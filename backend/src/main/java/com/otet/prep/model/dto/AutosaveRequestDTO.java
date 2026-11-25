package com.otet.prep.model.dto;

import java.util.Map;

public class AutosaveRequestDTO {
    private int remainingSeconds;
    private int currentQuestionIndex;
    private Map<Long, Integer> answers; // questionId -> selectedOptionIndex

    public AutosaveRequestDTO() {}

    public int getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(int remainingSeconds) { this.remainingSeconds = remainingSeconds; }

    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }

    public Map<Long, Integer> getAnswers() { return answers; }
    public void setAnswers(Map<Long, Integer> answers) { this.answers = answers; }
}
