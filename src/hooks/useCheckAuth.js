import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "../app/features/auth/authSlice";

const useCheckAuth = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    let auth = localStorage.getItem("auth");
    if (auth) {
      auth = JSON.parse(auth);
      if (auth?.accessToken && auth?.user) {
        dispatch(
          userLoggedIn({
            accessToken: auth.accessToken,
            user: auth.user,
          })
        );
      }
    }

    setAuthChecked(true);
  }, []);

  return authChecked;
};

export default useCheckAuth;
