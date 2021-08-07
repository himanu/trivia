import firebase from "firebase/app";
import "firebase/database";
import 'firebase/functions';
import { getGameSessionId, getParams,allCategoriesObject} from "./utils";

var firebaseConfig = {
  apiKey: "AIzaSyBwkwm7nO4jYmXSQ93344sh_xDkg9xQ-Ps",
  authDomain: "da-trivia-dev-4f8ae.firebaseapp.com",
  databaseURL: "https://da-trivia-dev-4f8ae-default-rtdb.firebaseio.com",
  projectId: "da-trivia-dev-4f8ae",
  storageBucket: "da-trivia-dev-4f8ae.appspot.com",
  messagingSenderId: "1000459511203",
  appId: "1:1000459511203:web:f4c7eccfa02200402e2616"
};
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
var firebaseEmulators = {
      "database": {
        "host": "localhost",
        "port": 9000
      },
      "functions": {
        "host": "localhost",
        "port": 5001
      }
    };
  if (firebaseEmulators) {
      console.log("Automatically connecting Firebase SDKs to running emulators:");
      Object.keys(firebaseEmulators).forEach(function(key) {
      console.log('\t' + key + ': http://' +  firebaseEmulators[key].host + ':' + firebaseEmulators[key].port );
      });
      if (firebaseEmulators.database && typeof firebase.database === 'function') {
      firebase.database().useEmulator(firebaseEmulators.database.host, firebaseEmulators.database.port);
      }
      if (firebaseEmulators.firestore && typeof firebase.firestore === 'function') {
      firebase.firestore().useEmulator(firebaseEmulators.firestore.host, firebaseEmulators.firestore.port);
      }
      if (firebaseEmulators.functions && typeof firebase.functions === 'function') {
      firebase.functions().useEmulator(firebaseEmulators.functions.host, firebaseEmulators.functions.port);
      }
      if (firebaseEmulators.auth && typeof firebase.auth === 'function') {
      firebase.auth().useEmulator('http://' + firebaseEmulators.auth.host + ':' + firebaseEmulators.auth.port);
      }
  } else {
      console.log("To automatically connect the Firebase SDKs to running emulators, replace '/__/firebase/init.js' with '/__/firebase/init.js?useEmulator=true' in your index.html");
  }
console.log('Hey we are in database.js');
let roundValue = 1;
function getRoundValue() {
    return roundValue;
}
var functions = firebase.functions();
export const setAllQuestions = functions.httpsCallable('setAllQuestions');

export const dbRoot = firebase.database().ref('trivia');
export const dbAllCategories = dbRoot.child('allCategories');
export const dbGameSession = dbRoot.child(getGameSessionId());
export const dbGameSessionRoundValue = dbGameSession.child("roundValue");
export const dbGameSessionRounds = dbGameSession.child("rounds");
export const dbUsers = dbGameSession.child('users');
export const dbUser = dbUsers.child(getParams('userId'));
export const dbHost = dbGameSession.child('host');
export const dbScoreOfUsers = dbGameSession.child('scoreOfUsers');
export const dbScoreOfUser = dbScoreOfUsers.child(getParams('userId'));


export const dbGameSessionRound = ()=> dbGameSessionRounds.child(getRoundValue());
export const dbPage = ()=> dbGameSessionRound().child('page');
export const dbTimer = ()=> dbGameSessionRound().child('timer');
export const dbCurrentQuestionNumber = ()=> dbGameSessionRound().child('currentQuestionNumber');
export const dbAllQuestion = ()=> dbGameSessionRound().child('allQuestions');
export const dbCategoryName = ()=> dbGameSessionRound().child('categoryName');
export const dbQuestionTimer = ()=> dbGameSessionRound().child('questionTimer');

export function listenFirebaseKey(key,callback) {
  roundTimeValuePromise.then(()=>{
      callback(key());
  })
}
const roundTimeValuePromise = new Promise((resolve,reject)=>{
  dbGameSessionRoundValue.once('value',(snap)=>{
      if(!snap.exists()) {
          roundValue = 1;
      }
      else {
          roundValue = snap.val();
      }
      resolve();
  })
})

dbGameSessionRoundValue.on("value", (snap) => {
  if(!snap.exists()) {
      dbGameSessionRoundValue.set(1);
      roundValue = 1;
      return ;
  }
  roundValue = snap.val();
})
// console.log(allCategoriesObject[0]['categoryQuestions'].length);
dbAllCategories.set(allCategoriesObject); 
var connectedRef = firebase.database().ref('.info/connected');
connectedRef.on('value', (snap) => {
  if (snap.val() === true) {

    dbUser.update({
      online : true,
      isOnline : true
    });

    dbUser.onDisconnect().update({
        online : firebase.database.ServerValue.TIMESTAMP
    });
  }
});
dbScoreOfUser.once('value',(snap)=>{
  if(!snap.exists()) {
      dbScoreOfUser.set(0);
      return;
  }
})
dbUser.update({
  id: getParams('userId'),
  userName: getParams('userName'),
  profilePicture: getParams('userProfilePicture')
}).then(()=>{
  console.log('User data is updated');
}).catch(()=>{
  console.log('Some error occured');
});