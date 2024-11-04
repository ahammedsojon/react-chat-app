import { apiSlice } from "../api/apiSlice";
import { messagesApi } from "../messages/messagesApi";

export const conversationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: (email) =>
        `conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=5`,
    }),
    getConversation: builder.query({
      query: ({ userEmail, participantEmail }) =>
        `conversations?participants_like=${userEmail}-${participantEmail}&&participants_like=${participantEmail}-${userEmail}`,
    }),
    addConversation: builder.mutation({
      query: ({ sender, data }) => ({
        url: "/conversations",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        const conversation = await queryFulfilled;
        if (conversation?.data?.id) {
          dispatch(
            apiSlice.util.updateQueryData(
              "getConversations",
              arg.sender,
              (draft) => {
                draft.push(conversation.data);
              }
            )
          );
          const senderUser = arg.data.users.find(
            (user) => user.email === arg.sender
          );
          const receiverUser = arg.data.users.find(
            (user) => user.email !== arg.sender
          );
          dispatch(
            messagesApi.endpoints.addMessage.initiate({
              conversationId: conversation.data.id,
              sender: senderUser,
              receiver: receiverUser,
              message: arg.data.message,
              timestamp: arg.data.timestamp,
            })
          );
        }
      },
    }),
    editConversation: builder.mutation({
      query: ({ id, sender, data }) => {
        return {
          url: `/conversations/${id}`,
          method: "PATCH",
          body: data,
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        // optimistic cache update start
        const patchResult = dispatch(
          apiSlice.util.updateQueryData(
            "getConversations",
            arg.sender,
            (draft) => {
              const draftConversation = draft.find((c) => c.id == arg.id);
              draftConversation.message = arg.data.message;
              draftConversation.timestamp = arg.data.timestamp;
            }
          )
        );
        // optimistic cache update end
        try {
          const conversation = await queryFulfilled;
          if (conversation?.data?.id) {
            const senderUser = arg.data.users.find(
              (user) => user.email === arg.sender
            );
            const receiverUser = arg.data.users.find(
              (user) => user.email !== arg.sender
            );
            const res = await dispatch(
              messagesApi.endpoints.addMessage.initiate({
                conversationId: conversation.data.id,
                sender: senderUser,
                receiver: receiverUser,
                message: arg.data.message,
                timestamp: arg.data.timestamp,
              })
            ).unwrap();

            dispatch(
              apiSlice.util.updateQueryData(
                "getMessages",
                res.conversationId.toString(),
                (draft) => {
                  draft.push(res);
                }
              )
            );
          }
        } catch (error) {
          // if edit conversation request failed
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useAddConversationMutation,
  useEditConversationMutation,
} = conversationsApi;
