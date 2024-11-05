import { useDispatch, useSelector } from "react-redux";
import Message from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";
import { messagesApi } from "../../../app/features/messages/messagesApi";

export default function Messages({ messages = [], id, totalCount }) {
  const { email } = useSelector((state) => state.auth.user) || {};
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const fetchMore = () => {
    setPage((prevState) => prevState + 1);
  };

  useEffect(() => {
    console.log(page);

    if (page > 1) {
      dispatch(
        messagesApi.endpoints.getMoreMessages.initiate({
          id,
          page,
        })
      );
    }
  }, [page]);

  useEffect(() => {
    if (totalCount > 0) {
      const more =
        Math.ceil(totalCount / import.meta.env.VITE_MESSAGES_LIMIT) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);
  return (
    <div
      className="relative w-full h-[calc(100vh_-_197px)] p-6 overflow-y-auto flex flex-col-reverse"
      id="scrollableDiv"
    >
      <InfiniteScroll
        dataLength={messages?.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={
          <p style={{ textAlign: "center" }}>
            <b>Loading......</b>
          </p>
        }
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>Yay! You have seen it all.</b>
          </p>
        }
        inverse={true} //
        style={{ display: "flex", flexDirection: "column-reverse" }} //To put endMessage and loader to the top.
        scrollableTarget="scrollableDiv"
      >
        <ul className="space-y-2 messages">
          {messages
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => {
              const { id, message: lastMessage, sender } = message || {};
              const justify = sender.email !== email ? "start" : "end";
              return (
                <Message key={id} justify={justify} message={lastMessage} />
              );
            })}
        </ul>
      </InfiniteScroll>
    </div>
  );
}
