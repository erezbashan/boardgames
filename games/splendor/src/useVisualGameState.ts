import { useState, useRef, useEffect } from 'react';
import { SplendorGameState } from './types';
import { generateAnimationSteps } from './animationQueue';

export function useVisualGameState(actualState: SplendorGameState): SplendorGameState {
   const [visualState, setVisualState] = useState<SplendorGameState>(actualState);
   const queueRef = useRef<SplendorGameState[]>([]);
   const isAnimatingRef = useRef(false);
   const timeoutRef = useRef<any>(null);
   
   // Keep track of the current speed setting
   const speedRef = useRef(actualState.settings?.gameSpeed || 'Normal');
   useEffect(() => {
     speedRef.current = actualState.settings?.gameSpeed || 'Normal';
   }, [actualState.settings?.gameSpeed]);

   useEffect(() => {
     // If in Ultra, skip all animations
     if (speedRef.current === 'Ultra') {
        queueRef.current = [];
        setVisualState(actualState);
        return;
     }

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
      if (queueRef.current.length === 0 || speedRef.current === 'Ultra') {
         isAnimatingRef.current = false;
         if (speedRef.current === 'Ultra') setVisualState(queueRef.current[queueRef.current.length - 1] || visualState);
         return;
      }
      isAnimatingRef.current = true;
      const nextState = queueRef.current.shift()!;
      setVisualState(nextState);
      
      let delay = 400; // Normal
      if (speedRef.current === 'Fast') delay = 200;
      if (speedRef.current === 'Slow') delay = 800;
      
      timeoutRef.current = setTimeout(playNext, delay);
   };

   useEffect(() => () => clearTimeout(timeoutRef.current), []);

   return visualState;
}
