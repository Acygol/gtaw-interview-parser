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
const g_DefaultDivboxColor  = '#284066'; // Some shade of blue
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

    // The interview couldn't be parsed.
    if (!allQuestions) {
        showError("The parser was unable to locate the start of the interview. Make sure your badge number and the word \"interview\" are in the same sentence.");
        return;
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

// Word from God; credits to: https://jcpsimmons.github.io/Godspeak-Generator/
// I simply reminded God of some words, for He knew all
const godsVocabularySerbian = [
    "као", "И", "његов", "да", "он", "био", "за", "о", "су", "с", "они", "бити", "ат", "један", "имају", "Ова", 
    "из", "би", "Хот", "реч", "али", "ста", "неки", "је", "она", "ви", "или", "Имао", "ово", "од", "до", 
    "и", "Старт", "у", "ми", "цан", "напоље", "Друго", "су", "која", "учинити", "њихове", "Време", "ако", "воља", "како", 
    "рекао", "Породица", "сваки", "рећи", "не", "Сет", "три", "Желим", "аир", "добро", "такође", "плаи", "мала", "крај", "пут", 
    "дом", "прочитајте", "рука", "Порт", "велика", "спелл", "адд", "чак", "Ланд", "овде", "муст", "велики", "висока", "таква", "фоллов", 
    "Закон", "зашто", "аск", "мен", "Цханге", "отишао", "Лигхт", "врста", "Офф", "треба", "Хоусе", "пицтуре", "пробајте", "нас", "Опет", 
    "Анимал", "Поинт", "мајка", "свет", "близу", "изградити", "Селф", "Еартх", "отац", "Ани", "Нев", "Рад", "парт", "узети", "добити", 
    "место", "маде", "ливе", "где је", "после", "Назад", "литтле", "Само", "Роунд", "човек", "године", "дошао", "Схов", "сваки", "гоод", 
    "ме", "даје", "Наш", "под", "Назив", "веома", "кроз", "само", "облик", "реченица", "велики", "мисли", "кажу", "помоћ", "низак", 
    "линија", "разликују", "ред", "Узрок", "много", "значити", "пре", "потез", "Право", "дечак", "Олд", "сувише", "Исто", "она", "све", 
    "тамо", "када", "уп", "користити", "Ваш", "ваи", "Абоут", "многи", "онда", "им", "пишу", "би", "као", "тако", "ово", 
    "јој", "лонг", "направити", "ствар", "видети", "га", "два", "има", "изгледа", "више", "дан", "могао", "иди", "доћи", "јесте", 
    "број", "звук", "Но", "мост", "људи", "мој", "преко", "знам", "вода", "од", "позив", "Прво", "који", "мај", "довн", 
    "страна", "био", "сада", "наћи", "глава", "станд", "сопствени", "паге", "треба", "Цоунтри", "фоунд", "одговор", "Сцхоол", "расти", "Студија", 
    "још", "научити", "биљка", "цовер", "Фоод", "Сун", "четири", "између", "држава", "задржати", "Еие", "никад", "Ласт", "лет", "Мислио", 
    "Град", "дрво", "цросс", "фарм", "тежак", "Старт", "моћ", "прича", "Сав", "далеко", "Сеа", "драв", "напустио", "касно", "рун", 
    "немој", "док", "Пресс", "близу", "Нигхт", "прави", "живот", "мало", "север", "књига", "носе", "узео", "Наука", "еат", "Соба", 
    "пријатељ", "почела", "Идеја", "Фисх", "Моунтаин", "престати", "једном", "база", "хеар", "Хорсе", "Цут", "сигуран", "ватцх", "боја", "фаце", 
    "Воод", "Маин", "отворен", "Изгледа", "заједно", "Следећа", "Бела", "Деца", "бегин", "Имам", "валк", "Пример", "олакшати", "папир", "група", 
    "Увек", "Мусиц", "они", "оба", "ознака", "Често", "леттер", "до", "Миле", "Ривер", "ауто", "феет", "Царе", "Други", "Довољно", 
    "Плаин", "девојка", "уобичајено", "Млади", "реади", "изнад", "икад", "Црвена", "листа", "мада", "осетити", "Разговор", "Бирд", "Ускоро", "боди", 
    "Дог", "Породица", "Дирецт", "посе", "оставити", "Сонг", "мерење", "врата", "Продуцт", "Црна", "кратак", "нумерал", "Класа", "ветар", "Питање", 
    "деси", "комплетан", "Схип", "Ареа", "халф", "Роцк", "редослед", "Фире", "југ", "Проблем", "комад", "Рекао", "Знао", "проћи", "Од", 
    "топ", "Цела", "Кинг", "улица", "инцх", "помножите", "ништа", "Курс", "остани", "точак", "пун", "сила", "Плава", "објекат", "одлучује", 
    "Сурфаце", "Дееп", "Моон", "Исланд", "Фоот", "Систем", "заузет", "Тест", "Рекорд", "Боат", "заједнички", "злато", "могуће", "Плане", "Уместо тога", 
    "суво", "Питам се", "смех", "хиљада", "Пре", "ран", "цхецк", "Гаме", "Облик", "изједначавају", "Хот", "Мисс", "Донео", "топлоте", "Снов", 
    "гума", "доносе", "да", "дистант", "попунити", "источно", "боја", "Лангуаге", "међу", "јединица", "повер", "Град", "фино", "известан", "фли", 
    "пасти", "води", "крик", "Дарк", "машина", "НАПОМЕНА", "ваит", "План", "Слика", "звезда", "бок", "именица", "поље", "одмор", "исправан", 
    "стању", "Поунд", "доне", "Беаути", "Дриве", "стајао", "садржати", "Фронт", "учи", "недеља", "коначни", "дао", "Зелена", "ох", "Брзо", 
    "развити", "Оцеан", "топло", "бесплатно", "минут", "јака", "специал", "минд", "иза", "Цлеар", "реп", "производе", "чињеница", "спаце", "Чуо", 
    "бест", "сат", "боље", "прави", "током", "сто", "Фиве", "запамтите", "корак", "рано", "држите", "запад", "тло", "Интерест", "достићи", 
    "Фаст", "глагол", "певати", "листен", "шест", "Табле", "травел", "мање", "морнинг", "десет", "Симпле", "неколико", "самогласник", "ка", "рат", 
    "лаи", "против", "Паттерн", "споро", "Центар", "лове", "Лице", "новац", "служе", "појављују", "пут", "Карта", "Раин", "Правило", "регулишу", 
    "повући", "хладно", "белешка", "Воице", "Енерги", "Хунт", "вероватно", "Бед", "брат", "Егг", "вожња", "ћелија", "Верујем", "можда", "пицк", 
    "изненадна", "цоунт", "Скуаре", "Разлог", "дужина", "представљају", "Арт", "Предмет", "регион", "Величина", "варирају", "реше", "спеак", "Тежина", "Генерал", 
    "ице", "материја", "Цирцле", "паир", "укључују", "Дивиде", "слог", "осећао", "Гранд", "лопта", "још", "талас", "дроп", "хеарт", "пм", 
    "присутна", "тежак", "Данце", "Енгине", "позиција", "рука", "виде", "Саил", "Материјал", "фракција", "шума", "седети", "раса", "прозор", "Сторе", 
    "Суммер", "Траин", "Слееп", "доказати", "усамљен", "нога", "вежба", "Валл", "Цатцх", "Моунт", "жеља", "Ски", "Боард", "Јои", "Винтер", 
    "Сат", "написано", "Вилд", "инструмент", "чува", "Стакло", "трава", "крава", "Јоб", "ивица", "знак", "Висит", "прошлост", "Софт", "фун", 
    "бригхт", "гас", "Временска прогноза", "месец", "милиона", "беар", "финисх", "срећан", "Надам се", "Фловер", "облачити", "чудно", "гоне", "Траде", "Мелоди", 
    "Трип", "канцеларија", "добијају", "ред", "уста", "тачан", "Симбол", "дие", "Најмање", "невоља", "Схоут", "осим", "написао", "семе", "тоне", 
    "придружи", "сугеришу", "Цлеан", "Бреак", "Лади", "Иард", "рисе", "бад", "ударац", "уље", "Блоод", "додирнути", "растао", "цент", "мик", 
    "тим", "жица", "трошкови", "Изгубио", "Бровн", "носе", "Гарден", "једнак", "послао", "изабрати", "пала", "фит", "флов", "Фаир", "Банк", 
    "прикупља", "сачувати", "контрола", "децимал", "ЕАР", "друго", "сасвим", "поломио", "цасе", "Миддле", "убити", "син", "Лаке", "тренутак", "скала", 
    "гласно", "пролеће", "посматрати", "дете", "страигхт", "сугласник", "народ", "Речник", "млеко", "Спеед", "метод", "орган", "плате", "старост", "Секција", 
    "хаљина", "Цлоуд", "изненађење", "Куиет", "Стоне", "тини", "цлимб", "Цоол", "дизајн", "лоша", "лот", "експеримент", "боттом", "Кеи", "Ирон", 
    "Сингле", "Стицк", "стан", "двадесет", "кожа", "смиле", "бразда", "Холе", "јумп", "Баби", "осам", "Виллаге", "меет", "Роот", "буи", 
    "подићи", "решити", "Метал", "без обзира да ли", "Пусх", "седам", "став", "трећи", "ће", "Хелд", "Хаир", "описати", "Цоок", "спрат", "или", 
    "резултат", "бурн", "хилл", "безбедан", "Цат", "век", "размотрити", "Типе", "Закон", "бит", "Цоаст", "Цопи", "фраза", "нем", "талл", 
    "Санд", "земљишта", "ролна", "Температура", "прст", "Индустрија", "вриједност", "Фигхт", "лаж", "беат", "узбуђују", "природни", "Виев", "осећање", "капитал", 
    "неће", "столица", "опасност", "Фруит", "богат", "дебела", "војник", "Процес", "раде", "пракса", "Посебан", "тешко", "лекар", "молим те", "заштитити", 
    "Ноон", "Цроп", "модеран", "елемент", "ударити", "студент", "Цорнер", "Парти", "снабдевање", "чији", "лоцирати", "ринг", "карактер", "инсеката", "ухваћен", 
    "период", "указују", "Радио", "крака", "атома", "људски", "Историја", "ефект", "Елецтриц", "очекују", "кост", "раил", "замислите", "обезбедити", "слажем", 
    "тако", "нежан", "Жена", "капетан", "Ваљда", "неопходно", "схарп", "Винг", "створити", "комшија", "Васх", "Бат", "прилично", "публика", "кукуруз", 
    "упоредити", "песма", "стринг", "Белл", "зависе", "месни", "руб", "Тубе", "познати", "Доллар", "поток", "страх", "призор", "танак", "Триангле", 
    "Планет", "пожури", "Цхиеф", "колонија", "Цлоцк", "Мине", "Тие", "ентер", "мајор", "Фресх", "претраживање", "сенд", "жут", "Гун", "дозволи", 
    "штампа", "деад", "Спот", "десерт", "одело", "струја", "Лифт", "росе", "стижу", "Мастер", "Трацк", "родитељ", "Схоре", "Дивисион", "лист", 
    "супстанца", "фаворизовати", "цоннецт", "Пост", "троше", "акорд", "масти", "драго", "оригинал", "Схаре", "Статион", "тата", "хлеб", "наплаћују", "Правилно", 
    "Бар", "Понуда", "сегмент", "роб", "Дуцк", "Инстант", "тржиште", "степен", "населити", "цхицк", "Деар", "Енеми", "одговорити", "пиће", "доћи", 
    "Суппорт", "Говор", "Природа", "домет", "Стеам", "Мотион", "путања", "течност", "лог", "значило", "количник", "зуби", "шкољка", "врат", "кисеоник", 
    "шећер", "Деатх", "прилично", "вештина", "жене", "Сеасон", "Решење", "магнет", "силвер", "хвала", "грана", "Матцх", "суфикс", "посебно", "фиг", 
    "уплашен", "огроман", "сестра", "Стеел", "дискутовати", "напред", "слично", "водич", "Искуство", "скор", "Аппле", "купио", "водио", "нагиб", "капут", 
    "маса", "картица", "трака", "конопац", "Слип", "вин", "дреам", "вече", "услов", "феед", "алат", "Укупно", "Басиц", "мирис", "Валлеи", 
    "нити", "Доубле", "Сеат", "наставити", "Блоцк", "графикон", "шешир", "продају", "успех", "цомпани", "одузмите", "Евент", "Посебно", "договор", "Свим", 
    "Термин", "супротно", "супруга", "Схое", "раме", "спреад", "организовати", "камп", "инвент", "памук", "Борн", "одредити", "куарт", "девет", "Камион", 
    "бука", "Ниво", "шанса", "окупљају", "Схоп", "Стретцх", "бацити", "схине", "Проперти", "колона", "молекул", "изаберите", "погрешно", "греи", "Репеат" 
]

const godsVocabularyLithuanian = [
    "kaip", "Aš", "jo", "kad", "jis", "buvo", "už", "nuo", "yra", "su", "jie", "būti", "pradėjo", "vienas", "turėti", "tai", 
    "nuo", "pagal", "karštas", "žodis", "tačiau", "ką", "kai", "yra", "ji", "jūs", "arba", "buvo", "pamatyti", "iš", "į", 
    "ir", "grožis", "matyti", "mes", "galima", "iš", "kitas", "buvo", "kurie", "padaryti", "jų", "laikas", "jei", "bus", "kaip", 
    "sakė", "kiekvienas", "pasakyti", "daro", "rinkinys", "trijų", "noriu", "oro", "gerai", "taip pat", "žaisti", "mažas", "pabaiga", "sudėti", "namai", 
    "skaityti", "rankų", "uostas", "didelis", "reikšti", "pridėti", "net", "žemės", "čia", "turi", "didelis", "aukštas", "toks", "sekti", "aktas", 
    "kodėl", "paklausti", "vyrai", "pokytis", "nuvyko", "šviesa", "natūra", "nuo", "reikėti", "namas", "nuotrauka", "pabandyti", "mums", "vėl", "gyvūnas", 
    "taškas", "motina", "pasaulis", "šalia", "statyti", "savarankiškai", "žemė", "tėvas", "bet koks", "nauja", "darbas", "dalis", "imti", "gauti", "vieta", 
    "padarė", "gyventi", "kur", "po", "atgal", "mažai", "tik", "turas", "vyras", "metai", "atėjo", "šou", "kiekvienas", "geras", "mane", 
    "duoti", "mūsų", "pagal", "pavadinimas", "labai", "per", "tiesiog", "forma", "sakinys", "puikus", "galvoti", "pasakyti", "padėti", "žemas", "linija", 
    "skiriasi", "posūkis", "priežastis", "daug", "reiškia", "prieš", "Perkelti", "teisė", "berniukas", "senas", "taip pat", "tas pats", "ji", "visi", "ten", 
    "kai", "į viršų", "naudoti", "savo", "būdas", "apie", "daug", "tada", "jiems", "rašyti", "būtų", "kaip", "taip", "tai", "jos", 
    "ilgai", "padaryti", "dalykas", "pamatyti", "jį", "du", "turi", "žiūrėti", "daugiau", "dieną", "galėtų", "eiti", "ateiti", "padarė", "skaičius", 
    "garso", "ne", "dauguma", "žmonės", "mano", "per", "žinoti", "vanduo", "nei", "kvietimas", "pirmas", "kas", "gali", "žemyn", "pusė", 
    "buvo", "dabar", "rasti", "vadovas", "stovėti", "savo", "puslapis", "turėtų", "šalis", "rasti", "atsakymas", "mokykla", "augti", "tyrimas", "dar", 
    "sužinoti", "augalų", "dangtis", "maistas", "saulė", "keturi", "tarp", "valstybės", "išlaikyti", "akių", "niekada", "paskutinis", "tegul", "mintis", "miestas", 
    "medis", "kirsti", "ūkis", "sunku", "pradžia", "might", "istorija", "pjūklas", "toli", "jūra", "atkreipti", "į kairę", "vėlai", "paleisti", "nėra", 
    "o", "paspauskite", "arti", "naktis", "tikras", "gyvenimas", "mažai", "į šiaurę", "knyga", "vykdyti", "paėmė", "mokslas", "valgyti", "kambario", "draugas", 
    "pradėjo", "idėja", "žuvis", "kalnas", "sustabdyti", "kartą", "bazė", "išgirsti", "arklys", "supjaustyti", "tikrai", "žiūrėti", "spalva", "veido", "medienos", 
    "pagrindinis", "atvira", "atrodo", "kartu", "kitas", "baltas", "vaikai", "pradėti", "turiu", "vaikščioti", "pavyzdys", "palengvinti", "popieriaus", "grupė", "visada", 
    "muzika", "tie", "abu", "ženklas", "dažnai", "laiškas", "iki", "mylių", "upės", "automobilių", "pėdų", "priežiūra", "antra", "pakankamai", "paprastas", 
    "mergina", "įprasta", "jauna", "pasiruošęs", "aukščiau", "kada nors", "raudonas", "sąrašas", "nors", "jausti", "aptarimas", "paukštis", "greičiau", "kūnas", "šuo", 
    "šeima", "tiesiogiai", "kelti", "palikti", "daina", "matuoti", "durys", "produktas", "juodas", "trumpas", "skaitvardis", "klasė", "vėjas", "klausimas", "atsitikti", 
    "pilnas", "laivas", "plotas", "pusė", "rokas", "kad", "gaisro", "į pietus", "problema", "gabalas", "sakė", "žinojo", "pereiti", "nuo", "viršus", 
    "visas", "karalius", "gatvės", "colis", "daugintis", "nieko", "Žinoma", "likti", "ratų", "pilnas", "jėga", "mėlynas", "objektas", "nuspręsti", "paviršius", 
    "giliai", "mėnulis", "sala", "pėda", "sistema", "užimtas", "testas", "įrašas", "valtis", "bendras", "aukso", "galimas", "lėktuvas", "sodyba", "sausas", 
    "nenuostabu", "juokas", "tūkstančių", "prieš", "Arklys", "patikrinti", "žaidimas", "forma", "prilygti", "karštas", "praleisti", "atnešė", "šilumos", "sniego", "padanga", 
    "atnešti", "taip", "tolimas", "užpildyti", "į rytus", "dažai", "kalba", "tarp", "vienetas", "galia", "miestas", "gerai", "tikras", "skristi", "patenka", 
    "vadovauti", "šauksmas", "tamsus", "mašina", "pastaba", "laukti", "planas", "figūra", "žvaigždė", "dėžutė", "daiktavardis", "srityje", "poilsio", "teisingas", "sugebėti", 
    "svaras", "padirbtas", "grožis", "vairuoti", "stovėjo", "būti", "priekinis", "mokyti", "savaitę", "galutinis", "davė", "žalia", "oh", "greitai", "plėtoti", 
    "vandenynas", "šiltas", "nemokamai", "minučių", "stiprus", "ypatingą", "protas", "už", "aišku", "uodega", "gaminti", "faktas", "vietos", "girdėjau", "geriausias", 
    "valandos", "geriau", "tiesa", "metu", "šimtai", "penki", "prisiminti", "žingsnis", "anksti", "palaikykite", "vakarų", "žemės", "palūkanos", "pasiekti", "greitai", 
    "veiksmažodis", "dainuoti", "klausyti", "šešių", "lentelė", "kelionė", "mažiau", "rytas", "dešimt", "paprastas", "kelis", "balsis", "link", "karas", "padėti", 
    "prieš", "modelis", "lėtai", "centras", "patinka", "asmuo", "pinigai", "tarnauti", "pasirodyti", "kelių", "žemėlapis", "lietus", "taisyklė", "reglamentuoja", "traukti", 
    "šaltas", "pranešimas", "balsas", "energija", "medžioklė", "tikėtina", "lova", "brolis", "kiaušinis", "važinėti", "ląstelė", "tikėti", "galbūt", "pasirinkti", "staiga", 
    "skaičiuoti", "aikštė", "priežastis", "ilgis", "atstovauti", "menas", "tema", "regionas", "dydis", "skirtis", "atsiskaityti", "kalbėti", "svoris", "bendras", "ledas", 
    "nesvarbu", "ratas", "pora", "įtraukti", "takoskyra", "skiemuo", "jaučiamas", "didysis", "kamuoliukas", "dar", "banga", "lašas", "širdis", "pm", "metu", 
    "sunkus", "šokis", "variklis", "pozicija", "ranka", "pločio", "burė", "medžiaga", "frakcija", "miškas", "sėdėti", "varžybos", "langas", "parduotuvė", "vasara", 
    "traukinys", "miegas", "įrodyti", "vienišas", "koja", "pratimas", "sienos", "laimikis", "kalno", "norėti", "dangus", "lenta", "džiaugsmas", "žiema", "sat", 
    "parašyta", "laukinis", "priemonė", "laikomi", "stiklas", "žolė", "karvė", "darbas", "kraštas", "ženklas", "apsilankymas", "praeitis", "minkštas", "malonumas", "šviesus", 
    "dujos", "oras", "mėnesį", "milijonas", "būti", "apdaila", "laimingas", "tikiuosi", "gėlė", "aprengti", "keista", "dingo", "prekyba", "melodija", "Kelionės", 
    "biuras", "gauti", "eilė", "burna", "tikslus", "simbolis", "mirti", "mažiau", "bėda", "šaukti", "išskyrus", "rašė", "sėklos", "tonas", "prisijungti", 
    "pasiūlyti", "švarus", "pertrauka", "panele", "kiemas", "padidės", "blogas", "smūgis", "alyva", "kraujo", "paliesti", "augo", "centas", "maišyti", "komanda", 
    "vielos", "kaina", "prarado", "rudi", "dėvėti", "sodas", "lygūs", "siunčiami", "pasirinkti", "sumažėjo", "tinka", "tekėti", "sąžininga", "bankas", "rinkti", 
    "išsaugoti", "valdymas", "dešimtainis", "ausis", "kitas", "gana", "sumušė", "atveju", "vidurys", "nužudyti", "sūnus", "ežeras", "akimirka", "skalė", "garsiai", 
    "pavasaris", "stebėti", "vaikas", "tiesiai", "priebalsis", "tauta", "žodynas", "pienas", "greitis", "metodas", "organas", "mokėti", "amžius", "skyrius", "suknelė", 
    "debesis", "staigmena", "ramus", "akmuo", "mažytis", "lipti", "kietas", "dizainas", "prastas", "daug", "eksperimentas", "apačia", "raktas", "geležies", "vieno", 
    "Stick", "butas", "dvidešimt", "oda", "šypsena", "raukšlėtis", "skylė", "šuolis", "kūdikis", "aštuoni", "kaimas", "patenkinti", "šaknis", "pirkti", "pakelti", 
    "išspręsti", "metalo", "ar", "stumti", "septyni", "punktas", "trečia", "turi", "rankinė", "plaukai", "apibūdinti", "virėjas", "aukštas", "arba", "rezultatas", 
    "deginti", "kalnas", "saugus", "katė", "amžius", "apsvarstyti", "tipas", "teisė", "tiek", "pakrantė", "kopija", "frazė", "tylus", "aukštas", "smėlio", 
    "dirvožemis", "ritinys", "temperatūra", "pirštas", "pramonė", "vertė", "kova", "melas", "įveikti", "sužadinti", "natūralus", "vaizdas", "jausmas", "kapitalas", "nebus", 
    "kėdė", "pavojus", "vaisiai", "turtingas", "storas", "Eilinis", "procesas", "veikia", "praktika", "atskiras", "sunkus", "gydytojas", "Prašom", "apsaugoti", "vidurdienis", 
    "pasėlių", "modernus", "elementas", "nukentėjo", "studentas", "kampas", "šalis", "tiekimas", "kurio", "rasti", "žiedas", "charakteris", "vabzdžių", "sugauti", "laikotarpis", 
    "rodo", "radijo", "kalbėjo", "atomas", "žmogaus", "istorija", "poveikis", "elektros", "tikėtis", "kaulas", "geležinkelių", "įsivaizduoti", "teikti", "susitarti", "taip", 
    "švelnus", "moteris", "kapitonas", "atspėti", "reikalingas", "aštrus", "sparnas", "kurti", "kaimynas", "skalbimas", "bat", "gana", "minia", "kukurūzai", "palyginti", 
    "eilėraštis", "styga", "varpas", "priklauso", "mėsa", "rublių", "vamzdis", "garsus", "doleris", "srautas", "baimė", "reginys", "plonas", "trikampis", "planeta", 
    "skubėti", "vyriausiasis", "kolonija", "laikrodis", "mano", "kaklaraištis", "įeiti", "pagrindinis", "švieži", "paieška", "siųsti", "geltonas", "pistoletas", "leisti", "Spausdinti", 
    "miręs", "vieta", "dykuma", "kostiumas", "dabartinis", "keltuvas", "rožė", "atvykti", "meistras", "takelis", "tėvų", "kranto", "skyrius", "lapas", "medžiaga", 
    "pirmenybę", "prisijungti", "pranešimas", "praleisti", "styga", "riebalų", "malonu", "originalus", "dalis", "stotis", "tėtis", "duona", "imti", "tinkamas", "baras", 
    "pasiūlymas", "segmentas", "vergas", "antis", "momentinis", "rinka", "laipsnis", "užpildyti", "jauniklį", "brangusis", "priešas", "atsakinėti", "gėrimas", "atsirasti", "parama", 
    "kalbos", "pobūdis", "diapazonas", "garo", "pasiūlymas", "kelias", "skystis", "prisijungti", "reiškia", "dalmuo", "dantys", "apvalkalas", "kaklas", "deguonies", "cukraus", 
    "mirtis", "gana", "įgūdžių", "moterys", "sezonas", "sprendimas", "magnetas", "sidabras", "ačiū", "filialas", "rungtynės", "priesaga", "ypač", "pav", "bijau", 
    "didžiulis", "sesuo", "plieno", "aptarti", "pirmyn", "panašus", "vadovas", "patirtis", "rezultatas", "obuolių", "nusipirkau", "lėmė", "pikis", "kailis", "masė", 
    "kortelė", "grupė", "virvės", "slydimo", "laimėti", "svajonė", "vakaras", "sąlyga", "pašarai", "priemonė", "visas", "pagrindinis", "kvapas", "slėnis", "nei", 
    "dvigubai", "sėdynė", "toliau", "blokas", "schema", "skrybėlė", "parduoti", "sėkmė", "įmonė", "atimti", "renginys", "pirma", "spręsti", "plaukti", "terminas", 
    "priešais", "žmona", "batų", "petys", "plitimas", "susitarti", "stovykla", "sugalvoti", "medvilnės", "Gimė", "nustatyti", "kvorta", "devyni", "sunkvežimis", "triukšmas", 
    "lygis", "tikimybė", "surinkti", "parduotuvė", "ruožas", "mesti", "valymo", "turtas", "stulpelis", "molekulė", "pasirinkti", "negerai", "pilka", "pakartokite", "reikalauti"
]

const godsVocabulary = [
    "African", "Angel", "BBC", "BRB", "Bam", "Boo", "Burp", "CIA", "California", "Catastrophic Success", "China", "Church", 
    "Cosmos", "Dad", "Dudly Doright", "FBI", "GarryKasparov", "Ghost", "Give me praise", "God", "God is not mocked", "God smack", 
    "Greece", "Greek to me", "Han shot first", "Hasta", "Heaven", "Hicc up", "HolySpirit", "I'll ask nicely", "I'll be back", 
    "I'll get right on it", "I'll let you know", "I'll think about it", "I'm God and you're not", "I'm God who the hell are you", 
    "I'm beginning to wonder", "I'm bored", "I'm busy", "I'm done", "I'm feeling nice today", "I'm gonna smack someone", 
    "I'm good you good", "I'm grieved", "I'm impressed", "I'm in suspense", "I'm not dead yet", "I'm not sure", "I'm off today", 
    "I'm on a roll", "I'm the boss", "I'm thrilled", "I'm tired of this", "IMHO", "I am not amused", "I be like", "I can't believe it", 
    "I could be wrong", "I could swear", "I didn't do it", "I didn't see that", "I don't care", "I donno", "I forgot", "I give up", "I got your back", 
    "I had a crazy dream", "I hate when that happens", "I have an idea", "I just might", "I love this", "I love you", "I made it that way", 
    "I pity the fool", "I planned that", "I quit", "I see nothing", "I veto that", "I was just thinking", "I was sleeping", "Icarus", 
    "If had my druthers", "Is that so", "Is that your final answer", "Isn't that special", "It's nice being God", "It grieves me", 
    "Ivy league", "Japan", "Jedi mind trick", "Jesus", "King Midas", "Knock you upside the head", "LOL", "Make America Great Again", 
    "Mars", "Mission Accomplished", "Mom", "Moses", "NOT", "NeilDeGrasseTyson", "Trump", "Oh Hell No", "Oh really", "Okilydokily", 
    "One finger salute", "Oy", "Pope", "Putin", "Pullin the dragons tail", "ROFLMAO", "Russia", "Shakespeare", "Shalom", "Shhh", 
    "StephenHawking", "SupremerCourt", "Terry", "That's gonna leave a mark", "That's my favorite", "The good stuff", "This is confusing", 
    "Varoom", "Vegas", "Venus", "Watch this", "What", "What I want", "What are you doing Dave", "WooHoo", "Wow", "Yawn", "Yes you are", 
    "Yo", "You can count on that", "You da man", "You fix it", "You get what you pray for", "You know", "Zap", "Zzzzzzzz", "a flag on that play", 
    "a likely story", "a screw loose", "abnormal", "absetively posilutely", "absolutely", "act", "adjusted for inflation", "adultery", "after a break", 
    "ahh", "ahh thats much better", "air head", "and the award goes to", "and then what", "angel", "anger", "application", "are you deaf", 
    "are you feeling lucky", "are you insane", "are you sure", "arent you clever", "arrogant", "as a matter of fact", "astounding", 
    "astronomical", "astrophysics", "atheist", "atrocious", "au revoir", "awesome", "awful", "ba ha", "bad", "bad ol puddytat", 
    "baffling", "bank", "basically", "basket case", "bastard", "battle", "be happy", "be quiet bird", "beam me up", "because I said so", 
    "beep beep", "begs the question", "bickering", "big fish", "biggot", "birds", "bizarre", "blessing", "boink", "boss", "break some woopass on you", 
    "bring it on", "bummer", "busybody", "but of course", "by the way", "bye", "can you hear me now", "car", "catastrophe", "caution", 
    "chaos", "charged", "charity", "check this out", "cheerful", "chess", "chill", "chill out", "choose one", "chump change", "church", 
    "class  class  shutup", "clever", "climate", "close your eyes", "come and get me", "comedy", "commanded", "completely", "computers", "conservative", 
    "cosmetics", "could it be   Satan", "couldn't be better", "couldnt possibly", "courage", "cowardice", "cracks me up", 
    "crash and burn", "crazy", "cursing", "dance", "dang it", "daunting", "dean scream", "debt", "delicious", "delightful", 
    "depressing", "desert", "didn't I say that", "dignity", "do I have to", "do it", "do not disturb", "do over", "do you get a cookie", 
    "do you have a problem", "do you know what time it is", "do you like it", "do you want another", "doh", "don't count on it", 
    "don't even think about it", "don't have a cow", "don't mention it", "don't push it", "don't worry", "downer", "drama", "driving", 
    "duck the shoe", "dude such a scoffer", "earnest", "economy", "eh", "ehh a wise guy", "ehheh that's all folks", "employee", 
    "employer", "end", "endeared", "endeavor", "endure", "energy", "enough", "enough said", "envy", "epic fail", "et tu", 
    "everything's a okay", "evolution", "exorbitant", "experts", "exports", "fabulous", "face palm", "failure is not an option", 
    "failure to communicate", "fake", "fancy", "far out man", "fer sure", "fight", "figuratively", "food", "fool", "fortitude", 
    "foul", "freak", "frown", "fun", "funny", "furious", "gambling", "game changer", "game over", "geek", "genius", "ghastly", "ghetto", 
    "glam", "glorious", "gluttony", "go ahead make my day", "good", "Good... Go-ood... dog...", "gosh", "gross", "grumble", "guilty", 
    "guppy", "ha", "handyman", "hang in there", "happy", "happy happy joy joy", "hard working", "harder than it looks", "hate", "have fun", 
    "he be like", "heads I win tails you lose", "heathen", "hello", "here now", "hey Mikey he likes it", "hey thats right", "hi", "high five", 
    "high mucky muck", "hilarious", "hippy", "hit", "ho ho ho", "hobnob", "hold on a minute", "holier than thou", "holy grail", "home", 
    "homo", "honestly", "honesty", "hooah", "hope", "hopefully", "horrendous", "hot air", "hotel", "how's the weather", "how about", 
    "how about that", "how about those yankees", "how bout it", "how come", "how could you", "how do I put this", "how goes it", 
    "how hard could it be", "how high", "huh", "humility", "humongous", "hurts my head", "husband", "hypocrite", "ice cream", "if and only if", 
    "if anything can go wrong", "illogical", "imports", "impossible", "in a galaxy far far away", "in a perfect world", "in other words", 
    "in practice", "in theory", "incoming", "incredibly", "industrious", "ingrate", "insane", "ipod", "is it just me or", "it'd take a miracle", 
    "it's hopeless", "it's my world", "it figures", "it gets better", "it was nothing", "jealousy", "job", "jobs", "joke", "joker", 
    "joking", "joy", "joyful", "just between us", "just lovely", "kick back", "kludge", "later", "laziness", "left field", "let's roll", 
    "let's see", "let me count the ways", "liberal", "lift", "lighten up", "like like", "listen buddy", "little buddy", "little fish", 
    "look buddy", "look on the brightside", "look out", "love", "lulz", "lust", "lying", "make my day", "manufacturing", "maybe I didn't make it clear", 
    "meek", "meh", "merry christmas", "middle class", "mine", "mission from God", "mocking", "money", "mundo stoked", "music", "my bad", 
    "my precious", "na na", "nasty", "naughty", "nerd", "nevada", "never happy", "news to me", "no more", "no more tears", "no news is good news", 
    "no way dude", "no you cant", "nope", "not", "not a chance in hell", "not good", "not in kansas anymore", "not in my wildest dreams", 
    "not that theres anything wrong", "not the sharpest knife in the drawer", "not too shabby", "now that I think about it", "now you tell me", 
    "nut job", "obviously", "off the record", "oh come on", "oh my", "oh no", "oh oh", "ohh thank you", "oil", "okay", "on occassion", 
    "on the otherhand", "once upon a time", "one more time", "one small step", "oops", "ordinarily", "other", "ouch", "outrageous", 
    "over the top", "overflow", "pardon the french", "patience", "peace", "perfect", "persistence", "pet", "petty", "phasors on stun", 
    "pick me pick me", "piety", "place", "play", "poor", "population", "potentially", "pow", "praise", "praying", "pride", "programming", 
    "prosperity", "pwned", "qed", "quit", "quit it", "quite", "radio", "really", "recipe", "refreshing", "relax", "repeat after me", "repent", 
    "resume", "reverse engineer", "revolution", "rich", "ridiculous", "rip off", "rocket science", "rose colored glasses", "roses are red", 
    "rubbish", "run away", "saber rattling", "sad", "scorning", "scum", "segway", "service sector", "services", "sess me", "sex", "shist", 
    "shucks", "silly human", "sing", "skills", "sky", "sloth", "slumin", "smack some sense into you", "small talk", "smart", "smile", "smurfs", 
    "snap out of it", "so he sess", "so let it be done", "so let it be written", "soap opera", "special case", "spending", "spirit", "spoiled brat", 
    "sports", "spunky", "stoked", "straighten up", "strip", "study", "stuff", "stunning", "super computer", "surprise surprise", "take the day off", 
    "take your pick", "talk to my lawyer", "tattle tale", "taxes", "test pilot", "thank you very much", "that's all folks", "that's for me to know", 
    "that's much better", "that's no fun", "that's your opinion", "thats just wrong", "thats laughable", "thats right", "the", "the enquirer", 
    "theft", "theres no place like home", "these cans are defective", "think you could do better", "this might end badly", "threads", "tiffanies", 
    "to infinity and beyond", "tomorrow", "tree hugger", "try again", "uh huh", "umm", "umm the other answer", "umm what now", "unemployment", 
    "unsung hero", "vengeance", "vengeful", "vermin", "vice", "virtue", "voodoo", "vote", "walking", "wanna bet", "wastoid", "watch it buddy", 
    "wazz up with that", "we ve already got one", "well I never", "well golly", "well obviously", "whale", "what's it to you", "what's the plan", 
    "what's up", "what a mess", "what a nightmare", "what do you expect", "what do you want", "what have you done for me lately", "what luck", 
    "what part of God do you not understand", "what planet are you from", "what the heck", "what was I thinking", "what would Jesus do", 
    "whatcha talkin' 'bout", "whazza matter for you", "when hell freezes over", "where's the love", "whiner", "white trash", "who's to say", 
    "who are you to judge", "whoop there it is", "why didn' you tell me", "why do I put up with this", "why is it", "wishful thinking", 
    "won't you be my neighbor", "wonderbread", "wonderful", "woot", "wot", "wrath", "yada yada yada", "yeah", "yep", "yikes", "you'll see", 
    "you're fired", "you're in big trouble", "you're lucky", "you're no fun", "you're not all there are you", "you're nuts", "you're out of your mind", 
    "you're so screwed", "you're welcome", "you're wonderful", "you are my sunshine", "you better not", "you do it", "you don't like it", 
    "you don't say", "you hoser", "you know a better God", "you never know", "you owe me", "you see the light", "you should be so lucky", 
    "you shouldn't have", "you talkin' to me", "you think I'm joking", "you think you could do better", "yuck", "zoot", "red fang", 
    "rum bitty di", "I m prettier than this man", "This cant be william wallace", "got the life", "king nun", "king of mars", 
    "an Irishman is forced to talk to God", "you couldnt navigate yer way circleK", "its trivial obviously", "rufus!"
];
const godsPunctuation = ['?', '.', '!', ',', ';', '—'];

function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomIndex(max) {
    return getRandomInterval(0, max);
}

// 0: english, 1: lithuanian, 2: serbian
function generateWordGod(language = 0) {
    let passage = '';

    // God only wishes to speak between 24 and 48 words at a time
    let maxWords = getRandomInterval(24, 48);
    const minWordsForPunct = 3;

    // God must pick between English, Lithuanian, or Serbian
    let length_of_vocab = 0;
    switch (language) {
        case 0:
            length_of_vocab = godsVocabulary.length;
            break;
        case 1:
            length_of_vocab = godsVocabularyLithuanian.length;
            break;
        case 2:
            length_of_vocab = godsVocabularySerbian.length;
            break;
    }

    // God decides to punctuate, or not at all. Only He governs over that
    // decision
    let godPunctuateAt = getRandomInterval(minWordsForPunct, 48);

    for (let i = 0; i < maxWords; i++) {
        if (i % godPunctuateAt == 0 && i > 0) {
            // Yes, my lord. Thine punctuation is being added
            let punctuationIdx = getRandomIndex(godsPunctuation.length);
            passage += `${godsPunctuation[punctuationIdx]}`;

            // God may decide when to punctuate again. That's not up 
            // to us mere mortals
            if ((maxWords - i) > minWordsForPunct) {
                godPunctuateAt = getRandomInterval(minWordsForPunct, (48 - i));
            }
        }

        let wordIdx = getRandomIndex(length_of_vocab);
        let newWord = ''
        switch (language) {
            case 0:
                newWord = godsVocabulary[wordIdx];
                break;
            case 1:
                newWord = godsVocabularyLithuanian[wordIdx];
                break;
            case 2:
                newWord = godsVocabularySerbian[wordIdx];
                break;
        }
        passage += ` ${newWord}`;
    }

    let godsWord = document.getElementById('div-gods-word');
    godsWord.innerText = passage;
}
