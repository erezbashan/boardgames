import { useState, useRef, useEffect } from 'react';
import { SplendorGameState } from './types';
import { generateAnimationSteps } from './animationQueue';

export function useVisualGameState(actualState: SplendorGameState): SplendorGameState {
   const [visualState, setVisualState] = useState<SplendorGameState>(actualState);
   const queueRef = useRef<SplendorGameState[]>([]);
   const isAnimatingRef = useRef(false);
   const timeoutRef = useRef<any>(null);

   useEffect(() => {
     const lastTarget = queueRef.current.length > 0 ? queueRef.current[queueRef.current.length - 1] : visualState;
     
     // Only sequence if it's a real turn progression
     if (!actualState.logs || actualState.logs.length === 0 || actualState.logs.length === lastTarget.logs?.length) {
        if (queueRef.current.length === 0) {
           setVisualState(actualState);
        } else {
           queueRef.current[queueRef.current.length - 1] = actualState;
        }
        return;
     }

     const steps = generateAnimationSteps(lastTarget, actualState);
     queueRef.current.push(...steps);

     if (!isAnimatingRef.current) {
       playNext();
     }
   }, [actualState]);

   const playNext = () => {
      if (queueRef.current.length === 0) {
         isAnimatingRef.current = false;
         return;
      }
      isAnimatingRef.current = true;
      const nextState = queueRef.current.shift()!;
      setVisualState(nextState);
      
      timeoutRef.current = setTimeout(playNext, 400); // 400ms per step
   };

   useEffect(() => () => clearTimeout(timeoutRef.current), []);

   return visualState;
}
