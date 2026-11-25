package com.otet.prep.model.dto;

import java.util.Map;

public class SubmitTestRequestDTO {
    private String candidateName;
    private String candidateEmail;
    // Map of questionId -> selectedOptionIndex (e.g. 1 -> 0, 2 -> 3)
    private Map<Long, Integer> answers;

    public SubmitTestRequestDTO() {}

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public Map<Long, Integer> getAnswers() { return answers; }
    public void setAnswers(Map<Long, Integer> answers) { this.answers = answers; }
}
