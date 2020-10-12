import React, {useRef,useState} from 'react';
import './App.css';

import firebase from 'firebase/app'
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/analytics';
import Picker,{ SKIN_TONE_MEDIUM_DARK } from 'emoji-picker-react';
import { render } from 'react-dom';



import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
    apiKey: process.env.REACT_APP_apiKey,
    authDomain: process.env.REACT_APP_authDomain,
    databaseURL: process.env.REACT_APP_databaseURL,
    projectId: process.env.REACT_APP_projectId,
    storageBucket: process.env.REACT_APP_storageBucket,
    messagingSenderId: process.env.REACT_APP_messagingSenderId,
    appId: process.env.REACT_APP_appId,
})

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
    const [user] = useAuthState(auth);

    return (
    <div className="App">
        <header>
            <p> Fwan's Shared Chat Room</p>
            <SignOut/>
        </header>
        <section>
            {user ? <ChatRoom /> : <SignIn />}
        </section>
    </div>
  );
}

function SignIn() {
    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    }
    return(
        <button className="sign-in" onClick={signInWithGoogle}> Sign in with Google </button>
    )
}

function ChatRoom() {
    const scrollRef = useRef();

    const messagesRef = firestore.collection("messages");
    const query = messagesRef.orderBy("createdAt").limit(25);
    const [messages] = useCollectionData(query,{idField:'id'})
    const [formValue,setFormValue] = useState('');
    const [chosenEmoji, setChosenEmoji] = useState(null);
    const onEmojiClick = (event, emojiObject) => {

        setChosenEmoji(emojiObject);
        if(chosenEmoji === null) {
            return;
        }
        else{
            setFormValue(formValue + chosenEmoji.emoji);
            setChosenEmoji(null);
        }
        console.log(chosenEmoji);
    };


    const sendMessage = async (e) =>{
        e.preventDefault();
        if(formValue.length === 0 || !formValue.trim()){
            return;
        }
        const {uid,photoURL} = auth.currentUser;
        await messagesRef.add({
            text: formValue,
            createdAt:firebase.firestore.FieldValue.serverTimestamp(),
            uid,
            photoURL
        })
        setFormValue('');
        scrollRef.current.scrollIntoView({behaviour:'smooth'});
    }

    return (
        <>
            <main>
                {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/>)}
                <span ref={scrollRef}></span>
                <div className='Picker' id="Picker" display="none">
                    <Picker onEmojiClick={onEmojiClick} disableAutoFocus={true} skinTone={SKIN_TONE_MEDIUM_DARK}/>
                </div>
            </main>

            <form onSubmit={sendMessage}>
                <input value ={formValue} placeholder={"Type here..."} onChange={(e) => setFormValue(e.target.value)}/>
                <button type="submit">Send</button>
                <button className='togglebtn' type="submit" onClick={toggleEmojiPicker}> ☺ </button>

            </form>
        </>
        )
}

function toggleEmojiPicker(){
    var x = document.getElementById("Picker");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }

}



function SignOut(){
    return auth.currentUser && (
        <button className="sign-out" onClick={()=> auth.signOut()}> Sign Out </button>
    )
}

function ChatMessage(props){
    const {text,uid, photoURL} = props.message;
    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

    return(<>
        <div className={`message ${messageClass}`}>
            <img src={photoURL || 'http://www.pngmart.com/files/2/Pikachu-PNG-HD.png'} alt="pfp" />
            <p> {text} </p>
        </div>
    </>)
}

export default App;
render(<App />, document.getElementById('root'));
