const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();
const runtimeOpts = {
  timeoutSeconds: 200
}

exports.updateIsOnlineKey = functions.database.ref('/trivia/{gameSessionId}/users/{userId}/online')
  .onUpdate((change,context)=>{
    let userRef = change.after.ref.parent;
    if(change.after.val() === 'online') {
      console.log('user is set online1');
      return userRef.update({
        isOnline : true
      });
    }
    else {
      return new Promise((resolve,reject)=>{
        setTimeout(()=>{
          userRef.get().then((snap)=>{
            if(!snap.exists()) {
              resolve();
            }
            let isOnline;
            if(snap.val().online === true) {
              console.log('user is set online2');
              isOnline = true;
            }
            else if( Date.now() - snap.val().online > 5000){
              console.log('user is set offline');
              isOnline = false;
            }
            else {
              console.log('user is set online3');
              isOnline = true;
            }
            userRef.update({
              isOnline
            }).then(()=>{
              resolve();
            })
            .catch(()=>{
                resolve();
                console.log(`Can't be able to update isOnline`);
            })
          })
          .catch(()=>{
            console.log('Can get users');
            resolve();
          })
        },5000)
      })
    }
  })

exports.removeHostWhenOffline = functions.database.ref('/trivia/{gameSessionId}/users/{id}/isOnline')
  .onUpdate(async(change,context)=>{
    let userOnlineStatus = change.after.val();
    let userId = context.params.id;
    let hostRef = change.after.ref.parent.parent.parent.child('host');
    let hostId;
    let hostSnap;
    if(userOnlineStatus === false) {
      return new Promise(async(resolve,reject)=>{
        hostSnap = await hostRef.get();
        if(!hostSnap.exists()) {
          console.log('Host not exists');
          resolve();
          return;
        } 
        hostId = hostSnap.val();
        console.log('Host Id ',hostId);
        if(hostId === userId) {
          console.log('Host went offline');
          hostRef.remove().then(()=>{
            console.log('Host get removed');
            resolve();
          })
          .catch(()=>{
            console.log('Error occur while removing host');
            resolve();
          });
        }
        else {
          console.log('Current id not equal to hostid');
          resolve();
        }
      })
    }
    else {
      console.log('Nothing to change');
      return null;
    }
  })
exports.hostDelete = functions.database.ref("/trivia/{gameSessionId}/host")
  .onDelete((snap, context) => {
    const oldHostId = snap.val();
    const usersRef = snap.ref.parent.child("users");
    let users,usersSnap;
    return new Promise(async(resolve,reject)=>{
      try {
        usersSnap = await usersRef.get();
        if(!usersSnap.exists()) {
          console.log('Users not exist');
          resolve();
          return;
        }
        users = usersSnap.val();
        console.log('users ',users);
        let usersArray = [];
        for(const id in users) {
          usersArray.push(users[id]);
        }
        console.log('usersArray ',usersArray);
        let onlineUsers = usersArray.filter( user => user.isOnline === true && user.id !== oldHostId);
        console.log('Online users ',onlineUsers);
        shuffle(onlineUsers);
        const newHost = onlineUsers[0];
        if (newHost) {
          console.log('new host ',newHost);
          snap.ref.set(newHost.id)
          .then(()=>{
            console.log('Host id set success');
            resolve();
          })
          .catch(()=>{
            console.log('Host id set fail');
            resolve();
          });
        }
        else {
          console.log('No online users');
          resolve();
        }
      }
      catch(err) {
        console.log('Something went wrong ',err);
        resolve();
      }
    })
  });

exports.setTimerTo0WhenEveryoneHaveAnswered = functions.database.ref(`/trivia/{gameSessionId}/rounds/{roundValue}/allQuestions/{questionNumber}/usersAnswers/`)
  .onWrite(async(change,context)=>{
    let usersAnswers = change.after.val();
    console.log('usersAnswers ',usersAnswers);
    let usersRef = change.after.ref.parent.parent.parent.parent.parent.child('users');
    let users,usersSnap;
    try {
      usersSnap = await usersRef.get();
      if(!usersSnap.exists()) {
        console.log('Something went wrong while getting users information');
        return null;
      }
      users = usersSnap.val();
      console.log('users ',users);
      let f = 0;
      for(const userId in users) {
        if(users[userId].isOnline === true && usersAnswers[userId] === undefined) {
          f = 1;
          break;
        }
      }
      if(f === 1) {
        console.log('All users have not given answer');
        return null;
      }
      else {
        console.log('All users have given answer');
        let questionTimerRef,questionTimerSnap;
        questionTimerRef = change.after.ref.parent.parent.parent.child('questionTimer');
        return questionTimerRef.set(0).then(()=>{
          console.log('question Timer is set to 0');
        })
        .catch((err)=>{
          console.log('Some error occur while setting question Timer to 0 ',err);
        });
      }
     }
    catch(err) {
      console.log('Something went wrong ',err);
    }
  })  
exports.changeToBeMadeWhenCurrentQuestionNumberChange = functions.database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/currentQuestionNumber/')
  .onWrite((change,context)=>{
    if(!change.after.exists()) {
      console.log('current Question number donot exists');
      return null;
    }

    let questionTimerRef = change.after.ref.parent.child('questionTimer');
    return questionTimerRef.set(31).then(()=>{
      console.log('questionTimer is set');
    })
    .catch((err)=>{
      console.log('Error while setting questionTimer ',err);
    });
  })
