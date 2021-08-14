<script>
    import TriviaIcon from "./TriviaIcon.svelte";
    import {dbHost,dbGameSessionRoundValue, dbGameSessionRound,dbAllCategories,listenFirebaseKey,setAllQuestions,dbUsers, dbUser,dbCategoryName} from './database';
    import {getParams,getGameSessionId} from './utils';
    import CustomIcon from './icons/CustomCategoryAdd.svelte';
    import CustomButton from './CustomButton.svelte';
    import {fly} from 'svelte/transition';
    import {changePageToChooseCategory} from './utils';

    let hostId;
    let isHost;
    let userId = getParams('userId');
    let gameSessionId = getGameSessionId();
    let allCategories;
    let allCategriesTitle = [];
    let selectedCategoryId;
    let roundValue;
    let hostname;
    let users;
    let categoryName;

    dbHost.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        hostId = snap.val();
        if(hostId === userId) {
            isHost = true;
        }
    })
    listenFirebaseKey(dbCategoryName,(dbCategoryNameRef)=>{
        dbCategoryNameRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            categoryName = snap.val();
        })
    })
    
    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    $: {
        if(hostId && users) {
            hostname = users[hostId]['userName'].split(' ')[0];
        }
    }
    dbGameSessionRoundValue.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        roundValue = snap.val();
    })
    dbAllCategories.get().then((snap)=>{
        if(!snap.exists()) {
            return;
        }
        allCategories = snap.val();
    })
    $: {
        if(allCategories) {
            for(const id in allCategories) {
                allCategriesTitle.push(
                    {
                        "categoryName" : allCategories[id]['categoryName'],
                        "categoryId" : id
                    }
                );
            }
            allCategriesTitle = allCategriesTitle;
        }
    }
    function updateSelectedCategory(category) {
        if(!isHost) {
            return;
        }
        if(selectedCategoryId === category.categoryId) {
            selectedCategoryId = undefined;
            return;
        }
        selectedCategoryId = category.categoryId;
    }
    let disableConformCategoryBtn = false;
    async function confirmCategory() {
        console.log('Conform category is called');
        disableConformCategoryBtn = true;
        await setAllQuestions({
            "categoryId" : selectedCategoryId,
            roundValue,
            gameSessionId
        });
        handleGoBack();
    }
    function handleGoBack() {
        changePageToChooseCategory.update((value) => value - 1);
    }
</script>
<div class="chooseCategoryContainer">
    <TriviaIcon/>
    <div class="message">
        {#if isHost}
            Select a category
        {:else if !categoryName}
            {hostname} (Host) will select one of the category
        {:else if categoryName}
            {hostname} (Host) have selected <span class = "selectedCategoryName">{categoryName}</span> category
        {/if}
    </div>
    <div class = "categoriesList" in:fly ="{{ y: -20, duration: 1000 }}">
        {#each allCategriesTitle as category}
            <div class="category" class:selectedCategory = {selectedCategoryId === category.categoryId} class:hostCategory = {isHost} on:click = {()=>{updateSelectedCategory(category)}}>
                <CustomIcon selectedCategory = {selectedCategoryId === category.categoryId}/>
                <div class = "categoryName">
                    {category.categoryName}
                </div>
            </div>
        {/each}
    </div>
    {#if isHost}
        <CustomButton btnText = "Confirm Category" tooltipMsg = {selectedCategoryId === undefined?"Please select one of the category":""} disableBtn = {(selectedCategoryId === undefined) || disableConformCategoryBtn} on:click = {confirmCategory}/>
    {:else}
        <CustomButton btnText = "Go back" disableBtn = {false} on:click = {handleGoBack}/>
    {/if}
</div>
<style>
    ::-webkit-scrollbar {
        width: 10px;
    }
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background-color : #ABABAB;
        border : 2px solid none;
        border-radius: 5px;
    }
    .chooseCategoryContainer {
        display : flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .message {
        font-family : 'Manrope';
        font-size : 1rem;
        font-weight : 700;
        color : #fff;
        margin-top : 1rem;
    }
    .categoriesList {
        display : grid;
        grid-template-columns: repeat(2,1fr);
        gap : 1rem;
        margin : auto;
        overflow-y : auto;
        max-height : 50vh;
        min-width : 60vw;
        padding : 0rem 0.5rem;
    }
    @media screen and (max-height : 500px) {
        .categoriesList {
            grid-template-columns: repeat(1,1fr);
        }
    }
    .category {
        display : flex;
        background : #fff;
        padding : 0.5rem 1rem;
        align-items: center;
        color : #000;
        border-radius : 1rem;
        box-shadow: 0px 8px 0px #ABABAB;
    }
    .selectedCategoryName {
        font-style: italic;
        font-size : 1rem;
    }
    .selectedCategory {
        background : #CF017D;
        color : #fff;
        box-shadow: 0px 8px 0px #81004D;
    }
    .hostCategory {
        cursor : pointer;
    }
    .hostCategory:hover {
        box-shadow: 0 4px 0px #ABABAB;
        position: relative;
        top : 4px;
    }
    .selectedCategory:hover {
        top : 0;
        box-shadow: 0px 8px 0px #81004D;
    }
    .categoryName {
        font-family : 'Manrope';
        font-size : 0.8rem;
        font-weight : 700;
        margin-left : 0.5rem;
    }
</style>