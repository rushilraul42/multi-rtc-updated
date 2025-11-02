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
  remoteStreams: (MediaStream | null)[],
  setRemoteStreams: any,
  remoteVideoRefs: (React.RefObject<HTMLVideoElement> | null)[],
  setRemoteVideoRefs: any
) => {
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setIsScreenSharing(true);
      setScreenStreamFeed(screenStream);

      const screenVideoTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections to send screen to remote users
      for (const pc of pcs) {
        const videoSender = pc.getSenders().find((sender) => sender.track?.kind === "video");
        if (videoSender) {
          try {
            await videoSender.replaceTrack(screenVideoTrack);
            console.log("Replaced video track with screen share for remote peer");
          } catch (err) {
            console.error("Error replacing video track:", err);
          }
        }
      }

      // Store screen stream in Firestore with a unique identifier
      const callDoc = firestore.collection("calls").doc(callId);
      await callDoc.update({
        [`screenShare_${beforeCall}`]: {
          active: true,
          sharerIndex: beforeCall,
          timestamp: Date.now(),
        },
      });

      // Add screen share as a virtual remote stream locally (so sharer sees both their camera and screen)
      const newRemoteStreams = [...remoteStreams, screenStream];
      setRemoteStreams(newRemoteStreams);
      
      // Create a video element for the screen share
      const newRemoteVideoRefs = [...remoteVideoRefs, null];
      setRemoteVideoRefs(newRemoteVideoRefs);

      // Handle when screen share stops
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      console.log("Screen share started - sent to remote peers and added locally");
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = async () => {
    // Stop all tracks in the screen stream
    if (screenStreamFeed) {
      screenStreamFeed.getTracks().forEach((track) => track.stop());
    }

    // Replace screen share track back with webcam video in all peer connections
    if (stream) {
      const webcamVideoTrack = stream.getVideoTracks()[0];
      
      for (const pc of pcs) {
        const videoSender = pc.getSenders().find((sender) => sender.track?.kind === "video");
        if (videoSender && webcamVideoTrack) {
          try {
            await videoSender.replaceTrack(webcamVideoTrack);
            console.log("Restored webcam video track for remote peer");
          } catch (err) {
            console.error("Error restoring video track:", err);
          }
        }
      }
    }

    // Remove screen share from remote streams (local virtual participant)
    const screenShareIndex = remoteStreams.findIndex(
      (s) => s && s.id === screenStreamFeed?.id
    );
    
    if (screenShareIndex !== -1) {
      const newRemoteStreams = remoteStreams.filter((_, idx) => idx !== screenShareIndex);
      const newRemoteVideoRefs = remoteVideoRefs.filter((_, idx) => idx !== screenShareIndex);
      
      setRemoteStreams(newRemoteStreams);
      setRemoteVideoRefs(newRemoteVideoRefs);
    }

    setIsScreenSharing(false);
    setScreenStreamFeed(null);

    // Update Firestore - remove the screen share entry
    const callDoc = firestore.collection("calls").doc(callId);
    await callDoc.update({
      [`screenShare_${beforeCall}`]: {
        active: false,
        sharerIndex: beforeCall,
        timestamp: Date.now(),
      },
    });

    console.log("Screen share stopped");
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
  };
};