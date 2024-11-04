// import Blank from "./Blank";
import { useParams } from "react-router-dom";
import ChatHead from "./ChatHead";
import Messages from "./Messages";
import Options from "./Options";
import { useGetMessagesQuery } from "../../../app/features/messages/messagesApi";

export default function ChatBody() {
  const { id } = useParams();
  const { data: messages, isLoading, isError, error } = useGetMessagesQuery(id);
  let content = null;
  if (isLoading) {
    content = <div>Loading....</div>;
  } else if (!isLoading && isError) {
    content = <div>{error?.data}</div>;
  } else if (!isLoading && !isError && messages?.length === 0) {
    content = <div>No messages found!</div>;
  } else {
    content = (
      <>
        <ChatHead message={messages[0]} />
        <Messages messages={messages} />
        <Options info={messages[0]} />
      </>
    );
  }

  return (
    <div className="w-full lg:col-span-2 lg:block">
      <div className="w-full grid conversation-row-grid">
        {content}
        {/* <Blank /> */}
      </div>
    </div>
  );
}
