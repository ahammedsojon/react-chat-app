import { io } from "socket.io-client";
import { apiSlice } from "../api/apiSlice";
import { messagesApi } from "../messages/messagesApi";

export const conversationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: (email) =>
        `conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=${
          import.meta.env.VITE_CONVERSATIONS_LIMIT
        }`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("X-Total-Count");
        return {
          data: apiResponse,
          totalCount,
        };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        const socket = io("http://localhost:9000", {
          reconnectionDelay: 1000,
          reconnection: true,
          reconnectionAttemps: 10,
          transports: ["websocket"],
          agent: false,
          upgrade: false,
          rejectUnauthorized: false,
        });
        try {
          await cacheDataLoaded;
          socket.on("conversation", (data) => {
            updateCachedData((draft) => {
              console.log("draft: ", draft);
              console.log("data: ", data);
              if (!draft || !draft.data) draft.data = [];
              const conversation = draft.data.find(
                (c) => c.id == data?.data?.id
              );
              if (conversation?.id) {
                conversation.message = data?.data?.message;
                conversation.timestamp = data?.data?.timestamp;
              }
            });
          });
        } catch (error) {
          console.log(error);
        }
        await cacheEntryRemoved;
        socket.close();
      },
    }),
    getMoreConversations: builder.query({
      query: ({ email, page }) =>
        `conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=${page}&_limit=${
          import.meta.env.VITE_CONVERSATIONS_LIMIT
        }`,
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        const conversations = await queryFulfilled;
        if (conversations?.data?.length > 0) {
          // update conversation cache pessimitically start
          dispatch(
            apiSlice.util.updateQueryData(
              "getConversations",
              arg.email,
              (draft) => {
                return {
                  data: [...draft.data, ...conversations.data],
                  totalCount: Number(draft.totalCount),
                };
              }
            )
          );
          // update conversation cache pessimitically end
        }
      },
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
              const draftConversation = draft.data.find((c) => c.id == arg.id);
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
  useGetMoreConversationsQuery,
  useGetConversationQuery,
  useAddConversationMutation,
  useEditConversationMutation,
} = conversationsApi;
