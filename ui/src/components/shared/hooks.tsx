import React, { useEffect } from "react";
import { useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState } from "../../state/reducers";

export const useMountedState = () => {
  let mountedRef = React.useRef<boolean>(false);
  const isMounted = React.useCallback(() => mountedRef.current, []);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  return isMounted;
};

export const useStateSelector: TypedUseSelectorHook<RootState> = useSelector;
