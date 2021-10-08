<script>
    import TriviaIcon from "./TriviaIcon.svelte";
    import {dbHost,dbGameSessionRoundValue,dbAllCategoriesName,dbUsers,dbGameSessionRounds,dbHostAction, listenFirebaseKey} from './database';
    import {setAllQuestions} from "./api";
    import {getParams,getGameSessionId} from './utils';
    import CustomIcon from './icons/CustomCategoryAdd.svelte';
    import CustomButton from './CustomButton.svelte';
    import {fly} from 'svelte/transition';
    import {changePageToChooseCategory} from './utils';

    let hostId;
    let isHost;
    let userId = getParams('userId');
    let gameSessionId = getGameSessionId();
    let allCategoriesName;
    let allCategriesTitle = [];
    let selectedCategoryId;
    let roundValue;
    let hostname;
    let users;
    let categoryName;
    let dbCategoryName;
    let dbGameSessionRound;

    dbHost.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        hostId = snap.val();
        if(hostId === userId) {
            isHost = true;
        }
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

    const categorySnapFun = (snap)=>{
        if(!snap.exists()) {
            categoryName = undefined;
            return;
        }
        categoryName = snap.val();
    }

    dbGameSessionRoundValue.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }

        roundValue = snap.val();
        dbGameSessionRound = dbGameSessionRounds.child(roundValue);

        if(dbCategoryName) {
            dbCategoryName.off('value',categorySnapFun);
        }
        dbCategoryName = dbGameSessionRound.child('categoryName');
        dbCategoryName.on('value',categorySnapFun);
    })

    dbAllCategoriesName.get().then((snap)=>{
        if(!snap.exists()) {
            return;
        }
        allCategoriesName = snap.val();
    })

    $: {
        if(allCategoriesName) {
            for(const id in allCategoriesName) {
                allCategriesTitle.push(
                    {
                        "categoryName" : allCategoriesName[id],
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
        disableConformCategoryBtn = true;
        let previousCategoryName = categoryName;
        if(!previousCategoryName) {
            previousCategoryName = null;
        }
        let currentCategoryName = allCategoriesName[selectedCategoryId];
        await setAllQuestions({
            categoryId : selectedCategoryId,
            roundValue,
            gameSessionId
        });

        listenFirebaseKey(dbHostAction,(dbHostActionRef)=>{
            dbHostActionRef.set({
                action : "Category",
                previousCategory : previousCategoryName,
                currentCategory : currentCategoryName,
                time : Date.now()
            })
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
            {#if hostname}
                {hostname} (Host) will select one of the category
            {:else}
                Host will select one of the category
            {/if}
        {:else if categoryName}
            <span class = "selectedCategoryName">{categoryName}</span>  is the current category
        {/if}
    </div>
    
    {#if allCategriesTitle.length}
        <div class = "categoriesList" in:fly ="{{ y: -20, duration: 1000 }}">
            {#each allCategriesTitle as category}
                <div class="category" class:selectedCategory = {selectedCategoryId === category.categoryId} class:hostCategory = {isHost && !disableConformCategoryBtn} on:click = {()=>{updateSelectedCategory(category)}}>
                    <CustomIcon selectedCategory = {selectedCategoryId === category.categoryId}/>
                    <div class = "categoryName">
                        {category.categoryName}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div style = "font-family:  Manrope;font-size : 1.5rem; font-weight : 700; color : #fff; margin: auto">
            Loading...
        </div>
    {/if}
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
        margin : 1rem 0rem;
    }
    .categoriesList {
        display : grid;
        grid-template-columns: repeat(2,1fr);
        gap : 1rem;
        margin : auto;
        overflow-y : auto;
        max-height : 50vh;
        min-width : 60vw;
        padding : 0rem 0.5rem 1rem;
    }
    @media screen and (max-width : 600px) {
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