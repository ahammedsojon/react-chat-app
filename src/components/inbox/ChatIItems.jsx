import gravatarUrl from "gravatar-url";
import moment from "moment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetConversationsQuery } from "../../app/features/conversations/conversationsApi";
import getPartnerInfo from "../../utils/getPartnerInfo";
import ChatItem from "./ChatItem";

export default function ChatItems() {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  const {
    data: conversations,
    isLoading,
    isError,
    error,
  } = useGetConversationsQuery(email);

  let content = null;
  if (isLoading) {
    content = <li>Loading....</li>;
  } else if (!isLoading && isError) {
    content = <li>{error?.data}</li>;
  } else if (!isLoading && !isError && conversations.length === 0) {
    content = <li>No conversations found!</li>;
  } else {
    content = conversations.map((conversation) => {
      const { id, users, timestamp, message } = conversation;
      const partner = getPartnerInfo(users, email);
      return (
        <li key={id}>
          <Link
            className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none"
            to={`/inbox/${id}`}
          >
            <ChatItem
              avatar={gravatarUrl(partner.email, { size: 80 })}
              name={partner.name}
              lastMessage={message}
              lastTime={moment(timestamp).fromNow()}
            />
          </Link>
        </li>
      );
    });
  }
  return <ul>{content}</ul>;
}
