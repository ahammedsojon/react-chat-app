import { io } from "socket.io-client";
import { apiSlice } from "../api/apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_page=1&_limit=${
          import.meta.env.VITE_MESSAGES_LIMIT
        }&_sort=timestamp&_order=desc`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("x-total-count");
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
          socket.on("message", (data) => {
            updateCachedData((draft) => {
              if (!draft || !draft.data) draft.data = [];
              console.log(
                "messages draft: ",
                JSON.parse(JSON.stringify(draft))
              );
              console.log("message data: ", data);

              return {
                data: [...draft.data, data?.data],
                totalCount: Number(draft.totalCount),
              };
            });
          });
        } catch (error) {
          console.log(error);
        }
        await cacheEntryRemoved;
        socket.close();
      },
    }),
    getMoreMessages: builder.query({
      query: ({ id, page }) =>
        `/messages?conversationId=${id}&_page=${page}&_limit=${
          import.meta.env.VITE_MESSAGES_LIMIT
        }&_sort=timestamp&_order=desc`,
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        const messages = await queryFulfilled;
        if (messages?.data?.length > 0) {
          // update conversation cache pessimitically start
          dispatch(
            apiSlice.util.updateQueryData("getMessages", arg.id, (draft) => {
              return {
                data: [...draft.data, ...messages.data],
                totalCount: Number(draft.totalCount),
              };
            })
          );
          // update conversation cache pessimitically end
        }
      },
    }),
    addMessage: builder.mutation({
      query: (data) => ({
        url: `/messages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messagesApi;
