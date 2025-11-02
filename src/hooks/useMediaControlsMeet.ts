import toast from "react-hot-toast";

export const useMediaControlsMeet = (
  micEnabled: boolean,
  setMicEnabled: any,
  videoEnabled: boolean,
  setVideoEnabled: any,
  stream: MediaStream | null,
  webcamVideoRef: React.RefObject<HTMLVideoElement | null>,
  pcs: RTCPeerConnection[],
  localStreamRef: { current: MediaStream | null }
) => {
  const copyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        toast.success("Link copied");
      })
      .catch((error) => {
        console.error("Failed to copy link: ", error);
      });
  };

  const handleMicToggle = async () => {
    console.log("=== MIC TOGGLE START ===");
    console.log("Current mic status:", micEnabled);
    console.log("Stream exists:", !!stream);
    console.log("LocalStreamRef exists:", !!localStreamRef.current);
    console.log("Number of peer connections:", pcs.length);
    
    const newMicState = !micEnabled;
    setMicEnabled(newMicState);
    sessionStorage.setItem("micEnabled", newMicState.toString());
    
    let audioTrackFound = false;
    let allAudioTracks: MediaStreamTrack[] = [];
    
    // Collect all audio tracks
    if (stream) {
      const audioTrack = stream.getTracks().find((track: MediaStreamTrack) => track.kind === "audio");
      if (audioTrack) {
        allAudioTracks.push(audioTrack);
        audioTrack.enabled = newMicState;
        audioTrackFound = true;
        console.log(`✓ Stream audio track ${newMicState ? 'enabled' : 'disabled'}, ID: ${audioTrack.id}`);
      } else {
        console.log("✗ No audio track in stream");
      }
    }
    
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getTracks().find((track: MediaStreamTrack) => track.kind === "audio");
      if (audioTrack && !allAudioTracks.includes(audioTrack)) {
        allAudioTracks.push(audioTrack);
        audioTrack.enabled = newMicState;
        audioTrackFound = true;
        console.log(`✓ LocalStreamRef audio track ${newMicState ? 'enabled' : 'disabled'}, ID: ${audioTrack.id}`);
      }
    }
    
    // Update all peer connections - disable the sender's track directly
    let peerConnectionsUpdated = 0;
    pcs.forEach((pc, index) => {
      const senders = pc.getSenders();
      console.log(`Peer ${index} has ${senders.length} senders`);
      
      senders.forEach((sender, senderIndex) => {
        if (sender.track?.kind === "audio") {
          sender.track.enabled = newMicState;
          peerConnectionsUpdated++;
          console.log(`✓ Peer ${index} sender ${senderIndex} audio ${newMicState ? 'enabled' : 'disabled'}, Track ID: ${sender.track.id}`);
        }
      });
    });
    
    console.log(`Total audio tracks found: ${allAudioTracks.length}`);
    console.log(`Updated ${peerConnectionsUpdated} peer connection audio senders`);
    
    // Verify the state
    setTimeout(() => {
      console.log("=== VERIFICATION ===");
      allAudioTracks.forEach((track, i) => {
        console.log(`Audio track ${i} enabled state: ${track.enabled}`);
      });
      pcs.forEach((pc, index) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "audio") {
            console.log(`Peer ${index} audio sender enabled: ${sender.track.enabled}`);
          }
        });
      });
    }, 100);
    
    if (!audioTrackFound && peerConnectionsUpdated === 0) {
      console.error("⚠️ WARNING: No audio tracks found to toggle!");
      toast.error("Microphone not initialized. Please refresh and allow camera/mic access.");
    } else {
      toast.success(newMicState ? "Microphone on" : "Microphone muted");
    }
    
    console.log("=== MIC TOGGLE END ===");
  };

  const handleVideoToggle = async () => {
    console.log("Video status is ", videoEnabled);
    sessionStorage.setItem("videoEnabled", (!videoEnabled).toString());
    setVideoEnabled(!videoEnabled);
  
    if (!videoEnabled) {
      // Enable video
      try {
        // Only get video track, not audio (to preserve mic mute state)
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream; // Keep existing stream
        }
  
        if (stream) {
          const existingVideoTrack = stream.getVideoTracks()[0];
          if (existingVideoTrack) stream.removeTrack(existingVideoTrack);
  
          const newVideoTrack = newStream.getVideoTracks()[0];
          stream.addTrack(newVideoTrack);
          
          // Stop the old video stream
          newStream.getTracks().forEach(track => {
            if (track.kind === 'video' && track !== newVideoTrack) {
              track.stop();
            }
          });
        }
  
        pcs.forEach((pc) => {
          const sender = pc.getSenders().find((sender) => sender.track?.kind === "video");
          sender?.replaceTrack(stream?.getVideoTracks()[0] || null);
        });
  
        console.log("Stream tracks after enabling is ", stream?.getVideoTracks());
      } catch (error) {
        console.error("Error re-enabling video:", error);
      }
    } else {
      // Disable video and show "camera disabled" image
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
        console.log("Stream tracks after disabling is ", stream?.getVideoTracks());
  
        // Create a canvas for the "camera disabled" image
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const context = canvas.getContext("2d");
        const image = new Image();
        image.src = "/camera_disabled.png";
  
        image.onload = async () => {
          context!.drawImage(image, 0, 0, canvas.width, canvas.height);
  
          // Continuously refresh the canvas to keep the video track active
          const keepVideoActive = () => {
            context!.globalAlpha = 0.99;
            context!.fillRect(0, 0, 1, 1);
            requestAnimationFrame(keepVideoActive);
          };
          keepVideoActive();
  
          const videoStream = canvas.captureStream();
  
          if (stream) {
            // Preserve current audio state before replacing video
            const currentAudioTracks = stream.getAudioTracks();
            const audioEnabled = currentAudioTracks.length > 0 ? currentAudioTracks[0].enabled : true;
            
            // Remove old video track
            stream.getVideoTracks().forEach(track => stream.removeTrack(track));
            stream.addTrack(videoStream.getVideoTracks()[0]);
  
            // IMPORTANT: Keep existing audio tracks and their enabled state
            // Don't create new audio stream - preserve the mute state!
            if (currentAudioTracks.length > 0) {
              console.log(`Preserving audio track with enabled state: ${audioEnabled}`);
              // Audio tracks are already in the stream, just keep them
            }
  
            if (webcamVideoRef.current) {
              webcamVideoRef.current.srcObject = stream;
            }
  
            pcs.forEach((pc) => {
              const sender = pc.getSenders().find((sender) => sender.track?.kind === "video");
              sender?.replaceTrack(stream.getVideoTracks()[0]);
            });
  
            console.log("Local Stream tracks after image change is ", stream.getTracks());
            console.log("Replaced video feed with camera disabled image.");
          }
        };
      }
    }
  };

  return {
    copyLink,
    handleMicToggle,
    handleVideoToggle,
  };
};