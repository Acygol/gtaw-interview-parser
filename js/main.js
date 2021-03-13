/*
//
//  Written and developed by Acygol.
//
//  Initially used for the Training and Recruitment division of the 
//  GTAW Fire Department, repurposed for the GTAW State Fire Marshals.
//
//  Edit, copy, do whatever. I don't care.
//
*/

// Template variables
const TPLTVAR_INTERVIEWEE_NAME        = '$INTERVIEWEE_NAME$';        // The name of the interviewee
const TPLTVAR_PREINTERVIEW_TEXT       = '$PREINTERVIEW_TEXT$';       // The preinterview text - any dialog/RP before the first question
const TPLTVAR_QUESTIONS_CONTAINER     = '$QUESTIONS_CONTAINER$';     // Replaced by a string containing all the question templates combined
const TPLTVAR_QUESTION_TEXT           = '$QUESTION_TEXT$';           // The question itself (should be limited to a single line)
const TPLTVAR_QUESTION_ANSWER_CONTENT = '$QUESTION_ANSWER_CONTENT$'; // The answer and any dialog/RP related to the question

// The main template is the parent template; individual question templates are parsed
// and then embedded within this template.
const MAIN_TEMPLATE = `[divbox=white]
[center][img]https://i.imgur.com/VTE8HAs.png[/img][/center] 

[divbox=#284066][color=white][center][size=150][font=AmerType Md BT]INTERVIEW - ${TPLTVAR_INTERVIEWEE_NAME}[/font][/size][/center][/color][/divbox]

[justify]
[legend=#284066, Preinterview]${TPLTVAR_PREINTERVIEW_TEXT}[/legend]
${TPLTVAR_QUESTIONS_CONTAINER}
[/justify]
[/divbox]

Response format:
[code]
[legend=#284066, Evaluation]
[b]Reviewer's name:[/b]
[b]Reviewer's badge number:[/b]
[b]Evaluation:[/b]
[b](([/b] [b]OOC Note:[/b] (optional) [b]))[/b]
[/legend]
[/code]
`

// Individual question template
const QUESTION_TEMPLATE = `[legend=#284066, ${TPLTVAR_QUESTION_TEXT}]${TPLTVAR_QUESTION_ANSWER_CONTENT}[/legend]`

// Form data
let g_InterviewerName = ''; // Interviewer name
let g_IntervieweeName = ''; // Interviewee name
let g_BadgeNumber = '';     // Interviewer's badge number
let g_Participants = [];    // Interview participants to include

// Handle the file selector element...
const fileSelector = document.getElementById('logsFileInput');
fileSelector.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file.type && file.type.indexOf('text') === -1) {
        console.log('File is not a text document.', file.type, file);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        g_InterviewerName   = document.getElementById('interviewerNameInput').value;
        g_IntervieweeName   = document.getElementById('intervieweeNameInput').value;
        g_BadgeNumber       = document.getElementById('badgeNumberInput').value;
        g_Participants      = parseParticipants();

        g_Participants.push(g_InterviewerName); // The interviewer is a participant
        g_Participants.push(g_IntervieweeName); // The interviewee is a participant

        logToInterview(event.target.result);
    };

    reader.readAsText(file);
});

function logToInterview(text) {
    const rankSelectionElem = document.getElementById('rankSelection');
    const rankSelectionId = rankSelectionElem.options.selectedIndex;
    const rankName = rankSelectionElem.options[rankSelectionId].text; // Interviewer's rank

    parseChatLog(text.split('\n'));
}

function parseParticipants() {
    let participants = [];
    let participantsText = document.getElementById('otherParticipantsInput').value;
    for (let i = 0; i < participantsText.split('\n').length; i++) {
        participants.push(participantsText[i]);
    }
    return participants;
}

