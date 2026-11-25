const questions = {
    "paper1": [
        // --- Child Development & Pedagogy (CDP) ---
        {
            id: 1,
            subject: "CDP",
            q: { en: "Which of the following is NOT a principle of development?", or: "ନିମ୍ନଲିଖିତ ମଧ୍ୟରୁ କେଉଁଟି ବିକାଶର ନୀତି ନୁହେଁ?" },
            options: { en: ["Principle of continuity", "Principle of individual difference", "Principle of proceeding from specific to general", "Principle of integration"], or: ["ନିରନ୍ତରତାର ନୀତି", "ବ୍ୟକ୍ତିଗତ ପାର୍ଥକ୍ୟର ନୀତି", "ନିର୍ଦ୍ଦିଷ୍ଟରୁ ସାଧାରଣ ଆଡକୁ ଯିବାର ନୀତି", "ଏକୀକରଣର ନୀତି"] },
            answer: 2
        },
        {
            id: 2,
            subject: "CDP",
            q: { en: "According to Piaget, at which stage does abstract thinking begin to develop?", or: "ପିଆଜେଙ୍କ ଅନୁଯାୟୀ, କେଉଁ ପର୍ଯ୍ୟାୟରେ ବିମୂର୍ତ୍ତ ଚିନ୍ତାଧାରା ବିକଶିତ ହେବାକୁ ଲାଗେ?" },
            options: { en: ["Sensory-motor", "Pre-operational", "Concrete operational", "Formal operational"], or: ["ସମ୍ବେଦୀ-ପେଶୀୟ", "ପ୍ରାକ୍-କାର୍ଯ୍ୟକାରୀ", "ମୂର୍ତ୍ତ କାର୍ଯ୍ୟକାରୀ", "ବିମୂର୍ତ୍ତ କାର୍ଯ୍ୟକାରୀ"] },
            answer: 3
        },
        {
            id: 3,
            subject: "CDP",
            q: { en: "Who is the father of Kindergarten method of teaching?", or: "କିଣ୍ଡରଗାର୍ଟେନ୍ ଶିକ୍ଷାଦାନ ପଦ୍ଧତିର ଜନକ କିଏ?" },
            options: { en: ["Froebel", "Montessori", "Dewey", "Rousseau"], or: ["ଫ୍ରୋଏବେଲ୍", "ମଣ୍ଟେସୋରୀ", "ଡିୱି", "ରୁଷୋ"] },
            answer: 0
        },
        {
            id: 4,
            subject: "CDP",
            q: { en: "Which act guarantees right to education for children between 6-14 years?", or: "କେଉଁ ଆଇନ ୬-୧୪ ବର୍ଷ ବୟସର ପିଲାମାନଙ୍କ ପାଇଁ ଶିକ୍ଷା ଅଧିକାରକୁ ସୁନିଶ୍ଚିତ କରେ?" },
            options: { en: ["RTI Act", "RTE Act 2009", "Education Policy 1986", "None of these"], or: ["ସୂଚନା ଅଧିକାର ଆଇନ", "RTE ଆଇନ ୨୦୦୯", "ଶିକ୍ଷା ନୀତି ୧୯୮୬", "ଏଥିମଧ୍ୟରୁ କୌଣସି ନୁହେଁ"] },
            answer: 1
        },
        {
            id: 5,
            subject: "CDP",
            q: { en: "Dyslexia is associated with:", or: "ଡିସଲେକ୍ସିଆ କାହା ସହିତ ଜଡିତ?" },
            options: { en: ["Reading disorder", "Mental disorder", "Mathematical disorder", "Behavioral disorder"], or: ["ପଠନ ବିକାର", "ମାନସିକ ବିକାର", "ଗାଣିତିକ ବିକାର", "ଆଚରଣଗତ ବିକାର"] },
            answer: 0
        },

        // --- Language (Odia) ---
        {
            id: 6,
            subject: "Odia",
            q: { en: "Identify the correct spelling:", or: "ଶୁଦ୍ଧ ଶବ୍ଦଟି ଚିହ୍ନଟ କର:" },
            options: { en: ["Ashirbad", "Ashirvad", "Ashirwad", "Asirbad"], or: ["ଆଶିର୍ବାଦ", "ଆର୍ଶିବାଦ", "ଆଶିବାର୍ଦ", "ଆଶୀର୍ବାଦ"] },
            answer: 3
        },
        {
            id: 7,
            subject: "Odia",
            q: { en: "Which case ending (Vibhakti) is used for 'Origin'?", or: "'ଉତ୍ପତ୍ତି' ଅର୍ଥରେ କେଉଁ ବିଭକ୍ତି ବ୍ୟବହୃତ ହୁଏ?" },
            options: { en: ["2nd", "3rd", "5th", "7th"], or: ["ଦ୍ୱିତୀୟା", "ତୃତୀୟା", "ପଞ୍ଚମୀ", "ସପ୍ତମୀ"] },
            answer: 2
        },

        // --- Language (English) ---
        {
            id: 8,
            subject: "English",
            q: { en: "Choose the correct preposition: The cat jumped ___ the table.", or: "ସଠିକ୍ Preposition ବାଛନ୍ତୁ: The cat jumped ___ the table." },
            options: { en: ["in", "on", "upon", "at"], or: ["in", "on", "upon", "at"] },
            answer: 2
        },
        {
            id: 9,
            subject: "English",
            q: { en: "Which method is also known as the 'Natural Method'?", or: "କେଉଁ ପଦ୍ଧତିକୁ 'ପ୍ରାକୃତିକ ପଦ୍ଧତି' ମଧ୍ୟ କୁହାଯାଏ?" },
            options: { en: ["Grammar Translation Method", "Direct Method", "Bilingual Method", "Audio-Lingual Method"], or: ["ବ୍ୟାକରଣ ଅନୁବାଦ ପଦ୍ଧତି", "ପ୍ରତ୍ୟକ୍ଷ ପଦ୍ଧତି", "ଦ୍ୱିଭାଷୀ ପଦ୍ଧତି", "ଶ୍ରାବ୍ୟ-ଭାଷା ପଦ୍ଧତି"] },
            answer: 1
        },

        // --- EVS & Math ---
        {
            id: 10,
            subject: "EVS",
            q: { en: "Which gas is most abundant in the Earth's atmosphere?", or: "ପୃଥିବୀର ବାୟୁମଣ୍ଡଳରେ କେଉଁ ଗ୍ୟାସ ସବୁଠାରୁ ଅଧିକ ପରିମାଣରେ ଥାଏ?" },
            options: { en: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"], or: ["ଅମ୍ଳଜାନ", "ଯବକ୍ଷାରଜାନ", "ଅଙ୍ଗାରକାମ୍ଳ", "ଆର୍ଗନ୍"] },
            answer: 1
        },
        {
            id: 11,
            subject: "EVS",
            q: { en: "Which state of India is known as the 'Tiger State'?", or: "ଭାରତର କେଉଁ ରାଜ୍ୟକୁ 'ବାଘ ରାଜ୍ୟ' କୁହାଯାଏ?" },
            options: { en: ["Odisha", "Madhya Pradesh", "West Bengal", "Gujarat"], or: ["ଓଡ଼ିଶା", "ମଧ୍ୟପ୍ରଦେଶ", "ପଶ୍ଚିମବଙ୍ଗ", "ଗୁଜୁରାଟ"] },
            answer: 1
        },
        {
            id: 12,
            subject: "EVS",
            q: { en: "Similipal National Park is located in which district of Odisha?", or: "ଶିମିଳିପାଳ ଜାତୀୟ ଉଦ୍ୟାନ ଓଡ଼ିଶାର କେଉଁ ଜିଲ୍ଲାରେ ଅବସ୍ଥିତ?" },
            options: { en: ["Mayurbhanj", "Keonjhar", "Balasore", "Angul"], or: ["ମୟୂରଭଞ୍ଜ", "କେନ୍ଦୁଝର", "ବାଲେଶ୍ୱର", "ଅନୁଗୁଳ"] },
            answer: 0
        },
        {
            id: 13,
            subject: "Math",
            q: { en: "The sum of angles of a triangle is:", or: "ଗୋଟିଏ ତ୍ରିଭୁଜର କୋଣମାନଙ୍କର ସମଷ୍ଟି କେତେ?" },
            options: { en: ["90°", "180°", "360°", "270°"], or: ["90°", "180°", "360°", "270°"] },
            answer: 1
        },
        {
            id: 14,
            subject: "Math",
            q: { en: "If the radius of a circle is 7cm, what is its circumference?", or: "ଯଦି ଗୋଟିଏ ବୃତ୍ତର ବ୍ୟାସାର୍ଦ୍ଧ 7cm ହୁଏ, ତେବେ ଏହାର ପରିଧି କେତେ?" },
            options: { en: ["22 cm", "44 cm", "154 cm", "88 cm"], or: ["22 cm", "44 cm", "154 cm", "88 cm"] },
            answer: 1
        },
        {
            id: 15,
            subject: "Math",
            q: { en: "What is the smallest prime number?", or: "କ୍ଷୁଦ୍ରତମ ମୌଳିକ ସଂଖ୍ୟା କେଉଁଟି?" },
            options: { en: ["0", "1", "2", "3"], or: ["0", "1", "2", "3"] },
            answer: 2
        }
    ],

    "paper2-social": [
        // --- Social Studies (History) ---
        {
            id: 1,
            subject: "History",
            q: { en: "Who was the founder of the Maurya Dynasty?", or: "ମୌର୍ଯ୍ୟ ବଂଶର ପ୍ରତିଷ୍ଠାତା କିଏ ଥିଲେ?" },
            options: { en: ["Ashoka", "Bindusara", "Chandragupta Maurya", "Bimbisara"], or: ["ଅଶୋକ", "ବିନ୍ଦୁସାର", "ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟ", "ବିମ୍ବିସାର"] },
            answer: 2
        },
        {
            id: 2,
            subject: "History",
            q: { en: "In which year did the Kalinga War take place?", or: "କଳିଙ୍ଗ ଯୁଦ୍ଧ କେଉଁ ବର୍ଷ ହୋଇଥିଲା?" },
            options: { en: ["261 BC", "260 BC", "273 BC", "232 BC"], or: ["261 ଖ୍ରୀଷ୍ଟପୂର୍ବ", "260 ଖ୍ରୀଷ୍ଟପୂର୍ବ", "273 ଖ୍ରୀଷ୍ଟପୂର୍ବ", "232 ଖ୍ରୀଷ୍ଟପୂର୍ବ"] },
            answer: 0
        },
        {
            id: 3,
            subject: "History",
            q: { en: "Who wrote 'Gita Govinda'?", or: "'ଗୀତ ଗୋବିନ୍ଦ' କିଏ ଲେଖିଥିଲେ?" },
            options: { en: ["Sarala Das", "Jayadeva", "Upendra Bhanja", "Radhanath Ray"], or: ["ସାରଳା ଦାସ", "ଜୟଦେବ", "ଉପେନ୍ଦ୍ର ଭଞ୍ଜ", "ରାଧାନାଥ ରାୟ"] },
            answer: 1
        },
        {
            id: 4,
            subject: "History",
            q: { en: "The Paika Rebellion (1817) started in which place?", or: "ପାଇକ ବିଦ୍ରୋହ (1817) କେଉଁ ସ୍ଥାନରୁ ଆରମ୍ଭ ହୋଇଥିଲା?" },
            options: { en: ["Khurda", "Cuttack", "Puri", "Ganjam"], or: ["ଖୋର୍ଦ୍ଧା", "କଟକ", "ପୁରୀ", "ଗଞ୍ଜାମ"] },
            answer: 0
        },

        // --- Social Studies (Geography) ---
        {
            id: 5,
            subject: "Geography",
            q: { en: "Which river is known as the 'Sorrow of Odisha'?", or: "ଓଡ଼ିଶାର ଦୁଃଖ ବୋଲି କେଉଁ ନଦୀକୁ କୁହାଯାଏ?" },
            options: { en: ["Brahmani", "Mahanadi", "Baitarani", "Rushikulya"], or: ["ବ୍ରାହ୍ମଣୀ", "ମହାନଦୀ", "ବୈତରଣୀ", "ଋଷିକୂଲ୍ୟା"] },
            answer: 1
        },
        {
            id: 6,
            subject: "Geography",
            q: { en: "Hirakud Dam is built over which river?", or: "ହୀରାକୁଦ ବନ୍ଧ କେଉଁ ନଦୀ ଉପରେ ନିର୍ମିତ?" },
            options: { en: ["Mahanadi", "Godavari", "Krishna", "Narmada"], or: ["ମହାନଦୀ", "ଗୋଦାବରୀ", "କୃଷ୍ଣା", "ନର୍ମଦା"] },
            answer: 0
        },
        {
            id: 7,
            subject: "Geography",
            q: { en: "Which planet is known as the 'Red Planet'?", or: "କେଉଁ ଗ୍ରହକୁ 'ଲାଲ୍ ଗ୍ରହ' କୁହାଯାଏ?" },
            options: { en: ["Venus", "Mars", "Jupiter", "Saturn"], or: ["ଶୁକ୍ର", "ମଙ୍ଗଳ", "ବୃହସ୍ପତି", "ଶନି"] },
            answer: 1
        },

        // --- Social Studies (Polity) ---
        {
            id: 8,
            subject: "Polity",
            q: { en: "The fundamental duties in the Indian Constitution were adopted from which country?", or: "ଭାରତୀୟ ସମ୍ବିଧାନରେ ମୌଳିକ କର୍ତ୍ତବ୍ୟ କେଉଁ ଦେଶରୁ ଗ୍ରହଣ କରାଯାଇଛି?" },
            options: { en: ["USA", "UK", "USSR (Russia)", "Germany"], or: ["ଯୁକ୍ତରାଷ୍ଟ୍ର ଆମେରିକା", "ଯୁକ୍ତରାଜ୍ୟ", "ଋଷିଆ", "ଜର୍ମାନୀ"] },
            answer: 2
        },
        {
            id: 9,
            subject: "Polity",
            q: { en: "Who is the Constitutional Head of the State in India?", or: "ଭାରତର ସାମ୍ବିଧାନିକ ମୁଖ୍ୟ କିଏ?" },
            options: { en: ["Prime Minister", "President", "Chief Justice", "Speaker"], or: ["ପ୍ରଧାନମନ୍ତ୍ରୀ", "ରାଷ୍ଟ୍ରପତି", "ମୁଖ୍ୟ ବିଚାରପତି", "ବାଚସ୍ପତି"] },
            answer: 1
        },
        {
            id: 10,
            subject: "Polity",
            q: { en: "Article 21A deals with:", or: "ଧାରା 21A କାହା ସହିତ ଜଡିତ?" },
            options: { en: ["Right to Information", "Right to Education", "Right to Freedom", "Right to Religion"], or: ["ସୂଚନା ଅଧିକାର", "ଶିକ୍ଷା ଅଧିକାର", "ସ୍ୱାଧୀନତା ଅଧିକାର", "ଧର୍ମଗତ ଅଧିକାର"] },
            answer: 1
        },

        // --- Common Subjects (CDP/English/Odia) for Paper 2 as well ---
        {
            id: 11,
            subject: "CDP",
            q: { en: "Which is the first agency of socialization?", or: "ସାମାଜିକରଣର ପ୍ରଥମ ସଂସ୍ଥା କେଉଁଟି?" },
            options: { en: ["School", "Family", "Media", "Government"], or: ["ବିଦ୍ୟାଳୟ", "ପରିବାର", "ଗଣମାଧ୍ୟମ", "ସରକାର"] },
            answer: 1
        },
        {
            id: 12,
            subject: "English",
            q: { en: "Crying of a child is:", or: "ଶିଶୁର କାନ୍ଦିବା ହେଉଛି:" },
            options: { en: ["Language", "Sign language", "Telegraphic speech", "Pre-language"], or: ["ଭାଷା", "ସାଙ୍କେତିକ ଭାଷା", "ଟେଲିଗ୍ରାଫିକ୍ ଭାଷା", "ପ୍ରାକ୍-ଭାଷା"] },
            answer: 1
        },
        // Adding more unique questions to reach bigger count
        {
            id: 13,
            subject: "History",
            q: { en: "Who was the last independent Hindu King of Odisha?", or: "ଓଡ଼ିଶାର ଶେଷ ସ୍ୱାଧୀନ ହିନ୍ଦୁ ରାଜା କିଏ ଥିଲେ?" },
            options: { en: ["Mukunda Deva", "Kapilendra Deva", "Purushottama Deva", "Prataparudra Deva"], or: ["ମୁକୁନ୍ଦ ଦେବ", "କପିଳେନ୍ଦ୍ର ଦେବ", "ପୁରୁଷୋତ୍ତମ ଦେବ", "ପ୍ରତାପରୁଦ୍ର ଦେବ"] },
            answer: 0
        },
        {
            id: 14,
            subject: "Geography",
            q: { en: "Chilika Lake is famous for:", or: "ଚିଲିକା ହ୍ରଦ କାହା ପାଇଁ ପ୍ରସିଦ୍ଧ?" },
            options: { en: ["Fresh water", "Brackish water", "Salt production", "Thermal power"], or: ["ମଧୁର ଜଳ", "ଲୁଣି ଜଳ", "ଲୁଣ ଉତ୍ପାଦନ", "ତାପଜ ବିଦ୍ୟୁତ୍"] },
            answer: 1
        },
        {
            id: 15,
            subject: "Polity",
            q: { en: "Panchayati Raj System was first introduced in:", or: "ପଞ୍ଚାୟତ ରାଜ ବ୍ୟବସ୍ଥା ପ୍ରଥମେ କେଉଁଠାରେ ପ୍ରଚଳନ କରାଯାଇଥିଲା?" },
            options: { en: ["Odisha", "Rajasthan", "Bihar", "West Bengal"], or: ["ଓଡ଼ିଶା", "ରାଜସ୍ଥାନ", "ବିହାର", "ପଶ୍ଚିମବଙ୍ଗ"] },
            answer: 1
        }
    ]
};

// Helper: Generate Mock Questions to Simulate 150
// NOTE: I am now looping through the unique questions to fill the 150 slots
// instead of just 3. This gives much better variety.
function generateMockQuestions(paper, count) {
    const baseQuestions = questions[paper];
    const fullSet = [];
    for (let i = 0; i < count; i++) {
        const base = baseQuestions[i % baseQuestions.length];
        fullSet.push({
            ...base,
            id: i + 1, // New ID
            q: {
                en: `#${i + 1}: ${base.q.en}`, // Prefixing for clarity in mock
                or: `#${i + 1}: ${base.q.or}`
            }
        });
    }
    return fullSet;
}

window.getQuestions = (paperType) => {
    return generateMockQuestions(paperType, 150);
};
