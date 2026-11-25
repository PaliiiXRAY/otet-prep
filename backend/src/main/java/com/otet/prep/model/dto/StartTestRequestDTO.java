package com.otet.prep.model.dto;

public class StartTestRequestDTO {
    private String candidateName;
    private String candidateEmail;

    public StartTestRequestDTO() {}

    public StartTestRequestDTO(String candidateName, String candidateEmail) {
        this.candidateName = candidateName;
        this.candidateEmail = candidateEmail;
    }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }
}