exports.startQuestionTimer = functions.runWith(runtimeOpts).database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/questionTimer/')
  .onCreate(async(snapshot,context)=>{
    let questionTimer = snapshot.val();
    let questionTimerRef = snapshot.ref;
    let currentQuestionNumberRef = snapshot.ref.parent.child('currentQuestionNumber');
    let pageRef = snapshot.ref.parent.child('page');
    let halfTimerRef = snapshot.ref.parent.child('halfTimer');

    return new Promise(async (resolve,reject)=>{
      let interval = setInterval(async()=>{
        let questionTimerSnap = await questionTimerRef.get();
        if(!questionTimerSnap.exists()) {
          console.log('question timer not exist so clearing the interval');
          clearInterval(interval);
          resolve();
          return;
        }
        questionTimer = questionTimerSnap.val();
        // console.log('questionTimer ',questionTimer);
        
        if(questionTimer >= 1) {
          questionTimer = questionTimer - 1;
          questionTimerRef.set(questionTimer);
        }
        else {
          clearInterval(interval);
          let lastTimer = setTimeout(()=>{
            Promise.all( [questionTimerRef.remove(),currentQuestionNumberRef.transaction( (count) => { 
              if(count === 4) {
                Promise.all([pageRef.set('HalfTime'),halfTimerRef.set(10)])
                .then(()=>{
                  console.log('Page is set to halftime and timer to 30');
                })
                .catch((err)=>{
                  console.log('Some error occur ',err);
                })
              }
              else if(count === 9) {
                pageRef.set('HalfTime').then(()=>{
                  console.log("Page is set to halftime");
                })
                .catch((err)=>{
                  console.log('Error while setting page to halftime ',err);
                });
              }
              else if(count < 9){
                return count + 1;
              }
            })])
            .then(()=> {
              console.log('Question timer ref is removed and count of question number is set');
              clearTimeout(lastTimer);
              resolve();
            })
            .catch((err)=>{
              console.log('err ',err);
              clearTimeout(lastTimer);
              resolve();
            });

          },4000);
        }
      },1000);
    });
  })

exports.setAllQuestions = functions.https.onCall(async(data)=>{
  const db = admin.database();
  console.log(data);
  const categoryId = data.categoryId;
  let allCategoriesRef = db.ref(`/trivia/allCategories`);
   
  let allQuestionsRef = db.ref(`/trivia/${data.gameSessionId}/rounds/${data.roundValue}/allQuestions`);
  let categoryNameRef = allQuestionsRef.parent.child('categoryName');
  let currentQuestionRef = allQuestionsRef.parent.child('currentQuestionNumber');
  let pageRef = allQuestionsRef.parent.child('page');
  let allCategories,allCategoriesSnap;
  try {
    allCategoriesSnap = await allCategoriesRef.get();
    if(!allCategoriesSnap.exists()) {
      return console.log('allcategories does not exist in database');
    }
    allCategories = allCategoriesSnap.val();
    let categoryQuestions = allCategories[categoryId]['categoryQuestions'];
    let categoryName = allCategories[categoryId]['categoryName'];
    shuffle(categoryQuestions);
    
    return Promise.all([allQuestionsRef.set(categoryQuestions.slice(0,10)),categoryNameRef.set(categoryName),pageRef.set('Welcome')]).then(()=>{
      console.log('Both are success');
    })
    .catch((err)=>{
      console.log('error ' ,err);
    });
  }
  catch {
    console.log('Something went wrong');
  }
})

exports.startHalfTimer = functions.runWith(runtimeOpts).database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/halfTimer/')
  .onCreate(async(snapshot,context)=>{
    let halfTimerRef = snapshot.ref;
    let pageRef = snapshot.ref.parent.child('page');
    let currentQuestionNumberRef = snapshot.ref.parent.child('currentQuestionNumber');
    let interval;
    return new Promise((resolve,reject)=>{
      interval = setInterval(async()=>{
        let timerValue;
        let timerSnap;
        timerSnap =  await halfTimerRef.get();
        if(!timerSnap.exists() || timerSnap.val() === undefined) {
          clearInterval(interval);
          resolve();
          return;
        }
        timerValue = timerSnap.val();
        if(timerValue >= 1) {
          halfTimerRef.set(timerValue - 1);
        }
        else if(timerValue === 0) {
          Promise.all([pageRef.set('Game'),currentQuestionNumberRef.transaction(count => count + 1),halfTimerRef.remove()])
          .then(()=>{
            console.log('page is set to game, question number is incremented and half timer is removed');
            clearInterval(interval);
            resolve();
          })
          .catch((err)=>{
            console.log('error ',err);
            clearInterval(interval);
            resolve();
          });
        }
      },1000);
    })
  })
function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function increment(count,pageRef) {
  console.log('count ',count);
  if(count === 4) {
    pageRef.set('HalfTime').then(()=>{
      console.log("Page is set to halftime");
    })
    .catch((err)=>{
      console.log('Error while setting page to halftime ',err);
    });
    return;
  }
  else if(count < 9) {
    return count + 1;
  }
  else {
    return;
  }
}
