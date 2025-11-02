import { firestore } from "../app/firebaseConfig";

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
  localStreamRef?: React.RefObject<MediaStream | null>
) => {
  const mergeAudioStreams = async (screenAudioTrack: MediaStreamTrack) => {
    const audioContext = new AudioContext();

    // Ensure AudioContext is running
    await audioContext.resume();

    // Get local audio (microphone) stream
    const localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const localAudioSource = audioContext.createMediaStreamSource(localAudioStream);

    // Get screen share audio stream
    const screenAudioSource = audioContext.createMediaStreamSource(new MediaStream([screenAudioTrack]));

    // Create a destination node to combine audio
    const destination = audioContext.createMediaStreamDestination();

    // Connect both audio sources to the destination
    localAudioSource.connect(destination);
    screenAudioSource.connect(destination);

    // Get the combined audio stream
    const combinedAudioStream = destination.stream;

    // Replace the audio track in each peer connection with the combined audio track
    const audioTrack = combinedAudioStream.getAudioTracks()[0];
    pcs.forEach((pc) => {
      const audioSender = pc.getSenders().find((sender) => sender.track?.kind === "audio");
      if (audioSender) {
        audioSender.replaceTrack(audioTrack); // Replace each audio sender's track
      }
    });

    console.log("Combined audio stream sent to peer connections");
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setIsScreenSharing(true);
      setScreenStreamFeed(screenStream);

      const videoTrack = screenStream.getVideoTracks()[0];

      // Replace the video track for all existing peer connections
      // This makes the screen visible to everyone in their existing video feed
      for (const pc of pcs) {
        const videoSender = pc.getSenders().find((sender) => sender.track?.kind === "video");
        if (videoSender) {
          try {
            await videoSender.replaceTrack(videoTrack);
            console.log("Video track replaced with screen share");
            
            // Create new offer to renegotiate with new track
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Update the offer in Firestore to trigger renegotiation
            console.log("Renegotiating with screen share track");
          } catch (err) {
            console.error("Error replacing video track:", err);
          }
        }
      }

      // Merge audio if available
      const screenAudioTrack = screenStream.getAudioTracks()[0];
      if (screenAudioTrack) {
        await mergeAudioStreams(screenAudioTrack);
      }

      // Update local video to show screen
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = screenStream;
      }

      // CRITICAL: Update stream references so new joiners get screen share
      if (setStream) {
        setStream(screenStream);
      }
      if (localStreamRef && localStreamRef.current) {
        // Create a new stream that combines screen video with original audio
        const combinedStream = new MediaStream();
        
        // Add screen video track
        screenStream.getVideoTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
        
        // Add original audio track (not screen audio)
        if (stream) {
          stream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
        }
        
        localStreamRef.current = combinedStream;
        console.log("Updated localStreamRef with screen share for new joiners");
      }

      // Handle when screen share stops
      videoTrack.onended = () => {
        stopScreenShare();
      };

      // Update Firestore to indicate who is screen sharing
      const callDoc = firestore.collection("calls").doc(callId);
      await callDoc.update({
        isScreenSharing: true,
        screenSharer: beforeCall,
      });

      console.log("Screen share started and refs updated");
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsScreenSharing(false);
    }
  };

  // Modify the stopScreenShare function:
  const stopScreenShare = async () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const screenTrack = screenStreamFeed?.getVideoTracks()[0];
      screenTrack?.stop();
      
      // Replace screen share track back with webcam video
      for (const pc of pcs) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          try {
            await sender.replaceTrack(videoTrack);
            console.log("Restored webcam video track");
          } catch (err) {
            console.error("Error restoring video track:", err);
          }
        }
      }

      // Restore webcam feed to local video
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }

      // Restore original stream references
      if (setStream) {
        setStream(stream);
      }
      if (localStreamRef) {
        localStreamRef.current = stream;
        console.log("Restored original stream in localStreamRef");
      }
    }
    
    setIsScreenSharing(false);
    setScreenStreamFeed(null);

    // Update Firestore
    const callDoc = firestore.collection("calls").doc(callId);
    await callDoc.update({
      isScreenSharing: false,
      screenSharer: -1,
    });
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  return {
    handleScreenShare,
    startScreenShare,
    stopScreenShare,
    mergeAudioStreams,
  };
};