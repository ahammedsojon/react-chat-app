import gravatarUrl from "gravatar-url";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  conversationsApi,
  useGetConversationsQuery,
} from "../../app/features/conversations/conversationsApi";
import getPartnerInfo from "../../utils/getPartnerInfo";
import ChatItem from "./ChatItem";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";

export default function ChatItems() {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const { data, isLoading, isError, error } = useGetConversationsQuery(email);

  const { data: conversations, totalCount } = data || {};

  const fetchMore = () => {
    setPage((prevState) => prevState + 1);
  };

  useEffect(() => {
    if (page > 1) {
      dispatch(
        conversationsApi.endpoints.getMoreConversations.initiate({
          email,
          page,
        })
      );
    }
  }, [page]);

  useEffect(() => {
    if (totalCount > 0) {
      const more = Math.ceil(totalCount / 10) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);

  let content = null;
  if (isLoading) {
    content = <li>Loading....</li>;
  } else if (!isLoading && isError) {
    content = <li>{error?.data}</li>;
  } else if (!isLoading && !isError && conversations?.length === 0) {
    content = <li>No conversations found!</li>;
  } else {
    content = (
      <InfiniteScroll
        dataLength={conversations.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        height={window.innerHeight - 129}
      >
        {conversations?.map((conversation) => {
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
        })}
      </InfiniteScroll>
    );
  }
  return <ul>{content}</ul>;
}
