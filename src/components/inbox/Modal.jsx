import { useEffect, useState } from "react";
import isValidEmail from "../../utils/isValidEmail";
import { useGetUserQuery } from "../../app/features/users/usersApi";
import Error from "../ui/Error";
import { useDispatch, useSelector } from "react-redux";
import {
  conversationsApi,
  useAddConversationMutation,
  useEditConversationMutation,
} from "../../app/features/conversations/conversationsApi";

export default function Modal({ open, control }) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [userCheck, setUserCheck] = useState(false);
  const { data: partner } = useGetUserQuery(to, {
    skip: !userCheck,
  });
  const [editConversation, { isSuccess: isEditConversationSuccess }] =
    useEditConversationMutation();
  const [addConversation, { isSuccess: isAddConversationSuccess }] =
    useAddConversationMutation();
  const [conversation, setConversation] = useState(undefined);

  const { user: loggedInUser } = useSelector((state) => state.auth) || {};
  const { email } = useSelector((state) => state.auth.user) || {};
  const dispatch = useDispatch();
  const debounceHandler = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearInterval(timeout);
      timeout = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  };

  const doSearch = (value) => {
    setTo(value);
    // check user API
    if (isValidEmail(value)) {
      setUserCheck(true);
    }
  };

  const handleSearch = debounceHandler(doSearch, 500);

  useEffect(() => {
    if (partner && partner.length > 0 && partner[0].email !== email) {
      dispatch(
        conversationsApi.endpoints.getConversation.initiate({
          userEmail: email,
          participantEmail: partner[0].email,
        })
      )
        .unwrap()
        .then((data) => {
          console.log(data);
          setConversation(data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [partner]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conversation?.length > 0) {
      editConversation({
        id: conversation[0].id,
        sender: email,
        data: {
          ...conversation[0],
          message: message,
          timestamp: new Date().getTime(),
        },
      });
    } else if (conversation?.length === 0) {
      addConversation({
        sender: email,
        data: {
          participants: `${email}-${partner[0]?.email}`,
          users: [loggedInUser, partner[0]],
          message: message,
          timestamp: new Date().getTime(),
        },
      });
    }
    console.log("form submitted!");
  };

  useEffect(() => {
    if (isAddConversationSuccess || isEditConversationSuccess) {
      control();
      setTo("");
      setMessage("");
    }
  }, [isAddConversationSuccess, isEditConversationSuccess]);
  return (
    open && (
      <>
        <div
          onClick={control}
          className="fixed w-full h-full inset-0 z-10 bg-black/50 cursor-pointer"
        ></div>
        <div className="rounded w-[400px] lg:w-[600px] space-y-8 bg-white p-10 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Send message
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="to" className="sr-only">
                  To
                </label>
                <input
                  id="to"
                  name="to"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
                  placeholder="Send to"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  type="message"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                disabled={
                  !conversation ||
                  (partner && partner.length > 0 && partner[0].email === email)
                }
              >
                Send Message
              </button>
            </div>

            {partner && partner.length === 0 && (
              <Error message="There user doesn't exist!" />
            )}

            {partner && partner.length > 0 && partner[0].email === email && (
              <Error message="You can't sent message to yourself!" />
            )}
          </form>
        </div>
      </>
    )
  );
}
