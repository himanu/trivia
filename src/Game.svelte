<script>
    import TriviaIcon from './TriviaIcon.svelte';
    import {dbCurrentQuestionNumber,listenFirebaseKey,dbAllQuestion, dbQuestionTimer,dbUsers,dbGameSessionRoundValue} from './database'
    import { getParams } from './utils';
    import {fly} from 'svelte/transition';
    import RoundIndicator from './RoundIndicator.svelte';
    import {info} from './Notifier';

    let currentQuestionNumber;
    let allQuestions;
    let currentQuestionText;
    let options = [];
    let borderColor = "#27AE60";
    let questionTimer;
    let time = 0;
    let remTime;
    let users;
    let pageHasRefreshed = true;
    let interval;
    let requestAnimationFrameId;
    let timeToShow;
    
    listenFirebaseKey((dbCurrentQuestionNumber),(dbCurrentQuestionNumberRef)=>{
        dbCurrentQuestionNumberRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return ;
            }
            currentQuestionNumber = snap.val();
            selectedOptionId = undefined;
            time = 0;
            questionTimer = 30;
            borderColor = "#27AE60";
            pageHasRefreshed = true;
            clearInterval(interval);
            interval = setInterval(()=>{
                time = 1;
                if(time === 1) {
                    clearInterval(interval);
                }
            },1000);
        })
    })
    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    let noOfOnlinePlayers = 0;
    $: {
        if(users) {
            noOfOnlinePlayers = 0;
            for(const id in users) {
                if(users[id].isOnline === true) {
                    noOfOnlinePlayers += 1;
                }
            }
            if(noOfOnlinePlayers <= 1) {
                dbGameSessionRoundValue.transaction((count)=>{
                    return count + 1;
                }).then(()=>{
                    info(`Game can't be continued due to less number of online players`,`Disconnected`,5000);
                })
            }
        }
    }
    
    let opacityOfContainer;
    $: {
        if(time === 0) {
            opacityOfContainer = 0.5;
        }
        else {
            opacityOfContainer = 1;
        }
    }

    let setIntervalInterval;
    let stroke = 0;
    //370 for full screen
    let maxValueOfStroke = 384;
    // -65 for full screen
    let strokeDashOffset = -63;
    let stroke1 = maxValueOfStroke  - stroke;
    let initialTime = 31;
    let timeVal,timeVal1;

    listenFirebaseKey(dbQuestionTimer,(dbQuestionTimerRef)=>{
        dbQuestionTimerRef.on('value',(snap)=>{

            if(!snap.exists()) {
                questionTimer = 30;
            }
            else {
                initialTime = snap.val();
                if(snap.val() >= 31) {
                    remTime = 30;
                }
                else {
                    remTime = snap.val();
                }
            }
    
            // questionTimer = remTime/1000;
            questionTimer = remTime;
            if(questionTimer > 15) {
                borderColor = "#27AE60";
            }
            else if(questionTimer > 5) {
                borderColor = "#F2C94C";
            }
            else if(questionTimer > 0) {
                borderColor = "#C81919";
            }
            // clearInterval( setIntervalInterval );
            timeVal1 = initialTime;
            if(initialTime === 0) {
                cancelAnimationFrame(requestAnimationFrameId);
                stroke = 0;
                stroke1 = maxValueOfStroke - stroke;
            }
            else if(initialTime < 31 && pageHasRefreshed) {
                pageHasRefreshed = false;
                prev = null;
                timeVal = initialTime;
                cancelAnimationFrame(requestAnimationFrameId);
                requestAnimationFrameId = requestAnimationFrame(setStroke);
            }
        })
    })

    let prev,curr,elapsed;
    function setStroke(timeStamp) {
        if(!prev) {
            prev = timeStamp;
            timeVal = timeVal1;
        }
        else {
            curr = timeStamp;
            elapsed = curr - prev;
            timeVal = timeVal - elapsed/1000;
            prev = curr;
        }
        if(timeVal <= 0) {
            cancelAnimationFrame(requestAnimationFrameId)
            prev = null;
            stroke = 0;
            stroke1 = maxValueOfStroke - stroke;
        }
        else {
            stroke = (30 - timeVal)*(maxValueOfStroke)/30;
            stroke1 = maxValueOfStroke - stroke;
            requestAnimationFrameId = requestAnimationFrame(setStroke);
        }
    }
    
    listenFirebaseKey(dbAllQuestion,(dbAllQuestionsRef)=>{
        dbAllQuestionsRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            allQuestions = snap.val();
        })
    })
    
    let selectedOptionId;
    let userId = getParams('userId');
    let answerStatus = [];
    let usersAnswers;
    let answerOptionId;
    $: {
        if(allQuestions != undefined && currentQuestionNumber != undefined) {
            answerStatus = [];
            currentQuestionText = allQuestions[currentQuestionNumber].question;
            usersAnswers = (allQuestions[currentQuestionNumber]['usersAnswers']);
            answerOptionId = allQuestions[currentQuestionNumber]['correctOption'];
            if(usersAnswers) {
                selectedOptionId = usersAnswers[userId];
            }

            options = [];
            for(let i = 0; i<=3 ; i++) {
                options.push( { optionText : allQuestions[currentQuestionNumber][i], optionId : i} )
            }
            for(let i = 0; i<currentQuestionNumber ; i++) {
                let currentQuestionUsersAnswers = allQuestions[i]['usersAnswers'];
                if(!currentQuestionUsersAnswers || currentQuestionUsersAnswers[userId] === undefined) {
                    answerStatus.push(2);
                }
                else if(allQuestions[i]['usersAnswers'][userId] === allQuestions[i]['correctOption']) {
                    answerStatus.push(1);
                }
                else {
                    answerStatus.push(0);
                }
            }
            for(let i = currentQuestionNumber; i<10 ; i++) {
                if(i === currentQuestionNumber) {
                    answerStatus.push(3);
                }
                else {
                    answerStatus.push(2);
                }
            }
        }
    }
    $: {
        if(questionTimer === 0 && allQuestions && currentQuestionNumber != undefined && currentQuestionNumber !== null) {
            if(answerOptionId === selectedOptionId) {
                borderColor = "#27AE60";
            }
            else if(selectedOptionId != undefined){
                borderColor = "#C81919";
            }
            else {
                borderColor = "#6C44A8";
            }
        }
    }
    
    function handleOptionClick(optionId) {
        if(selectedOptionId !== undefined) {
            return ;
        }
        // selectedOptionId = optionId;
        listenFirebaseKey(dbAllQuestion,(dbAllQuestionRef)=>{
            dbAllQuestionRef.child(currentQuestionNumber).child('usersAnswers').child(userId).set(optionId);
        })
    }
    let colorMap = {
        0 : "#C81919",
        1 : "#27AE60",
        2 : "#C4C4C4",
        3 : "#6C44A8"
    }
    let titleMap = {
        0 : "Wrong Answer given",
        1 : "Correct Answer given",
        2 : "No answer given",
        3 : "Current Question"
    }
    
    
