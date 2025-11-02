import { useEffect } from "react";

export const useMeetAuthEffect = (
  user: any,
  webcamButtonRef: React.RefObject<HTMLButtonElement | null>,
  answerButtonRef: React.RefObject<HTMLButtonElement | null>,
  startWebcam: () => Promise<boolean>,
  handleAnswerButtonClick: () => Promise<void>
) => {
  useEffect(() => {
    // No authentication required for meet page - participants can join anonymously
    
    if (webcamButtonRef.current) {
      webcamButtonRef.current.onclick = startWebcam;
    }
    if (answerButtonRef.current) {
      answerButtonRef.current.onclick = handleAnswerButtonClick;
    }
  }, []);
};