/*
//  An interview starts and ends the moment the following sentence is uttered:
//      "[faction rank] [full name], badge number [badge number], starting/ending interview..."
//
//  The only unique element in this sentence is the interviewer's badge number. It is
//  highly unlikely that the badge number is repeated anywhere, but just to make sure, we
//  extend the pattern to include the word "interview". The chance that these two elements
//  are put together in a non-interview context is /extremely/ low.
//  
//  An interview is marked as "ongoing" in the algorithm when both these elements are
//  uttered in the same line. Examples:
//      "Jeffrey Kendall, badge number 52511, starting interview ..."
//      "Recruitment Director, badge number 8975412, ending interview ..."
//
//  As long as both the badge number and the word 'interview' are in the same line,
//  any variation will do.
*/
function parseChatLog(lines) {
    let allQuestions = '';  // A string containing all formatted questions
    let q_Header     = '';  // A string containing the question itself
    let q_Content    = '';  // A string containing all dialog related to a single question, except for the question itself

    let isDescription = false; // Keeps track of whether the current line belongs to the description text of any participant

    let preinterviewContent = '';
    let isPreinterview = true;

    let isInterviewOngoing = false;

    for (let i = 0; i < lines.length; i++) {
        // Remove timestamps...
        lines[i] = lines[i].replace(/\[(\d)+:(\d)+:(\d)+\]/g, '');

        // Trim endlines and whitespace from the beginning of the line and 
        // the end...
        lines[i] = lines[i].trim();

        // The end/start pattern is encountered...
        if (lines[i].includes(g_BadgeNumber) && lines[i].includes("interview")) {
            // Toggle the interview state...
            isInterviewOngoing = !isInterviewOngoing;

            // The interview's ongoing state was /just/ toggled off,
            // thus the interview has ended.
            if (!isInterviewOngoing) {
                q_Content += `${lines[i]}\r\n\r\n`;

                // Commit the last question...
                allQuestions += formatQuestion(q_Header, q_Content);
    
                // Stop parsing the chat...
                break;
            }
        }

        // The interview hasn't started yet, so we don't care about the 
        // current line.
        if (!isInterviewOngoing) {
            continue;
        }

        // Skip duplicate /ame lines...
        if (i > 0 && isInterviewerAme(lines[i]) && isInterviewerAme(lines[i+1])) {
            console.log(`line skipped (duplicate ame): ${lines[i]}`);
            continue;
        }

        // Mark the start of a description and skip the line...
        if (lines[i].startsWith('___Description')) {
            isDescription = true;
            continue;
        }
        
        // As long as the current line is part of the description, skip it...
        if (isDescription) {
            // Unless it starts with "Injuries:" which is the last line of a
            // character's description.
            if (lines[i].startsWith('Injuries:')) {
                isDescription = false;
                i++; // Skip the next line as well
                continue;
            } else {
                // Skip the description line...
                continue;
            }
        }

        // If it's an irrelevant line; OOC chatter, various commands, adverts, etc.
        // then skip those too. Also, if the line wasn't sent by any participant,
        // then we don't care about it either.
        if (isMetaLine(lines[i]) || !isLineSentByParticipant(lines[i])) {
            continue;
        }

        // When the line is a roleplay emote, apply the color...
        if (isRoleplayLine(lines[i])) {
            lines[i] = `[color=#AD82CE]${lines[i]}[/color]`;
        }

        // The line is a question...
        if (lines[i].trim().endsWith('?') && lines[i].startsWith(g_InterviewerName)) {
            // The value of q_Content is the preinterview when isPreinterview = true
            if (isPreinterview) {
                preinterviewContent = q_Content;
                isPreinterview = false;
            } else {
                // Add the formatted question to the questions container...
                allQuestions += formatQuestion(q_Header, q_Content);
            }

            // Start a new formatted question...
            q_Header  = lines[i].replace(`${g_InterviewerName} says: `, ''); // remove the "says: " part from the line
            q_Content = '';
        } else {
            // Add the line to the current question if it wasn't the question...
            q_Content += `${lines[i]}\r\n\r\n`;
        }
    }

    // Output a formatted topic
    let formattedTemplate = MAIN_TEMPLATE;
    formattedTemplate = formattedTemplate.replace(TPLTVAR_PREINTERVIEW_TEXT, preinterviewContent);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_INTERVIEWEE_NAME, g_IntervieweeName);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_QUESTIONS_CONTAINER, allQuestions);
    logsContent.value = formattedTemplate;
}

// formatQuestion...
//      q_header:   the question itself
//      q_content:  the answer and all the dialog as a response to the question
function formatQuestion(q_header, q_content) {
    let formattedTemplate = QUESTION_TEMPLATE;
    formattedTemplate = formattedTemplate.replace(TPLTVAR_QUESTION_TEXT, q_header);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_QUESTION_ANSWER_CONTENT, q_content);
    return formattedTemplate;
}

// isMetaLine checks against predefined patterns of irrelevant meta chatter.
function isMetaLine(line) {
    const patterns = [
        // OOC chatter is meta...
        new RegExp(/^\(\(/),

        // Online list...
        new RegExp(/The ID of/),

        // Ads are meta...
        new RegExp(/^\[(Business |Company )?Advertisement\]/),

        // Radio chatter is meta...
        new RegExp(/(^\*\*\[S: [0-9]+ \| CH: [0-9]+\])|(-> (ALL|LSFD|LSPD|LSSD|LAW|DMEC)\])|(^\*\*\[CH: ATC\])/),

        // (Non-)Emergency calls are meta...
        new RegExp(/((EMERGENCY CALL)|(^\* Message:)|(^\* Log Number:)|(^\* Phone Number:)|(^\* Location:)|(^\* Situation:))/),
    ];

    // Step through each of the patterns and check if the line has a match...
    for (let i = 0; i < patterns.length; i++) {
        // There's a match...
        if (patterns[i].test(line)) {
            return true;
        }
    }
    return false;
}

function isLineSentByParticipant(line) {
    for (let i = 0; i < g_Participants.length; i++) {
        if (line.includes(g_Participants[i])) {
            return true;
        }
    }
    return false;
}

// when check_meta = false, the second operand of the AND operation is true,
// making it the sole responsibility of String.startsWith to influence the
// end result of this predicate. Otherwise, isMetaLine() gets to influence it
// as well. It's only fair.
function isRoleplayLine(line, check_meta = false) {
    return (line.startsWith('*') || line.startsWith('>')) && (check_meta ? !isMetaLine(line) : true);
}

function isInterviewerAme(line) {
    return line.includes(`> ${g_InterviewerName}`);
}