</script>
<div class = "gameContainer"> 
    {#if time === 0}
        <RoundIndicator roundValue = {currentQuestionNumber + 1} msg = {"Question"}/>
    {/if}
    <TriviaIcon/>
    <div class = "answerScreenContainer" in:fly ="{{ y: -20, duration: 1000 }}" style = "opacity : {opacityOfContainer}">
        {#if questionTimer != undefined}
            <div class="questionTimer" style = "background : {borderColor}">
                {#if questionTimer > 9}
                    0:{questionTimer}
                {:else if questionTimer > 0}
                    0:0{questionTimer}
                {:else if questionTimer === 0}
                    {#if answerOptionId === selectedOptionId}
                        Correct!
                    {:else if selectedOptionId != undefined}
                        Wrong!
                    {:else}
                        Times Up!
                    {/if}
                {/if}
            </div>
        {:else }
            <div class="questionTimer" style = "background : {borderColor}">
                0:30
            </div>
        {/if}

        <div class="svgContainer">
            <svg class = "svg" width = "100%" height = "100%">
                <rect x="0" y="0" width="100%" height="100%"  fill = "{borderColor}" stroke-dashoffset = "{strokeDashOffset + '%'}" stroke-dasharray = "{stroke + '%'} , {stroke1 + '%'}"/>
            </svg>
        </div>

        <div class="answerScreen">
            <div class="question">
                {#if currentQuestionText}
                    {currentQuestionText}
                {/if}
            </div>
            <div class = "allOptions">
                {#each options as option}
                    {#if questionTimer === 0 }
                        {#if option.optionId === answerOptionId}
                            <div class="correctOption">
                                {option.optionText}
                            </div>
                        {:else if option.optionId === selectedOptionId}
                            <div class="wrongOption" >
                                {option.optionText}
                            </div>
                        {:else}
                            <div class="simpleOption">
                                {option.optionText}
                            </div>
                        {/if}
                    {:else}
                        <div class="option" class:selectedOption = {option.optionId === selectedOptionId} style = "cursor : {selectedOptionId === undefined?"pointer":""}" on:click = {() => handleOptionClick(option.optionId)}>
                            {option.optionText}
                        </div>
                    {/if}
                {/each}
            </div>
            <div class = "allAnswers">
                {#each answerStatus as status}
                    {#if status !== 3}
                        <div title = {titleMap[status]}>
                            <svg height="1rem" width="1rem">
                                <circle cx="0.5rem" cy="0.5rem" r="0.5rem" fill = {colorMap[status]}/>
                            </svg> 
                        </div>
                    {:else}
                        <div class = "currentQuestionContainer" title = {titleMap[status]}>
                            <svg height="2rem" width="2rem">
                                <circle cx="1rem" cy="1rem" r="1rem" fill = {"#6C44A8"}/>
                            </svg> 
                            <div class = "currentQuestion">
                                    {currentQuestionNumber + 1}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    </div>
</div>
<style>
    ::-webkit-scrollbar {
        width: 8px;
    }
    /* Track */
    ::-webkit-scrollbar-track {
        background : initial;
        border-radius : 4px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: #172072;;
        border-radius : 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #0e1346;
    }
    .gameContainer {
        display : flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .answerScreenContainer {
        margin : auto 0;
        padding : 0rem 1rem;
        width : 60vw;
        min-height : 50vh;
        position : relative;
    }
    @media screen and (max-width : 1200px) {
        .answerScreenContainer {
            width : 70vw;
        }
    }
    @media screen and (max-width : 1000px) {
        .answerScreenContainer {
            width : 80vw;
        }
    }
    @media screen and (max-width : 900px) {
        .answerScreenContainer {
            width : 90vw;
        }
    }
    @media screen and (max-height : 600px) {
        .answerScreenContainer {
            min-height : 60vh;
        }
    }
    @media screen and (max-height : 400px) {
        .answerScreenContainer {
            min-height : 75vh;
        }
    }
    .svgContainer {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 1rem;
        overflow: hidden;
    }
    .svg > *{
		stroke-width: 2rem;
		stroke: #ccc;
	}
    .answerScreen {
        background-color: #fff;
        padding : 1rem;
        width : calc(100% - 3rem);
        height : calc(100% - 1rem);
        display : flex;
        flex-direction : column;
        align-items: center;
        position : absolute;
        top : 50%;
        left : 50%;
        transform : translate(-50%,-50%);
        border-radius: 1rem;
        overflow-y : scroll;
    }
    .question {
        font-family : 'Manrope';
        font-size : 1rem;
        font-weight : 800;
        max-width : 80%;
        margin : auto;
        text-align : center;
        line-height : 1.25rem;
        color : #333;
    }
    .allOptions {
        display : grid;
        grid-template-columns: repeat(2,1fr);
        gap : 1rem;
        width : 100%;
        margin-bottom : 1rem;
    }
    .option,.selectedOption,.correctOption,.wrongOption,.simpleOption {
        border : 2px solid #D9D9D9;
        border-radius: 1rem;
        color : #414141;
        padding : 0.75rem 1rem;
        text-align : center;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        display : flex;
        justify-content: center;
        align-items : center;
    }
    .selectedOption {
        color : #fff;
        background : #6C44A8;
    }
    .correctOption {
        background : #27AE60;
        color : #fff;
        animation  : animateOption 2s 1
    }
    .wrongOption {
        background: #C81919;
        color : #fff;
    }
    
    @keyframes animateOption {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
    .questionTimer {
        padding : 0.25rem 0.5rem;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        color : #fff;
        position : absolute;
        bottom : calc(100% - 0.5rem);
        left : 50%;
        transform: translateX(-50%);
        border-radius : 0.25rem;
        z-index : 100;
    }
    .allAnswers {
        display : flex;
        justify-content: center;
        gap : 0.5rem;
        align-items: center;
    }
    .currentQuestionContainer {
		position : relative;
		width : 2rem;
		height : 2rem;
	}
	.currentQuestion {
		position : absolute;
		top : 50%;
		left : 50%;
		transform : translate(-50%,-50%);
		color : #fff;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
	}
</style>