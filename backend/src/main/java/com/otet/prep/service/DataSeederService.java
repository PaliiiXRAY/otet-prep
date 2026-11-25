package com.otet.prep.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otet.prep.model.entity.Question;
import com.otet.prep.model.entity.QuestionOption;
import com.otet.prep.model.entity.TestPaper;
import com.otet.prep.repository.TestPaperRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;

@Service
public class DataSeederService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeederService.class);

    private final TestPaperRepository testPaperRepository;
    private final ObjectMapper objectMapper;

    public DataSeederService(TestPaperRepository testPaperRepository, ObjectMapper objectMapper) {
        this.testPaperRepository = testPaperRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (testPaperRepository.count() > 0) {
            log.info("[DataSeeder] Database already contains test papers. Skipping seed.");
            return;
        }

        log.info("[DataSeeder] Empty database detected. Ingesting test papers and questions from seed_data.json...");

        try {
            ClassPathResource resource = new ClassPathResource("seed_data.json");
            if (!resource.exists()) {
                log.warn("[DataSeeder] seed_data.json not found on classpath!");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(is);
                JsonNode papersNode = root.get("papers");

                if (papersNode != null && papersNode.isArray()) {
                    int totalPapers = 0;
                    int totalQuestions = 0;

                    for (JsonNode pNode : papersNode) {
                        String code = pNode.get("paperCode").asText();
                        String title = pNode.get("title").asText();
                        String desc = pNode.has("description") ? pNode.get("description").asText() : "";
                        String targetClass = pNode.has("targetClass") ? pNode.get("targetClass").asText() : "";
                        int duration = pNode.has("durationMinutes") ? pNode.get("durationMinutes").asInt() : 150;

                        TestPaper paper = new TestPaper(code, title, desc, targetClass, duration);

                        JsonNode qArray = pNode.get("questions");
                        if (qArray != null && qArray.isArray()) {
                            int qNum = 1;
                            for (JsonNode qNode : qArray) {
                                Question question = new Question();
                                question.setQuestionNumber(qNum++);
                                question.setSubject(qNode.has("subject") ? qNode.get("subject").asText() : "General");

                                JsonNode qTextNode = qNode.get("q");
                                if (qTextNode != null) {
                                    question.setQuestionEn(qTextNode.has("en") ? qTextNode.get("en").asText() : "");
                                    question.setQuestionOr(qTextNode.has("or") ? qTextNode.get("or").asText() : "");
                                } else {
                                    question.setQuestionEn("Question text missing");
                                }

                                int answerIdx = qNode.has("answer") ? qNode.get("answer").asInt() : 0;
                                question.setCorrectOptionIndex(answerIdx);

                                JsonNode optsNode = qNode.get("options");
                                if (optsNode != null) {
                                    JsonNode enOpts = optsNode.get("en");
                                    JsonNode orOpts = optsNode.get("or");

                                    if (enOpts != null && enOpts.isArray()) {
                                        for (int i = 0; i < enOpts.size(); i++) {
                                            String enText = enOpts.get(i).asText();
                                            String orText = (orOpts != null && orOpts.isArray() && i < orOpts.size())
                                                    ? orOpts.get(i).asText() : enText;
                                            question.addOption(new QuestionOption(i, enText, orText));
                                        }
                                    }
                                }

                                paper.addQuestion(question);
                                totalQuestions++;
                            }
                        }

                        paper.setTotalQuestions(paper.getQuestions().size());
                        testPaperRepository.save(paper);
                        totalPapers++;
                    }

                    log.info("[DataSeeder] Successfully seeded {} test papers with {} total questions into database!",
                            totalPapers, totalQuestions);
                }
            }
        } catch (Exception e) {
            log.error("[DataSeeder] Failed to seed database: {}", e.getMessage(), e);
        }
    }
}
