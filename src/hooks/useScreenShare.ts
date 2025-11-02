import { useRef } from "react";
import { firestore, firebase } from "../app/firebaseConfig";

/**
 * Screen sharing hook that creates a new virtual user for the screen share stream
 * This approach keeps the original camera feed and shows screen as a separate participant
 */
export const useScreenShare = (
  isScreenSharing: boolean,
  setIsScreenSharing: any,
  screenStreamFeed: MediaStream | null,
  setScreenStreamFeed: any,
  pcs: RTCPeerConnection[],
  webcamVideoRef: React.RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
  callId: string | undefined,
  beforeCall: number,
  setStream?: any,
  localStreamRef?: React.RefObject<MediaStream | null>,
  myName?: string,
  setRemoteStreams?: any,
  setPcs?: any,
  servers?: RTCConfiguration
) => {
  const screenPeerConnectionsRef = useRef<RTCPeerConnection[]>([]);
  const screenShareIndexRef = useRef<number | null>(null);
  const screenUnsubscribersRef = useRef<(() => void)[]>([]);

  const startScreenShare = async () => {
    try {
      console.log("🖥️ [SCREEN SHARE] Starting screen share as new virtual user");
      
      // Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setIsScreenSharing(true);
      setScreenStreamFeed(screenStream);

      if (!callId || !myName || !setRemoteStreams || !setPcs || !servers) {
        console.error("❌ Missing required parameters for screen share");
        setIsScreenSharing(false);
        screenStream.getTracks().forEach(track => track.stop());
        return;
      }

      const callDoc = firestore.collection("calls").doc(callId);
      
      // STEP 1: Register as a new user in Firebase
      const indexDoc = callDoc.collection("otherCandidates").doc("indexOfConnectedCandidates");
      const indexSnapshot = await indexDoc.get();
      const currentUsers = indexSnapshot.data()?.indexOfCurrentUsers || [];
      
      // Find next available index
      let newIndex = 1;
      while (currentUsers.includes(newIndex)) {
        newIndex++;
      }
      screenShareIndexRef.current = newIndex;
      
      console.log(`🖥️ [SCREEN SHARE] Registering screen as user index: ${screenShareIndexRef.current}`);
      
      // Add screen share user to Firebase (using batch for atomicity)
      const batch = firestore.batch();
      
      batch.update(indexDoc, {
        indexOfCurrentUsers: firebase.firestore.FieldValue.arrayUnion(screenShareIndexRef.current)
      });
      
      // Add name for screen share
      const nameDoc = callDoc.collection("nameList").doc(`${screenShareIndexRef.current - 1}`);
      batch.set(nameDoc, {
        name: `${myName}'s Screen`,
        index: screenShareIndexRef.current - 1
      });
      
      // Update call doc with screen sharing info
      batch.update(callDoc, {
        connectedUsers: firebase.firestore.FieldValue.increment(1),
        isScreenSharing: true,
        screenSharer: beforeCall,
        screenShareUserIndex: screenShareIndexRef.current
      });
      
      await batch.commit();
      console.log("✅ [SCREEN SHARE] Registered in Firebase");

      // STEP 2: Create peer connections with all existing users (except self)
      const existingUsers = currentUsers.filter((idx: number) => idx !== screenShareIndexRef.current);
      console.log(`🖥️ [SCREEN SHARE] Connecting to ${existingUsers.length} existing users:`, existingUsers);
      
      for (const otherUserIndex of existingUsers) {
        await createPeerConnectionToUser(
          otherUserIndex,
          screenStream,
          callDoc,
          screenShareIndexRef.current!,
          servers
        );
      }

      // STEP 3: Listen for new users who join after screen share starts
      const newUsersUnsubscribe = indexDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (data?.indexOfCurrentUsers) {
          const updatedUsers = data.indexOfCurrentUsers as number[];
          const newUsers = updatedUsers.filter(
            (idx: number) => idx !== screenShareIndexRef.current && !existingUsers.includes(idx)
          );
          
          newUsers.forEach((newUserIndex: number) => {
            console.log(`🖥️ [SCREEN SHARE] New user ${newUserIndex} joined, connecting...`);
            createPeerConnectionToUser(
              newUserIndex,
              screenStream,
              callDoc,
              screenShareIndexRef.current!,
              servers
            );
            existingUsers.push(newUserIndex); // Track this user
          });
        }
      });
      
      screenUnsubscribersRef.current.push(newUsersUnsubscribe);

      // Handle when screen share stops (user clicks stop sharing button)
      const videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        console.log("🖥️ [SCREEN SHARE] Screen share track ended");
        stopScreenShare();
      };

      console.log("✅ [SCREEN SHARE] Screen share started successfully");
    } catch (error) {
      console.error("❌ [SCREEN SHARE] Error starting screen share:", error);
      setIsScreenSharing(false);
      if (screenStreamFeed) {
        screenStreamFeed.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Helper function to create peer connection to a specific user
  const createPeerConnectionToUser = async (
    otherUserIndex: number,
    screenStream: MediaStream,
    callDoc: firebase.firestore.DocumentReference,
    myScreenIndex: number,
    servers: RTCConfiguration
  ) => {
    try {
      console.log(`🔗 [SCREEN SHARE] Creating peer connection to user ${otherUserIndex}`);
      
      const pc = new RTCPeerConnection(servers);
      screenPeerConnectionsRef.current.push(pc);
      
      // Add screen share tracks to peer connection
      screenStream.getTracks().forEach(track => {
        pc.addTrack(track, screenStream);
        console.log(`➕ [SCREEN SHARE] Added ${track.kind} track to PC`);
      });
      
      // Handle ICE candidates
      const candidatesCollection = callDoc
        .collection("users")
        .doc(`${myScreenIndex - 1}`)
        .collection("iceCandidates")
        .doc(`${otherUserIndex - 1}`);
        
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidatesCollection.set({
            candidates: firebase.firestore.FieldValue.arrayUnion(event.candidate.toJSON())
          }, { merge: true });
        }
      };
      
      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log(`🔗 [SCREEN SHARE] Connection state to user ${otherUserIndex}: ${pc.connectionState}`);
      };
      
      // Create and send offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      
      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };
      
      await callDoc
        .collection("users")
        .doc(`${myScreenIndex - 1}`)
        .collection("offers")
        .doc(`${otherUserIndex - 1}`)
        .set({ offer });
      
      console.log(`✅ [SCREEN SHARE] Sent offer to user ${otherUserIndex}`);
      
      // Listen for answer
      const answerDoc = callDoc
        .collection("users")
        .doc(`${otherUserIndex - 1}`)
        .collection("answers")
        .doc(`${myScreenIndex - 1}`);
        
      const answerUnsubscribe = answerDoc.onSnapshot(async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          console.log(`📩 [SCREEN SHARE] Received answer from user ${otherUserIndex}`);
          const answerDescription = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(answerDescription);
        }
      });
      
      screenUnsubscribersRef.current.push(answerUnsubscribe);
      
      // Listen for remote ICE candidates
      const remoteCandidatesDoc = callDoc
        .collection("users")
        .doc(`${otherUserIndex - 1}`)
        .collection("iceCandidates")
        .doc(`${myScreenIndex - 1}`);
        
      const remoteCandidatesUnsubscribe = remoteCandidatesDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (data?.candidates) {
          data.candidates.forEach(async (candidate: any) => {
            if (candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          });
        }
      });
      
      screenUnsubscribersRef.current.push(remoteCandidatesUnsubscribe);
      
    } catch (error) {
      console.error(`❌ [SCREEN SHARE] Error creating peer connection to user ${otherUserIndex}:`, error);
    }
  };

  const stopScreenShare = async () => {
    console.log("🛑 [SCREEN SHARE] Stopping screen share");
    
    try {
      // Stop screen stream
      if (screenStreamFeed) {
        screenStreamFeed.getTracks().forEach(track => {
          track.stop();
          console.log(`⏹️ [SCREEN SHARE] Stopped ${track.kind} track`);
        });
      }
      
      // Close all screen share peer connections
      screenPeerConnectionsRef.current.forEach(pc => {
        pc.close();
      });
      screenPeerConnectionsRef.current = [];
      console.log("✅ [SCREEN SHARE] Closed all peer connections");
      
      // Unsubscribe from all Firebase listeners
      screenUnsubscribersRef.current.forEach(unsubscribe => {
        unsubscribe();
      });
      screenUnsubscribersRef.current = [];
      console.log("✅ [SCREEN SHARE] Unsubscribed from Firebase listeners");
      
      // Remove screen share user from Firebase
      if (callId && screenShareIndexRef.current) {
        const callDoc = firestore.collection("calls").doc(callId);
        const indexDoc = callDoc.collection("otherCandidates").doc("indexOfConnectedCandidates");
        
        const batch = firestore.batch();
        
        // Remove from connected users
        batch.update(indexDoc, {
          indexOfCurrentUsers: firebase.firestore.FieldValue.arrayRemove(screenShareIndexRef.current)
        });
        
        // Decrement connected users count and clear screen sharing flags
        batch.update(callDoc, {
          connectedUsers: firebase.firestore.FieldValue.increment(-1),
          isScreenSharing: false,
          screenSharer: -1,
          screenShareUserIndex: null
        });
        
        // Add to hangup list so others remove the stream
        const hangupDoc = callDoc.collection("hangup").doc("hangups");
        batch.set(hangupDoc, { 
          hangup: screenShareIndexRef.current - 1 
        }, { merge: true });
        
        await batch.commit();
        
        console.log(`✅ [SCREEN SHARE] Removed screen share user ${screenShareIndexRef.current} from Firebase`);
        screenShareIndexRef.current = null;
      }
      
    } catch (error) {
      console.error("❌ [SCREEN SHARE] Error stopping screen share:", error);
    } finally {
      setIsScreenSharing(false);
      setScreenStreamFeed(null);
    }
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Placeholder functions for backward compatibility
  const mergeAudioStreams = async (screenAudioTrack: MediaStreamTrack) => {
    console.log("⚠️ [SCREEN SHARE] mergeAudioStreams not needed in new virtual user approach");
  };

  return {
    handleScreenShare,
    startScreenShare,
    stopScreenShare,
    mergeAudioStreams,
  };
};
