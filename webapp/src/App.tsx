import React, { useState, useRef } from 'react'


import { initializeApp } from 'firebase/app'

import {
  addDoc,
  collection,
  getFirestore,
  orderBy,
  query,
  limitToLast,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth'

import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection } from 'react-firebase-hooks/firestore'

import './App.css'

const firebaseConfig = {
  apiKey: "AIzaSyDDdgDZp7VuoBU_RoXC3YaXZADXEEXSd2I",
  authDomain: "gpt-r-33c76.firebaseapp.com",
  projectId: "gpt-r-33c76",
  storageBucket: "gpt-r-33c76.appspot.com",
  messagingSenderId: "469192009928",
  appId: "1:469192009928:web:4e2208924e82c3dafd5dfd",
  measurementId: "G-X5W9LNE6Y9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

if(window.location.hostname === 'localhost') {
  //connectFirestoreEmulator(db, 'localhost', 8080);
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider()
    signInWithPopup(auth, provider)
  }

  return (
    <>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )
}

function SignOut() {
  return (
    auth.currentUser && <button onClick={() => signOut(auth)}>Sign Out</button>
  )
}

type ChatMessageProps = {
  text: string
  uid: string
  photoURL: string
  author: string
  currentUserUid: string
}
function ChatMessage({
  text,
  uid,
  photoURL,
  author,
  currentUserUid,
}: ChatMessageProps) {
  const messageClass = uid === currentUserUid ? 'sent' : 'received'

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt={author} />
      <p>{author+": "+text}</p>
    </div>
  )
}

function ChatRoom({ user }: { user: User }) {
  const dummy = useRef() as React.MutableRefObject<HTMLSpanElement>
  const messagesRef = collection(db, 'messages')
  const messagesQuery = query(messagesRef, orderBy('createdAt'), limitToLast(50))

  const [messages, loading, error] = useCollection(messagesQuery, {
    snapshotListenOptions: { includeMetadataChanges: true },
  })

  const [formValue, setFormValue] = useState('')
  
  const sendMessage = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const { uid, photoURL, displayName } = user
    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
      author: displayName,
    })
    setFormValue('')
    dummy.current.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return (
      <>
        <p>
          <b>{error.code}</b>
        </p>
        <p>Error: {JSON.stringify(error)}</p>
      </>
    )
  }

  return (
    <>
      <main>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {JSON.stringify(error)}</p>}
        {messages &&
          messages.docs.map(doc => {
            const { text, uid, photoURL, author } = doc.data()
            return (
              <ChatMessage
                key={doc.id}
                text={text}
                uid={uid}
                photoURL={photoURL}
                author={author || 'Anonymous'}
                currentUserUid={user.uid}
              />
            )
          })}
        <span ref={dummy}></span>
      </main>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={formValue}
          onChange={ev => setFormValue(ev.target.value)}
        />
        <button type="submit" disabled={formValue.length === 0}>
          ↩
        </button>
      </form>
    </>
  )
}

function UserBox({ user }: { user: User }) {
  const { photoURL, displayName } = user
  return (
    <div>
      <img referrerPolicy="no-referrer" src={photoURL || ''} alt="" />
      {displayName}
    </div>
  )
}

function App() {
  const [user] = useAuthState(auth)
  return (
    <div className="App">
      <header>
        <h1>💬</h1>
        {user && <UserBox user={user} />}
        <SignOut />
      </header>

      <section>{user ? <ChatRoom user={user} /> : <SignIn />}</section>
    </div>
  )
}

export default App
