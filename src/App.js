import React, { request, useRef, useState, useEffect } from 'react';
import Login from './components/login';
import './App.css';

import $ from "jquery"; 
import 'firebase/compat/analytics';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import {useAuthState} from 'react-firebase-hooks/auth';
import {useCollectionData} from 'react-firebase-hooks/firestore';
import Song from "./song.js";
import {firebase_config, rapid_api_key} from "./secret.js";


import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

firebase.initializeApp(firebase_config)

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <div className='bg-image'></div>
      <header>
        <a href='#'><img src='../logo.png' className='logo'></img></a>
        <SignOut />
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
  return (
    <>
    <div className='login'>
      <label className="email-label">Email</label>
      <input className="email"></input>

      <label className="pw-label">Password</label>
      <input className="pw"></input>
      
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>
        <i class="fa fa-sign-out glyphicon"></i>
    </button>
  )
}


function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');


  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    if (formValue.startsWith("https://open.spotify.com/track/")) {
      var split = formValue.split("/");
      var end = split[split.length - 1];
      var trackId = end.split("?")[0];
      const spotify_config = {
        "async": true,
        "crossDomain": true,
        "url": "https://spotify23.p.rapidapi.com/tracks/?ids=" + trackId,
        "method": "GET",
        "headers": {
          "X-RapidAPI-Key": rapid_api_key,
          "X-RapidAPI-Host": "spotify23.p.rapidapi.com"
        }
    };
      $.ajax(spotify_config)
      .then(function (response) {
        var song = new Song(response.tracks[0].name, response.tracks[0].artists, response.tracks[0].album.images[0].url);
        console.log(song);
        messagesRef.add({
          text: formValue,
          uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isSong: true,
          song: JSON.stringify(song),
          photoURL
        })

      });
    } else {
      await messagesRef.add({
        text: formValue,
        uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isSong: false,
        photoURL
      })
    }
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Type Here" />

      <button type="submit" disabled={!formValue}>
        <span class="glyphicon glyphicon-send" aria-hidden="true"></span>
      </button>

    </form>
  </>)
}


function ChatMessage(props) {
  const { text, uid, createdAt, photoURL, song } = props.message;
  var dateString = "";
  if (createdAt) {
    dateString = createdAt.toDate().toLocaleTimeString().toString();
  } else {

  }
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  if (props.message.isSong) {
    var songObj = JSON.parse(song);
    var artist_text = []; 
    songObj.artist_names.forEach(artist => {
      artist_text.push(<li>{artist.name}</li>)
    });
    return (<>
      <div className={`message ${messageClass}`}>
        <img className="profile-picture" src={photoURL || 'https://miro.medium.com/max/2400/1*31n9aAemgPeFqE7Y267Z2A.jpeg'} />
        <div id={dateString} className={'message-wrapper'} >
          <a target="_blank" rel="noopener noreferrer" href={text}><img className="song-cover" src={songObj.album_url}></img></a>
          <p className="song-text">{songObj.song_name}</p>
          <ul className="artist-text">{artist_text}</ul>
        </div>
      </div>
      <ReactTooltip 
      className={`tool-tip ${messageClass}`}
      style={{borderRadius: '25px', overflow: 'hidden', color: "#FFFFFF", backgroundColor: "#363636", backdropFilter: "blur(5px)"}}
      anchorId={dateString}
      place={(messageClass=="sent") ?  "left" : "right"}
      noArrow={true}
      content={dateString}
      />
    </>)
  }
  return (<>
    <div className={`message ${messageClass}`}>
    <img className="profile-picture" src={photoURL || 'https://miro.medium.com/max/2400/1*31n9aAemgPeFqE7Y267Z2A.jpeg'} />
      <div id={dateString} className='message-wrapper'>
        <p>{text}</p>
      </div>
    </div>
    <ReactTooltip
      className={`tool-tip ${messageClass}`}
      style={{borderRadius: '25px', overflow: 'hidden', color: "#FFFFFF", backgroundColor: "#363636", backdropFilter: "blur(5px)"}}
      anchorId={dateString}
      place={(messageClass=="sent") ?  "left" : "right"}
      noArrow={true}
      content={dateString}
    />
  </>)
}

export default App;