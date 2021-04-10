/*
//  MIT License
//
//  Copyright (c) 2021 Acygol
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
//
//
//  By JeffersonKay - please ask before sharing this repository. I like to keep record
//  of roughly how many people this tool has reached.
//
//  Initially used for the Training and Recruitment division of the GTAW Fire Department, 
//  repurposed for the GTAW State Fire Marshals. I tried making it as generalized as possible.
//
//  Edit, copy, do whatever. I don't care. Just leave the credits; read the license.
//
//  TODO: this file needs some cleaning up, comments, etc. I'll eventually get to it.
//
*/

// Template variables
const TPLTVAR_HEADER_IMAGE_LINK       = '$HEADER_IMAGE_LINK$';       // The header image link provided by the user
const TPLTVAR_DIVBOX_COLOR            = '$DIVBOX_COLOR$';            // The color for the title divbox and the legend headers
const TPLTVAR_INTERVIEWEE_NAME        = '$INTERVIEWEE_NAME$';        // The name of the interviewee
const TPLTVAR_PREINTERVIEW_TEXT       = '$PREINTERVIEW_TEXT$';       // The preinterview text - any dialog/RP before the first question
const TPLTVAR_QUESTIONS_CONTAINER     = '$QUESTIONS_CONTAINER$';     // Replaced by a string containing all the question templates combined
const TPLTVAR_QUESTION_TEXT           = '$QUESTION_TEXT$';           // The question itself (should be limited to a single line)
const TPLTVAR_QUESTION_ANSWER_CONTENT = '$QUESTION_ANSWER_CONTENT$'; // The answer and any dialog/RP related to the question

// The main template is the parent template; individual question templates are parsed
// and then embedded within this template.
const MAIN_TEMPLATE = `[divbox=white]
[center]${TPLTVAR_HEADER_IMAGE_LINK}[/center] 

[divbox=${TPLTVAR_DIVBOX_COLOR}][color=white][center][size=150][font=AmerType Md BT]INTERVIEW - ${TPLTVAR_INTERVIEWEE_NAME}[/font][/size][/center][/color][/divbox]

[justify]
[legend=${TPLTVAR_DIVBOX_COLOR}, Preinterview]${TPLTVAR_PREINTERVIEW_TEXT}[/legend]
${TPLTVAR_QUESTIONS_CONTAINER}
[/justify]
[/divbox]

Response format:
[code]
[legend=${TPLTVAR_DIVBOX_COLOR}, Evaluation]
[b]Reviewer's name:[/b]
[b]Reviewer's badge number:[/b]
[b]Evaluation:[/b]
[b](([/b] [b]OOC Note:[/b] (optional) [b]))[/b]
[/legend]
[/code]
`

// Individual question template
const QUESTION_TEMPLATE = `[legend=${TPLTVAR_DIVBOX_COLOR}, ${TPLTVAR_QUESTION_TEXT}]${TPLTVAR_QUESTION_ANSWER_CONTENT}[/legend]`

// Errors
let g_HasError = false;
const g_ErrorDiv = document.getElementById('div-error');

// Default colors
const g_DefaultDivboxColor  = '#ffffff'; // White
const g_DefaultRoleplayColor = '#AD82CE'; // Some shade of purple

// Form data
let g_InterviewerName = ''; // Interviewer name
let g_IntervieweeName = ''; // Interviewee name
let g_BadgeNumber = '';     // Interviewer's badge number
let g_HeaderImageLink = ''; // Header image link
let g_Participants = [];    // Interview participants to include
let g_DivboxColor = '';     // Divbox color
let g_RoleplayColor = '';   // Role play color

// Handle the file selector element...
const fileSelector = document.getElementById('input-chatlog-file');
fileSelector.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file.type && file.type.indexOf('text') === -1) {
        console.log('File is not a text document.', file.type, file);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        g_InterviewerName   = document.getElementById('input-interviewer-name').value;
        g_IntervieweeName   = document.getElementById('input-interviewee-name').value;
        g_BadgeNumber       = document.getElementById('input-interviewer-badge').value;
        g_HeaderImageLink   = parseImgurLink();
        g_DivboxColor       = parseColor('input-divbox-color', g_DefaultDivboxColor);
        g_RoleplayColor     = parseColor('input-roleplay-color', g_DefaultRoleplayColor);
        g_Participants      = parseParticipants();

        // Only parse when there weren't any custom errors.
        if (!g_HasError) {
            parseChatLog(event.target.result.split('\n'));
        }
        g_HasError = false; // Don't force the user to refresh after correcting an error.
    };

    reader.readAsText(file);
});

function parseParticipants() {
    let participants = [];
    let participantsText = document.getElementById('input-participants-names').value;
    for (let i = 0; i < participantsText.split('\n').length; i++) {
        participants.push(participantsText[i]);
    }
    participants.push(g_InterviewerName); // The interviewer is a participant.
    participants.push(g_IntervieweeName); // The interviewee is a participant.
    return participants;
}

function parseImgurLink() {
    let headerLink = document.getElementById('input-header-img-link').value;
    if (headerLink)
    {
        // When the header link isn't conforming to the format, let the user know.
        if (!(headerLink.endsWith('.png') || headerLink.endsWith('.jpeg'))) {
            showError("The provided Imgur link isn't valid. Double check that it has .jpeg or .png at the end.");
            return;
        }

        headerLink = `[img]${headerLink}[/img]`;
    }
    return headerLink;
}

function parseColor(elementId, defaultValue = "") {
    let element = document.getElementById(elementId);
    if (element == null) {
        console.log("This shouldn't happen... Unless someone's been toying with the source code. Anyway, parseColor argument elementId is null.");
        return;
    }

    let color = element.value;

    // Assign the default value if the user hasn't entered a color code.
    if (!color)
        color = defaultValue;

    // Append the '#' necessary for BB code to recognize the color if the user forgot
    // to include it. No biggie, I will add it for you, dear user.
    if (!color.startsWith('#')) {
        color = '#' + color;
    }
    return color;
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
        if (i < lines.length && isInterviewerAme(lines[i]) && isInterviewerAme(lines[i+1])) {
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
            lines[i] = `[color=${g_RoleplayColor}]${lines[i]}[/color]`;
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
    formattedTemplate = formattedTemplate.replace(TPLTVAR_HEADER_IMAGE_LINK, g_HeaderImageLink);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_PREINTERVIEW_TEXT, preinterviewContent);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_INTERVIEWEE_NAME, g_IntervieweeName);
    formattedTemplate = formattedTemplate.replace(TPLTVAR_QUESTIONS_CONTAINER, allQuestions);

    const divColorRegex = new RegExp(escapeRegExp(TPLTVAR_DIVBOX_COLOR), 'g');
    formattedTemplate = formattedTemplate.replace(divColorRegex, g_DivboxColor);
    document.getElementById('output-box').value = formattedTemplate;
}

function escapeRegExp(unescapedString) {
    return unescapedString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// formatQuestion...
//      q_header:   the question itself
//      q_content:  the answer and all the dialog as a response to the question
function formatQuestion(q_header, q_content) {
    let formattedTemplate = QUESTION_TEMPLATE;
    formattedTemplate = formattedTemplate.replace(TPLTVAR_DIVBOX_COLOR, g_DivboxColor);
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

function showError(error) {
    g_ErrorDiv.className = "alert alert-danger my-4";
    g_ErrorDiv.innerHTML = `${error}`;
    g_HasError = true;

    // Force the user back to the top. They may not see the error otherwise.
    g_ErrorDiv.scrollIntoView();
}
